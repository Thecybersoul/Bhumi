-- ═══════════════════════════════════════════════════════════
-- 009 — Google Calendar / Meet sync
--
-- One admin, one Google account: `google_auth` holds exactly one
-- row, the refresh token from the OAuth consent flow. A task can
-- be synced to a calendar event with an auto-generated Meet link;
-- the two new columns on `tasks` record which event it became.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS google_auth (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refresh_token TEXT NOT NULL,
  access_token  TEXT,
  expiry_date   BIGINT,
  connected_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_meet_url TEXT;
