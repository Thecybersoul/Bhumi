-- ═══════════════════════════════════════════════════════════
-- 012 — Named admin accounts, an activity trail, and meetings
--
-- admin_users   One row per person with admin access. Passwords
--               are scrypt hashes, never plaintext; accounts are
--               created by scripts/create-admin-users.js, not by
--               this file, so no credential ever lands in the repo.
--
-- activity_log  Append-only. Every create / update / delete made
--               through the API is written here with who did it and,
--               for updates, which fields changed from what to what.
--
-- created_by / updated_by / updated_at on every ERP table, so a
-- record can say who added it and who touched it last without a
-- join. They hold the person's display name, like entity_label.
--
-- meetings      Physical meetings, calls, site visits and
--               discussions, each optionally tied to a listing,
--               deal, task or lead. Meetings that used to live
--               inside a transaction's JSON array are copied in.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  role                 TEXT NOT NULL DEFAULT 'Admin',
  password_hash        TEXT NOT NULL,
  active               BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at        TIMESTAMPTZ,
  password_changed_at  TIMESTAMPTZ
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS activity_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      TEXT,
  actor_name    TEXT NOT NULL DEFAULT 'System',
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT,
  entity_label  TEXT DEFAULT '',
  summary       TEXT DEFAULT '',
  changes       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity  ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_actor   ON activity_log(actor_id);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['properties','transactions','leads','notes','tasks','documents','verification_cases','data_room_requests']
  LOOP
    IF to_regclass(t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT ''''', t);
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT ''''', t);
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ', t);
    END IF;
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS meetings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  kind             TEXT NOT NULL DEFAULT 'In person'
                     CHECK (kind IN ('In person','Site visit','Call','Video call','Discussion')),
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_min     INT NOT NULL DEFAULT 30,
  location         TEXT DEFAULT '',
  attendees        TEXT DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','Completed','Cancelled')),
  agenda           TEXT DEFAULT '',
  outcome          TEXT DEFAULT '',
  entity_type      TEXT NOT NULL DEFAULT 'general'
                     CHECK (entity_type IN ('property','transaction','task','lead','verification','general')),
  entity_id        TEXT,
  entity_label     TEXT DEFAULT '',
  google_event_id  TEXT,
  google_meet_url  TEXT,
  legacy_id        TEXT,
  created_by       TEXT DEFAULT '',
  updated_by       TEXT DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_meetings_when   ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_entity ON meetings(entity_type, entity_id);
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Carry over meetings stored inside transactions (007's JSON array).
INSERT INTO meetings (title, kind, scheduled_at, status, outcome, attendees, entity_type, entity_id, entity_label, legacy_id, created_by)
SELECT COALESCE(NULLIF(m->>'title',''), 'Meeting'),
       'In person',
       (m->>'scheduled_at')::timestamptz,
       CASE WHEN m->>'status' IN ('Scheduled','Completed','Cancelled') THEN m->>'status' ELSE 'Scheduled' END,
       COALESCE(m->>'notes',''),
       COALESCE(m->>'with',''),
       'transaction', t.id::text, t.reference || ' · ' || t.property_label,
       m->>'id', 'Imported'
FROM transactions t, jsonb_array_elements(COALESCE(t.meetings, '[]'::jsonb)) m
WHERE m->>'scheduled_at' IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM meetings x WHERE x.legacy_id = m->>'id');

-- A task, note or document can now also hang off a meeting.
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_entity_type_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_entity_type_check
  CHECK (entity_type IN ('lead','transaction','property','verification','meeting','general'));
ALTER TABLE tasks ALTER COLUMN entity_id TYPE TEXT USING entity_id::text;

ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_entity_type_check;
ALTER TABLE notes ADD CONSTRAINT notes_entity_type_check
  CHECK (entity_type IN ('lead','transaction','property','verification','meeting','general'));
ALTER TABLE notes ALTER COLUMN entity_id TYPE TEXT USING entity_id::text;

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_entity_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_entity_type_check
  CHECK (entity_type IN ('property','note','transaction','lead','verification','meeting','task','general'));

-- Who connected the shared Google account, and which account it is.
ALTER TABLE google_auth ADD COLUMN IF NOT EXISTS connected_email TEXT DEFAULT '';
ALTER TABLE google_auth ADD COLUMN IF NOT EXISTS connected_by TEXT DEFAULT '';
