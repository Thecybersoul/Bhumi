-- ═══════════════════════════════════════════════════════════
-- 018 — Team messages
--
-- Internal chat for the admins: one "Bhumi team" room everyone is
-- in, and a direct conversation for each pair of people.
--   conversations   the team room (key 'team') and one row per pair
--                   (key 'dm:<lower id>:<higher id>'), made on first use;
--   messages        text, optional files (ERP document ids) and an
--                   optional link to a record (a listing, deal, lead…);
--   message_reads   where each person has read up to, per conversation.
-- Messages are not part of the activity trail; the trail records what
-- happened to records, and chat stays between the people in it.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind             TEXT NOT NULL CHECK (kind IN ('team', 'direct')),
  key              TEXT NOT NULL UNIQUE,
  title            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at  TIMESTAMPTZ
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

INSERT INTO conversations (kind, key, title) VALUES ('team', 'team', 'Bhumi team')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  author_id        UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  author_name      TEXT NOT NULL,
  body             TEXT NOT NULL DEFAULT '',
  attachments      JSONB NOT NULL DEFAULT '[]'::jsonb,
  entity_type      TEXT,
  entity_id        TEXT,
  entity_label     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at        TIMESTAMPTZ,
  deleted_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS messages_conversation_time ON messages (conversation_id, created_at DESC);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS message_reads (
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  last_read_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
