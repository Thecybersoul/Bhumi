-- ═══════════════════════════════════════════════════════════
-- 010 — Columns the real listings already use in code
--
-- lib/types.ts's Property carries price_total_cr, the plotted-layout
-- figures, statutory fields and `engagement`, and lib/data/seed.ts
-- fills them — but no earlier migration created the columns, so a
-- listing carrying them could not be saved to the database (which
-- the mobile app's marketplace editor now does).
-- ═══════════════════════════════════════════════════════════

ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_total_cr        NUMERIC(12,3);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS plots_total           INT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS plots_available       INT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS plots_available_list  TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS plot_size             TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS conversion_order      TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS khata                 TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS authority             TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS dimensions            TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS facing                TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS engagement            TEXT;
