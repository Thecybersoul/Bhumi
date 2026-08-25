-- ═══════════════════════════════════════════════════════════
-- 006 — Editable site
--
-- Everything the public site renders becomes editable from the
-- dashboard. Two shapes cover it:
--
--   site_content   one row per named block of page copy, value
--                  held as JSONB so a block can gain a field
--                  without a migration
--   media          every uploaded image, video or document, with
--                  the metadata needed to pick one in the admin
--
-- plus tables for the repeatable collections the site lists —
-- billboards, designs and insights — which are structured enough
-- to deserve columns rather than a JSON blob.
--
-- Safe to run more than once: every statement is guarded, and
-- nothing existing is dropped or renamed.
-- ═══════════════════════════════════════════════════════════

-- ─── Page copy ─────────────────────────────────────────────
-- `key` matches a block declared in lib/content/schema.ts. A key
-- with no row here falls back to the value compiled into the
-- codebase, so the site renders correctly before anything is
-- edited and cannot be emptied by accident.
CREATE TABLE IF NOT EXISTS site_content (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT
);

CREATE INDEX IF NOT EXISTS site_content_updated_idx ON site_content (updated_at DESC);

-- ─── Media library ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path         TEXT NOT NULL UNIQUE,      -- object path inside the bucket
  url          TEXT NOT NULL,             -- public URL as served
  kind         TEXT NOT NULL DEFAULT 'image'
               CHECK (kind IN ('image', 'video', 'document')),
  mime         TEXT,
  bytes        BIGINT,
  width        INTEGER,
  height       INTEGER,
  -- Alt text is required for images at the point of use, not here,
  -- so an upload is never blocked mid-flow.
  alt          TEXT,
  title        TEXT,
  folder       TEXT NOT NULL DEFAULT 'general',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_kind_idx    ON media (kind);
CREATE INDEX IF NOT EXISTS media_folder_idx  ON media (folder);
CREATE INDEX IF NOT EXISTS media_created_idx ON media (created_at DESC);

-- ─── Outdoor advertising inventory ─────────────────────────
CREATE TABLE IF NOT EXISTS billboards (
  id             TEXT PRIMARY KEY,
  position       INTEGER NOT NULL DEFAULT 0,
  number         TEXT,
  name           TEXT NOT NULL,
  zone           TEXT NOT NULL DEFAULT 'Central',
  location       TEXT,
  size           TEXT,
  area           TEXT,
  traffic_from   TEXT[] NOT NULL DEFAULT '{}',
  going_towards  TEXT[] NOT NULL DEFAULT '{}',
  coordinates    TEXT,
  image          TEXT,
  image_is_map   BOOLEAN NOT NULL DEFAULT false,
  available_from TEXT,
  published      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billboards_order_idx ON billboards (position, created_at);

-- ─── Design and build renders ──────────────────────────────
CREATE TABLE IF NOT EXISTS designs (
  id         TEXT PRIMARY KEY,
  position   INTEGER NOT NULL DEFAULT 0,
  image      TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'Exterior'
             CHECK (kind IN ('Exterior', 'Interior')),
  title      TEXT NOT NULL,
  note       TEXT,
  published  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS designs_order_idx ON designs (position, created_at);

-- ─── Insights ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insights (
  slug          TEXT PRIMARY KEY,
  position      INTEGER NOT NULL DEFAULT 0,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'Regulation',
  excerpt       TEXT,
  author        TEXT,
  published_on  DATE,
  read_minutes  INTEGER,
  hero_image    TEXT,
  -- Ordered blocks: [{ heading?, text }]
  body          JSONB NOT NULL DEFAULT '[]'::jsonb,
  published     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS insights_order_idx ON insights (position, published_on DESC);

-- ─── Touch updated_at on write ─────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_content_touch ON site_content;
CREATE TRIGGER site_content_touch
  BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─── Row level security ────────────────────────────────────
-- The site reads through the service role on the server, and the
-- admin writes through the same. No anon access is granted, so an
-- anon key leaking cannot read or write content.
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE media        ENABLE ROW LEVEL SECURITY;
ALTER TABLE billboards   ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights     ENABLE ROW LEVEL SECURITY;
