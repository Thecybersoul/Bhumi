-- ═══════════════════════════════════════════════════════════
-- 025 — WhatsApp capture, phase 0 (docs/specs/zero-cost-operating-plan.md)
--
-- Business conversations reach the ERP (a chat export uploaded in the
-- Inbox, a message shared from the app, or Meta's webhook once Sanjog's
-- number is connected), wait in a queue, and are filed by Claude through
-- the connector (a Claude Pro scheduled task or a person's Claude app).
--
-- Personal chats never get in: lib/capture.ts checks capture_rules before
-- anything is stored. Unknown chats are held, never handed to Claude, and
-- deleted after 7 days unless marked Business.
--
-- Additive and reversible: four new tables, nothing else touched.
--   rollback:  DROP TABLE wa_messages, capture_batches, wa_threads, capture_rules;
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capture_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        TEXT NOT NULL CHECK (kind IN ('personal', 'business')),
  match_type  TEXT NOT NULL CHECK (match_type IN ('phone', 'name', 'group')),
  value       TEXT NOT NULL,          -- as typed, for display
  value_norm  TEXT NOT NULL,          -- phone: digits with 91; name/group: lower-case, single spaces
  note        TEXT NOT NULL DEFAULT '',
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_type, value_norm)
);

CREATE TABLE IF NOT EXISTS wa_threads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT NOT NULL UNIQUE,   -- 'wa:<phone_norm>' | 'group:<name>' | 'chat:<name>'
  title           TEXT NOT NULL,
  is_group        BOOLEAN NOT NULL DEFAULT false,
  phone_norm      TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('business', 'unknown')),
  source          TEXT NOT NULL DEFAULT 'export',  -- where it first came from
  last_message_at TIMESTAMPTZ,
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS capture_batches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claimed_by  TEXT,                 -- the person whose connector link claimed it
  claimed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  done_at     TIMESTAMPTZ,
  messages    INTEGER NOT NULL DEFAULT 0,
  summary     TEXT NOT NULL DEFAULT '',
  records     JSONB NOT NULL DEFAULT '[]'::jsonb   -- [{type,id,label}] the run created or changed
);

CREATE TABLE IF NOT EXISTS wa_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id     UUID NOT NULL REFERENCES wa_threads(id) ON DELETE CASCADE,
  external_id   TEXT NOT NULL UNIQUE,   -- Meta's wamid, or a hash for exports and shares (re-imports don't duplicate)
  source        TEXT NOT NULL CHECK (source IN ('export', 'share', 'notification', 'webhook')),
  from_me       BOOLEAN NOT NULL DEFAULT false,
  sender_name   TEXT NOT NULL DEFAULT '',
  sender_phone  TEXT NOT NULL DEFAULT '',
  sent_at       TIMESTAMPTZ NOT NULL,
  kind          TEXT NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'other')),
  body          TEXT NOT NULL DEFAULT '',
  media_ref     TEXT NOT NULL DEFAULT '',   -- Meta media id or the exported file name
  hint          JSONB,                       -- what lib/whatsapp/parse.ts read in it, for Claude
  state         TEXT NOT NULL DEFAULT 'queued' CHECK (state IN ('queued', 'claimed', 'filed', 'skipped')),
  attempts      INTEGER NOT NULL DEFAULT 0,
  batch_id      UUID REFERENCES capture_batches(id) ON DELETE SET NULL,
  claimed_at    TIMESTAMPTZ,
  outcome       TEXT NOT NULL DEFAULT '',    -- what Claude did with it, in a line
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wa_messages_queue ON wa_messages (state, sent_at);
CREATE INDEX IF NOT EXISTS wa_messages_thread ON wa_messages (thread_id, sent_at);
CREATE INDEX IF NOT EXISTS wa_threads_status ON wa_threads (status, last_message_at);

ALTER TABLE capture_rules   ENABLE ROW LEVEL SECURITY;  -- service role only, like every ERP table
ALTER TABLE wa_threads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_batches ENABLE ROW LEVEL SECURITY;
