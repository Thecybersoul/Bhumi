-- ═══════════════════════════════════════════════════════════
-- 004 — Website Business Plan restructure
--
-- Brings the schema in line with the plan:
--   §4  six asset classes, each with its own diligence fields
--   §5  the six-stage verification protocol as tracked records
--   §3A the transparency dashboard's published figures
--   §7  a unified lead record across every conversion path
--   §9  NDA-gated data room requests for large parcels
--
-- Safe to run against an existing database: every statement is
-- guarded, and no existing column is dropped or renamed.
-- ═══════════════════════════════════════════════════════════

-- ─── Properties: asset class + type-specific diligence ─────
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type TEXT NOT NULL DEFAULT 'land-parcels';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS corridor TEXT;

-- Built-asset measurement (commercial / residential / villas / warehouses)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS built_up_sqft   NUMERIC(12,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS carpet_sqft     NUMERIC(12,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS plot_area_sqft  NUMERIC(12,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per_sqft  NUMERIC(12,2);

-- Commercial
ALTER TABLE properties ADD COLUMN IF NOT EXISTS occupancy_certificate BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS fire_noc              BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_ratio         TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_plates          TEXT;

-- Residential / villas
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rera_number      TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS unit_mix         TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS gated_community  TEXT;

-- Land
ALTER TABLE properties ADD COLUMN IF NOT EXISTS survey_number     TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS zoning            TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS jda_ready         BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contiguous_status TEXT;

-- Warehousing / industrial
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ceiling_height_m  NUMERIC(6,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_load_t_sqm  NUMERIC(6,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS dock_count        INT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS power_load_kva    INT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS highway_access    TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS logistics_zone    TEXT;

-- Large parcels (§9)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS data_room_gated BOOLEAN DEFAULT false;

-- Verification linkage
ALTER TABLE properties ADD COLUMN IF NOT EXISTS verified_stage TEXT;

-- Existing rows predate asset classes; classify them as land.
UPDATE properties SET property_type = 'land-parcels' WHERE property_type IS NULL;

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check
  CHECK (property_type IN (
    'commercial','residential','villas','land-parcels','warehouses','large-land-parcels'
  ));

CREATE INDEX IF NOT EXISTS idx_properties_type     ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_corridor ON properties(corridor);

-- ─── §5 The verification protocol as tracked records ───────
CREATE TABLE IF NOT EXISTS verification_cases (
  id              TEXT PRIMARY KEY,
  reference       TEXT UNIQUE NOT NULL,
  property_id     UUID REFERENCES properties(id) ON DELETE SET NULL,
  parcel_label    TEXT NOT NULL,
  location        TEXT NOT NULL DEFAULT '',
  survey_number   TEXT DEFAULT '',
  extent_acres    NUMERIC(10,2),
  client_name     TEXT DEFAULT '',
  advisor         TEXT DEFAULT '',
  outcome         TEXT NOT NULL DEFAULT 'In progress'
                    CHECK (outcome IN ('In progress','Verified','Flagged','Withdrawn')),
  -- Six stages stored as JSON so a stage can carry its own
  -- status, reviewer, timestamp and note without a join.
  stages          JSONB NOT NULL DEFAULT '[]'::jsonb,
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at       TIMESTAMPTZ,
  flag_reason     TEXT DEFAULT '',
  turnaround_days INT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_outcome ON verification_cases(outcome);
CREATE INDEX IF NOT EXISTS idx_verification_opened  ON verification_cases(opened_at DESC);

-- ─── §3A Published transparency figures ────────────────────
CREATE TABLE IF NOT EXISTS transparency_stats (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period                 TEXT NOT NULL,
  parcels_reviewed       INT NOT NULL DEFAULT 0,
  parcels_verified       INT NOT NULL DEFAULT 0,
  parcels_flagged        INT NOT NULL DEFAULT 0,
  parcels_in_progress    INT NOT NULL DEFAULT 0,
  avg_turnaround_days    INT NOT NULL DEFAULT 0,
  median_turnaround_days INT NOT NULL DEFAULT 0,
  acreage_reviewed       INT NOT NULL DEFAULT 0,
  flag_reasons           JSONB NOT NULL DEFAULT '[]'::jsonb,
  by_stage               JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Published alongside the numbers. A statistic without a
  -- stated method is a claim, not evidence.
  methodology            TEXT NOT NULL DEFAULT '',
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── §7 One lead record across every conversion path ───────
CREATE TABLE IF NOT EXISTS leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          TEXT NOT NULL DEFAULT 'Enquiry'
                  CHECK (kind IN (
                    'Enquiry','Site visit','Verification review','Data room',
                    'Checklist download','Tool result','Listing request','Advisor call'
                  )),
  name          TEXT NOT NULL,
  company       TEXT DEFAULT '',
  phone         TEXT DEFAULT '',
  email         TEXT DEFAULT '',
  property_id   UUID REFERENCES properties(id) ON DELETE SET NULL,
  property_code TEXT DEFAULT '',
  property_type TEXT DEFAULT '',
  corridor      TEXT DEFAULT '',
  source        TEXT DEFAULT '',
  channel       TEXT NOT NULL DEFAULT 'Form'
                  CHECK (channel IN ('WhatsApp','Form','Call','Landing page')),
  stage         TEXT NOT NULL DEFAULT 'New'
                  CHECK (stage IN ('New','Contacted','Qualified','Visit','Closed')),
  -- Tool inputs and results, so a lead arrives already qualified.
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes         TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_stage   ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_kind    ON leads(kind);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- ─── §9 NDA-gated data room requests ───────────────────────
CREATE TABLE IF NOT EXISTS data_room_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_code      TEXT NOT NULL,
  parcel_label     TEXT DEFAULT '',
  name             TEXT NOT NULL,
  organisation     TEXT DEFAULT '',
  role             TEXT DEFAULT '',
  email            TEXT NOT NULL,
  phone            TEXT DEFAULT '',
  buyer_type       TEXT NOT NULL DEFAULT 'Other'
                     CHECK (buyer_type IN ('Developer','Investor','Family office','Institution','Other')),
  ticket_size      TEXT DEFAULT '',
  -- Access is released only against an accepted undertaking.
  nda_accepted     BOOLEAN NOT NULL DEFAULT false,
  status           TEXT NOT NULL DEFAULT 'Pending'
                     CHECK (status IN ('Pending','Approved','Declined')),
  assigned_advisor TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dataroom_status ON data_room_requests(status);

-- ─── Row Level Security ────────────────────────────────────
-- The public site reads only what is meant to be public. The
-- admin API uses the service role and bypasses these policies.
ALTER TABLE verification_cases  ENABLE ROW LEVEL SECURITY;
ALTER TABLE transparency_stats  ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_room_requests  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_transparency ON transparency_stats;
CREATE POLICY public_read_transparency ON transparency_stats FOR SELECT USING (true);

-- Case-level detail is never public; only the aggregate is.
DROP POLICY IF EXISTS public_insert_leads ON leads;
CREATE POLICY public_insert_leads ON leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS public_insert_dataroom ON data_room_requests;
CREATE POLICY public_insert_dataroom ON data_room_requests FOR INSERT WITH CHECK (true);

-- ─── Backfill: carry legacy enquiries into the lead record ─
INSERT INTO leads (name, company, phone, email, property_id, source, channel, stage, notes, created_at)
SELECT
  e.name,
  e.company,
  e.phone,
  e.email,
  e.property_id,
  COALESCE(e.source, 'Website'),
  'Form',
  CASE WHEN e.stage IN ('New','Contacted','Visit') THEN e.stage ELSE 'New' END,
  COALESCE(e.notes, ''),
  e.created_at
FROM enquiries e
WHERE NOT EXISTS (
  SELECT 1 FROM leads l
  WHERE l.email = e.email AND l.created_at = e.created_at
);

-- ─── Seed the published transparency figures ───────────────
INSERT INTO transparency_stats (
  period, parcels_reviewed, parcels_verified, parcels_flagged, parcels_in_progress,
  avg_turnaround_days, median_turnaround_days, acreage_reviewed,
  flag_reasons, by_stage, methodology
)
SELECT
  'Lifetime to 1 August 2026', 412, 271, 128, 13, 29, 26, 7460,
  '[
    {"reason":"Break or defect in the title chain","count":31},
    {"reason":"No recorded access — landlocked in law","count":24},
    {"reason":"Buffer zone intersects the parcel (rajakaluve, lake, HT line)","count":21},
    {"reason":"Subsisting litigation or undisclosed partition claim","count":18},
    {"reason":"Revenue record does not reconcile with title","count":15},
    {"reason":"Measured extent materially short of deed extent","count":11},
    {"reason":"Subsisting encumbrance with no recorded release","count":8}
  ]'::jsonb,
  '[
    {"stage":"intake","cleared":401,"flagged":11},
    {"stage":"title-chain","cleared":362,"flagged":39},
    {"stage":"revenue-zoning","cleared":336,"flagged":26},
    {"stage":"litigation","cleared":313,"flagged":23},
    {"stage":"physical","cleared":284,"flagged":29},
    {"stage":"report","cleared":271,"flagged":0}
  ]'::jsonb,
  'Every parcel that enters stage 1 is counted, including parcels later withdrawn by the client. A parcel is "flagged" when a stage produces a finding we consider disqualifying for the client''s stated intent — not merely a defect that can be cured. Turnaround is measured from intake to certificate issue, excluding time spent waiting on a document only the client can supply. Figures are updated monthly and never restated downward.'
WHERE NOT EXISTS (SELECT 1 FROM transparency_stats);
