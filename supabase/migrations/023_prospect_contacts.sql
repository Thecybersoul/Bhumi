-- ═══════════════════════════════════════════════════════════
-- 023 — People and lines at a prospect (prospect_contacts)
--
-- A prospect has one primary number (prospects.phone, unchanged) and
-- often more: a named decision-maker, a land-acquisition head, a
-- marketing lead, a head office, a branch line. One row here per person
-- or line, each with its own phone, so each gets its own Call and
-- WhatsApp button.
--
-- Additive and reversible: one new table, nothing else touched.
--   rollback:  DROP TABLE prospect_contacts;
--
-- Backfill (idempotent, invents nothing):
--   · prospects.contact_person ("Name (Role)") → one row with that name and
--     role, no phone. We do not know which line is theirs, so none is set.
--   · prospects.note "Other published lines: …" → one row per number, named
--     by the label printed with it ("General", "Chennai office",
--     "Bengaluru branch"), else "Other published line".
--   Text with no number in it (e.g. "Lines 0671-0679 printed as a series")
--   is skipped and stays in the note.
-- prospects.owner is no longer shown or written anywhere; the column stays.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS prospect_contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT '',
  role_type   TEXT NOT NULL DEFAULT 'Generic'
              CHECK (role_type IN ('Leadership','Land','Marketing','IR','Sales','Generic')),
  phone       TEXT NOT NULL DEFAULT '',   -- ONE number; lib/phone.ts decides Call / WhatsApp
  email       TEXT NOT NULL DEFAULT '',
  source_url  TEXT NOT NULL DEFAULT '',
  verified_on DATE,
  origin      TEXT NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual','contact_person','note_line')),
  created_by  TEXT,
  updated_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prospect_contacts_prospect ON prospect_contacts (prospect_id);
CREATE INDEX IF NOT EXISTS prospect_contacts_role_type ON prospect_contacts (role_type);
-- Re-running the backfill must not duplicate its rows.
CREATE UNIQUE INDEX IF NOT EXISTS prospect_contacts_backfill
  ON prospect_contacts (prospect_id, name, phone) WHERE origin <> 'manual';
ALTER TABLE prospect_contacts ENABLE ROW LEVEL SECURITY;  -- service role only, like every ERP table

-- What a role says about the person, by keyword. Land and marketing first so
-- "Head of Land Services" and "Chief Public Relations Officer" are not
-- swallowed by the broad Leadership words.
CREATE OR REPLACE FUNCTION bhumi_role_type(txt TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN txt ~* 'land|acquisition|liaison|joint development'              THEN 'Land'
    WHEN txt ~* 'marketing|public relations|media|brand|communications'    THEN 'Marketing'
    WHEN txt ~* 'investor|company secretary|financ|\mcfo\M'                THEN 'IR'
    WHEN txt ~* 'sales|business development|business officer'              THEN 'Sales'
    WHEN txt ~* 'founder|chairman|chief executive|\mceo\M|managing director|\mmd\M|director|president|proprietor|promoter|partner|chancellor|commissioner' THEN 'Leadership'
    ELSE 'Generic'
  END
$$;

-- 1. The named person on each prospect.
--    "Marketing/sales: Vivek V (Director - SMP, per …)" keeps its prefix as part of the role.
INSERT INTO prospect_contacts (prospect_id, name, role, role_type, origin, created_by)
SELECT p.id,
       btrim(regexp_replace(regexp_replace(p.contact_person, '\s*\([^()]*(\([^()]*\))?[^()]*\)\s*$', ''), '^[^:()]+:\s*', '')),
       btrim(concat_ws(': ',
         NULLIF(substring(p.contact_person from '^([^:()]+):\s'), ''),
         NULLIF(substring(p.contact_person from '\(([^()]*(?:\([^()]*\))?[^()]*)\)\s*$'), ''))),
       bhumi_role_type(p.contact_person),
       'contact_person',
       'migration 023'
FROM prospects p
WHERE btrim(p.contact_person) <> ''
  AND btrim(regexp_replace(regexp_replace(p.contact_person, '\s*\([^()]*(\([^()]*\))?[^()]*\)\s*$', ''), '^[^:()]+:\s*', '')) <> ''
ON CONFLICT DO NOTHING;

-- 2. Every number after "Other published lines:" in the note.
INSERT INTO prospect_contacts (prospect_id, name, role, role_type, phone, origin, created_by)
SELECT p.id,
       COALESCE(
         NULLIF(btrim(substring(seg from '^\s*([^:+0-9]+):')), ''),            -- "General: +91 …"
         NULLIF(btrim(substring(seg from '\(([^()]+)\)\s*$')), ''),            -- "+91 … (Bengaluru branch)"
         'Other published line'),
       '',
       'Generic',
       btrim(substring(seg from '\+?[0-9][0-9 ]{6,}[0-9]')),
       'note_line',
       'migration 023'
FROM prospects p
CROSS JOIN LATERAL regexp_split_to_table(
  substring(p.note from 'Other published lines:(.*)$'), ';') AS seg
WHERE p.note LIKE '%Other published lines:%'
  AND seg ~ '\+?[0-9][0-9 ]{6,}[0-9]'
ON CONFLICT DO NOTHING;
