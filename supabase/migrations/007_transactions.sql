-- ═══════════════════════════════════════════════════════════
-- 007 — Property transactions (deal pipeline)
--
-- Tracks every parcel or unit Bhumi Estates is actually
-- transacting, separately from `properties` (which is inventory
-- on offer). A transaction may reference a listing or stand
-- alone for an off-market deal the site never published.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference             TEXT UNIQUE NOT NULL,
  property_id           UUID REFERENCES properties(id) ON DELETE SET NULL,
  property_label        TEXT NOT NULL,
  off_market            BOOLEAN NOT NULL DEFAULT false,
  stage                 TEXT NOT NULL DEFAULT 'Enquiry'
                          CHECK (stage IN ('Enquiry','Negotiation','Agreement','Registration','Closed')),
  outcome               TEXT NOT NULL DEFAULT 'In progress'
                          CHECK (outcome IN ('In progress','Closed','Lost')),
  buyer_name            TEXT NOT NULL DEFAULT '',
  buyer_phone           TEXT DEFAULT '',
  buyer_email           TEXT DEFAULT '',
  seller_name           TEXT NOT NULL DEFAULT '',
  seller_phone          TEXT DEFAULT '',
  seller_email          TEXT DEFAULT '',
  representing          TEXT NOT NULL DEFAULT 'Both' CHECK (representing IN ('Buyer','Seller','Both')),
  deal_value_cr         NUMERIC(12,2),
  commission_type       TEXT NOT NULL DEFAULT 'Percentage' CHECK (commission_type IN ('Percentage','Flat')),
  commission_value      NUMERIC(12,2),
  commission_collected  BOOLEAN NOT NULL DEFAULT false,
  advisor               TEXT DEFAULT '',
  -- Meetings and documents carry their own id/status per entry,
  -- so they can grow without a join, same as verification stages.
  meetings              JSONB NOT NULL DEFAULT '[]'::jsonb,
  documents             JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes                 TEXT DEFAULT '',
  opened_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at             TIMESTAMPTZ,
  lost_reason           TEXT DEFAULT '',
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_stage      ON transactions(stage);
CREATE INDEX IF NOT EXISTS idx_transactions_outcome    ON transactions(outcome);
CREATE INDEX IF NOT EXISTS idx_transactions_property   ON transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_transactions_opened     ON transactions(opened_at DESC);
