-- ═══════════════════════════════════════════════════════════
-- 022 — One funnel: prospects → leads → deals, follow-ups as tasks
--
-- 1. Deals. The Sales CRM's `crm_deals` and the ERP's `transactions`
--    were two deal systems. `transactions` is now the only one: it gains
--    the CRM's fields (deal type, expected close, next action date, the
--    prospect it came from) and every `crm_deals` row is copied over once,
--    so commission payouts, agents, documents, meetings and Drive folders
--    all work on every deal. `crm_deals` is left in place, untouched and
--    no longer read, so this can be checked and nothing is lost; drop it
--    by hand once the copy has been verified.
--      Interested → Enquiry · Proposal → Negotiation · Won → Closed ·
--      Lost → outcome Lost. Value ₹ → crore; commission ₹ → a flat fee in lakh.
-- 2. People. A prospect remembers the contact and the lead it became.
-- 3. Follow-ups. Tasks, notes, documents and meetings can point at a
--    prospect, so a prospect's next date can be an ordinary task.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deal_type      TEXT NOT NULL DEFAULT ''
  CHECK (deal_type IN ('','Outright','JD','JV','Mandate'));
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS expected_close DATE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS next_date      DATE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS prospect_id    UUID REFERENCES prospects(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS crm_origin     UUID;
CREATE UNIQUE INDEX IF NOT EXISTS transactions_crm_origin ON transactions (crm_origin) WHERE crm_origin IS NOT NULL;
CREATE INDEX IF NOT EXISTS transactions_prospect ON transactions (prospect_id);

ALTER TABLE prospects ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS lead_id    UUID REFERENCES leads(id) ON DELETE SET NULL;

-- Copy each CRM deal across, once.
INSERT INTO transactions (
  reference, property_label, off_market, stage, outcome, buyer_name, representing,
  deal_value_cr, commission_type, commission_value, advisor, notes,
  opened_at, closed_at, deal_type, expected_close, next_date, prospect_id, crm_origin,
  created_by, updated_by, updated_at
)
SELECT
  'TXN-' || to_char(d.created_at, 'YYYY') || '-C' || upper(substr(replace(d.id::text, '-', ''), 1, 5)),
  d.name,
  true,
  CASE d.stage WHEN 3 THEN 'Negotiation' WHEN 4 THEN 'Closed' ELSE 'Enquiry' END,
  CASE d.stage WHEN 4 THEN 'Closed' WHEN 5 THEN 'Lost' ELSE 'In progress' END,
  COALESCE(p.name, ''),
  'Both',
  CASE WHEN d.value > 0 THEN round(d.value / 10000000.0, 2) END,
  CASE WHEN d.commission > 0 THEN 'Flat' ELSE 'Percentage' END,
  CASE WHEN d.commission > 0 THEN round(d.commission / 100000.0, 2) END,
  COALESCE(d.updated_by, d.created_by, ''),
  btrim(concat_ws(E'\n', NULLIF(d.parcel, ''), NULLIF(d.note, ''))),
  d.created_at,
  CASE WHEN d.stage IN (4, 5) THEN d.updated_at END,
  d.deal_type,
  d.expected_close,
  d.next_date,
  d.prospect_id,
  d.id,
  d.created_by,
  d.updated_by,
  d.updated_at
FROM crm_deals d
LEFT JOIN prospects p ON p.id = d.prospect_id
WHERE NOT EXISTS (SELECT 1 FROM transactions t WHERE t.crm_origin = d.id);

-- Tasks, notes, documents and meetings may now point at a prospect.
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_entity_type_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_entity_type_check
  CHECK (entity_type IN ('lead','transaction','property','verification','meeting','contact','prospect','general'));
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_entity_type_check;
ALTER TABLE notes ADD CONSTRAINT notes_entity_type_check
  CHECK (entity_type IN ('lead','transaction','property','verification','meeting','contact','prospect','general'));
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_entity_type_check;
ALTER TABLE meetings ADD CONSTRAINT meetings_entity_type_check
  CHECK (entity_type IN ('property','transaction','task','lead','verification','contact','prospect','general'));
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_entity_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_entity_type_check
  CHECK (entity_type IN ('property','note','transaction','lead','verification','meeting','task','contact','prospect','general'));
