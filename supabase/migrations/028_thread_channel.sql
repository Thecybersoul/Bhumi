-- ═══════════════════════════════════════════════════════════
-- 028 — Which channel a captured chat belongs to
--
-- wa_threads holds WhatsApp chats and Instagram DMs and comments alike.
-- `channel` says which, and `ext_id` holds the Instagram user id a DM
-- reply goes to (never a phone number, so a WhatsApp send can't reach it).
--
-- Additive and reversible.
--   rollback:  ALTER TABLE wa_threads DROP COLUMN channel, DROP COLUMN ext_id;
-- ═══════════════════════════════════════════════════════════

ALTER TABLE wa_threads ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'instagram'));
ALTER TABLE wa_threads ADD COLUMN IF NOT EXISTS ext_id  TEXT NOT NULL DEFAULT '';

UPDATE wa_threads SET channel = 'instagram' WHERE title LIKE 'Instagram %';
