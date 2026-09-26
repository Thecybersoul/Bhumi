-- ═══════════════════════════════════════════════════════════
-- 013 — Gmail and Sheets
--
-- emails        Every email sent from the ERP through the company
--               Gmail account (info@bhumiestates.in): who sent it, to
--               whom, which listing / deal / lead / meeting it was
--               about, and what was attached. The Gmail message id
--               ties it back to the Sent folder.
--
-- app_settings  Small key → JSON store for integration state that is
--               not a record, e.g. the id of the Google Sheets
--               register and when it was last synced. Kept apart from
--               google_auth, which is replaced wholesale on reconnect.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS emails (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_addresses      TEXT NOT NULL,
  cc_addresses      TEXT DEFAULT '',
  subject           TEXT NOT NULL,
  body              TEXT NOT NULL,
  attachments       JSONB NOT NULL DEFAULT '[]'::jsonb,
  entity_type       TEXT NOT NULL DEFAULT 'general',
  entity_id         TEXT,
  entity_label      TEXT DEFAULT '',
  gmail_message_id  TEXT,
  gmail_thread_id   TEXT,
  created_by        TEXT DEFAULT '',
  updated_by        TEXT DEFAULT '',
  updated_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_emails_entity  ON emails(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_emails_created ON emails(created_at DESC);
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
