-- ═══════════════════════════════════════════════════════════
-- 021 — Sales CRM (/admin/crm)
--
-- Outbound prospecting, separate from `leads` (inbound enquiries):
--   prospects   builders, developers, investors and channel partners
--               we go to, one row each, with the funnel stage, next
--               action date, owner and deal value on the row itself;
--   crm_deals   the open sales pipeline (Interested → Proposal →
--               Won / Lost), with the 1% commission worked out.
-- Stage: 0 New · 1 Contacted · 2 Interested · 3 Proposal · 4 Won · 5 Lost.
-- List:  P partner · D developer · B builder · I investor.
-- Access goes through the ERP's own API with the service role, so RLS
-- is on with no policies, like every other ERP table.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS prospects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list         TEXT NOT NULL CHECK (list IN ('P','D','B','I')),
  name         TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT '',
  sector       TEXT NOT NULL DEFAULT '',
  prio         TEXT CHECK (prio IN ('A','B','C')),
  email        TEXT NOT NULL DEFAULT '',
  alt_emails   TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  area         TEXT NOT NULL DEFAULT '',
  requirement  TEXT NOT NULL DEFAULT '',
  trigger_why  TEXT NOT NULL DEFAULT '',
  history      TEXT NOT NULL DEFAULT '',
  stage        INT NOT NULL DEFAULT 0 CHECK (stage BETWEEN 0 AND 5),
  next_date    DATE,
  value        NUMERIC,
  owner        TEXT NOT NULL DEFAULT '',
  note         TEXT NOT NULL DEFAULT '',
  contact_person TEXT NOT NULL DEFAULT '',  -- the decision-maker and their role
  website      TEXT NOT NULL DEFAULT '',
  source       TEXT NOT NULL DEFAULT '',    -- RERA, CREDAI, LinkedIn, Referral, News…
  source_url   TEXT NOT NULL DEFAULT '',
  deal_band    TEXT NOT NULL DEFAULT '',    -- typical land ticket, e.g. "5–25 acres"
  score        INT CHECK (score BETWEEN 0 AND 100),  -- fit 40 · trigger 35 · contactability 25
  last_contacted DATE,
  created_by   TEXT,
  updated_by   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prospects_list_stage ON prospects (list, stage);
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS crm_deals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  value       NUMERIC NOT NULL DEFAULT 0,
  commission  NUMERIC NOT NULL DEFAULT 0,
  stage       INT NOT NULL DEFAULT 2 CHECK (stage BETWEEN 0 AND 5),
  parcel      TEXT NOT NULL DEFAULT '',
  property_code TEXT NOT NULL DEFAULT '',   -- the ERP listing being sold, if any
  deal_type   TEXT NOT NULL DEFAULT '' CHECK (deal_type IN ('','Outright','JD','JV','Mandate')),
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  expected_close DATE,
  note        TEXT NOT NULL DEFAULT '',
  next_date   DATE,
  created_by  TEXT,
  updated_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;

-- The two deals already in progress, so the pipeline isn't empty on day one.
INSERT INTO crm_deals (name, value, commission, stage, parcel, note)
SELECT 'Devanahalli 10-gunta Parcel', 0, 0, 2,
       'Sy. No. 18/2, Devanahalli taluk — 10 guntas, plotted development (6–7 sites of ~1,500 sq ft)',
       'Owner met. Site visit done. Waiting for developer buyer.'
WHERE NOT EXISTS (SELECT 1 FROM crm_deals WHERE name = 'Devanahalli 10-gunta Parcel');

INSERT INTO crm_deals (name, value, commission, stage, parcel, note)
SELECT 'Sarjapura 50-acre JD', 0, 0, 2,
       '50 acres at Narayanaghatta, Sarjapura Main Road — JD/JV structure, villa development',
       'Owner already met. JD structure being evaluated.'
WHERE NOT EXISTS (SELECT 1 FROM crm_deals WHERE name = 'Sarjapura 50-acre JD');
