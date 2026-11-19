-- ═══════════════════════════════════════════════════════════
-- 027 — Instagram through Meta's API (Instagram API with Instagram Login)
--
-- ig_accounts: the firm's Instagram professional account, connected once
-- from the ERP. ig_posts: posts made in the ERP or by Claude, drafted,
-- scheduled and published through the API. Publishing always needs a
-- person: a draft is published only when someone approves it (in the ERP,
-- or by asking Claude explicitly).
--
-- Additive and reversible.
--   rollback:  DROP TABLE ig_posts, ig_accounts;
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ig_accounts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ig_user_id       TEXT NOT NULL UNIQUE,
  username         TEXT NOT NULL DEFAULT '',
  token            TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected')),
  last_error       TEXT NOT NULL DEFAULT '',
  connected_by     TEXT,
  connected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ig_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  kind          TEXT NOT NULL DEFAULT 'image' CHECK (kind IN ('image', 'carousel', 'reel')),
  image_urls    JSONB NOT NULL DEFAULT '[]'::jsonb,   -- public https URLs (JPEG), up to 10
  video_url     TEXT NOT NULL DEFAULT '',             -- public https URL (MP4) for a reel
  caption       TEXT NOT NULL DEFAULT '',
  property_id   UUID,                                 -- the listing it is about, if any
  scheduled_at  TIMESTAMPTZ,
  published_at  TIMESTAMPTZ,
  ig_media_id   TEXT NOT NULL DEFAULT '',
  permalink     TEXT NOT NULL DEFAULT '',
  error         TEXT NOT NULL DEFAULT '',
  approved_by   TEXT,
  created_by    TEXT,
  updated_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ig_posts_due ON ig_posts (status, scheduled_at);

ALTER TABLE ig_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ig_posts    ENABLE ROW LEVEL SECURITY;
