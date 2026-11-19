-- ═══════════════════════════════════════════════════════════
-- 029 — Names saved in the WhatsApp Business app
--
-- With coexistence, Meta sends the phone's address book once
-- (smb_app_state_sync) and then every change to it. Past chats
-- (history) arrive with numbers only, so the name the business saved
-- for a number is kept here and used for the chat title and for the
-- Personal list's "saved name" rule.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wa_contacts (
  phone_norm  TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE wa_contacts ENABLE ROW LEVEL SECURITY;
