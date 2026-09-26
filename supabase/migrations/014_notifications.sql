-- ═══════════════════════════════════════════════════════════
-- 014 — Notifications
--
-- The notification feed is the activity trail seen from one
-- person's side (what everyone else did, plus website enquiries),
-- so it needs no table of its own. Each person just needs:
--   notifications_seen_at  where their unread count starts;
--   notify_prefs           which daily emails they want, e.g.
--                          {"digest_email": true}.
-- Phone reminders (meetings, due tasks, the morning digest) are
-- scheduled on the phone itself, and their settings live there.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS notifications_seen_at TIMESTAMPTZ;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS notify_prefs JSONB NOT NULL DEFAULT '{"digest_email": true}'::jsonb;
