-- ═══════════════════════════════════════════════════════════
-- 011 — Documents
--
-- Title deeds, ECs, RTCs, khata extracts, conversion orders,
-- survey sketches, agreements: the paper a land deal runs on,
-- attached to the record it belongs to. `entity_type`/`entity_id`
-- point at a listing, note, transaction, lead or verification
-- case — the same shape notes and tasks already use, except
-- `entity_id` is TEXT so a listing can be addressed by its code.
--
-- A file lives in one of two places, recorded in `storage`:
--   'supabase' — the private `documents` bucket; `path` is the
--                object key and the app hands out short-lived
--                signed URLs, never a public link.
--   'drive'    — the connected Google Drive; `drive_file_id` and
--                `url` (the Drive web view link). Also used for a
--                Drive file that was linked rather than uploaded.
--
-- `google_auth.scope` records what the admin actually granted, so
-- the app can tell a calendar-only connection (made before Drive
-- was added) from one that can also write documents.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type    TEXT NOT NULL DEFAULT 'general'
                   CHECK (entity_type IN ('property','note','transaction','lead','verification','general')),
  entity_id      TEXT,
  entity_label   TEXT DEFAULT '',
  name           TEXT NOT NULL,
  category       TEXT DEFAULT 'Other',
  mime           TEXT DEFAULT '',
  bytes          BIGINT,
  storage        TEXT NOT NULL DEFAULT 'supabase' CHECK (storage IN ('supabase','drive')),
  path           TEXT,
  drive_file_id  TEXT,
  url            TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_entity  ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

ALTER TABLE google_auth ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT '';
