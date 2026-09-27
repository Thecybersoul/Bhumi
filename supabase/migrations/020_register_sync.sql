-- ═══════════════════════════════════════════════════════════
-- 020 — Property Register sync
--
-- Every Property Register entry (lib/data/property-register.ts) is kept
-- in Listings automatically: missing ones are added as Draft, and when
-- the register changes, the listing's particulars follow
-- (lib/register-sync.ts). register_snapshot is what the sync last wrote,
-- so a field someone has since edited by hand is left alone: only
-- fields still matching the last sync are updated. Status, photo and
-- homepage feature are never touched: going Live is always a person's
-- decision.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE properties ADD COLUMN IF NOT EXISTS register_snapshot JSONB;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS register_synced_at TIMESTAMPTZ;
