-- ═══════════════════════════════════════════════════════════
-- 016 — Agents: the outside brokers who work alongside Bhumi Estates
--
-- An agent is a contact (015) with an agent profile, so a person who
-- is sometimes a buyer and sometimes brings a listing is still one
-- card with one history:
--
--   contacts.agency, rera_number   who they are professionally
--   contacts.operating_areas       where they work, matched against
--                                  listing and lead locations
--   contacts.specialties           property types they handle
--   contacts.default_share_pct     their usual cut, pre-filled on a
--                                  new deal
--   contacts.agent_status, rating  Preferred / Active / Inactive /
--                                  Do not engage, and 1–5 stars
--   contacts.gstin, pan            for commission invoices and TDS
--
-- Their involvement in a record lives on contact_links (015), which
-- gains the money side: the share they get (a percent of our
-- commission, a percent of the deal value, a flat fee, or nothing
-- from us because their own client pays them), and the payout —
-- Not due → Due → Invoiced → Paid (or Waived), how much, when, and
-- the payment reference.
--
-- The 'Broker' role becomes 'Agent'. Listings gain a 'Draft' status.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS agency            TEXT DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS rera_number       TEXT DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS operating_areas   TEXT DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS specialties       TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS default_share_pct NUMERIC;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS agent_status      TEXT NOT NULL DEFAULT 'Active';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS rating            SMALLINT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS gstin             TEXT DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pan               TEXT DEFAULT '';

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_agent_status_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_agent_status_check
  CHECK (agent_status IN ('Preferred','Active','Inactive','Do not engage'));
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_rating_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_rating_check
  CHECK (rating IS NULL OR rating BETWEEN 1 AND 5);

CREATE INDEX IF NOT EXISTS idx_contacts_roles ON contacts USING GIN (roles);

UPDATE contacts SET roles = array_replace(roles, 'Broker', 'Agent') WHERE 'Broker' = ANY(roles);

-- ─── What an agent gets on a record ────────────────────────
ALTER TABLE contact_links ADD COLUMN IF NOT EXISTS share_type         TEXT NOT NULL DEFAULT '';
ALTER TABLE contact_links ADD COLUMN IF NOT EXISTS share_value        NUMERIC;
ALTER TABLE contact_links ADD COLUMN IF NOT EXISTS payout_status      TEXT NOT NULL DEFAULT '';
ALTER TABLE contact_links ADD COLUMN IF NOT EXISTS payout_amount_lakh NUMERIC;
ALTER TABLE contact_links ADD COLUMN IF NOT EXISTS paid_at            TIMESTAMPTZ;
ALTER TABLE contact_links ADD COLUMN IF NOT EXISTS payout_ref         TEXT DEFAULT '';
ALTER TABLE contact_links ADD COLUMN IF NOT EXISTS notes              TEXT DEFAULT '';
ALTER TABLE contact_links ADD COLUMN IF NOT EXISTS updated_by         TEXT DEFAULT '';
ALTER TABLE contact_links ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ;

ALTER TABLE contact_links DROP CONSTRAINT IF EXISTS contact_links_share_type_check;
ALTER TABLE contact_links ADD CONSTRAINT contact_links_share_type_check
  CHECK (share_type IN ('', 'Percent of our commission', 'Percent of deal value', 'Flat', 'Paid by their client'));
ALTER TABLE contact_links DROP CONSTRAINT IF EXISTS contact_links_payout_status_check;
ALTER TABLE contact_links ADD CONSTRAINT contact_links_payout_status_check
  CHECK (payout_status IN ('', 'Not due', 'Due', 'Invoiced', 'Paid', 'Waived'));

CREATE INDEX IF NOT EXISTS idx_contact_links_contact ON contact_links(contact_id);

UPDATE contact_links SET role = 'Agent' WHERE role = 'Broker';

-- ─── Draft listings ────────────────────────────────────────
-- A listing the team is still preparing (or one imported from the
-- property register, particulars not yet verified): visible in the
-- ERP, never on the public marketplace, which shows only 'Live'.
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE properties ADD CONSTRAINT properties_status_check
  CHECK (status IN ('Draft','Live','Reserved','Sold'));

-- Tell PostgREST (the Supabase API) to pick up the new columns now.
NOTIFY pgrst, 'reload schema';
