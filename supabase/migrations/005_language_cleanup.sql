-- Language cleanup: "mandate" is retired across the site in favour of
-- plainer words (project, case, engagement, brief).
--
-- The published transparency methodology lives in the database, and
-- migration 004 seeds it only when the table is empty (WHERE NOT EXISTS).
-- Correcting 004 alone therefore fixes fresh installs but leaves any
-- already-seeded deployment showing the old wording on /verification.
-- This migration rewrites the stored copy in place.

UPDATE transparency_stats
SET methodology = replace(
      methodology,
      'including mandates later withdrawn by the client',
      'including parcels later withdrawn by the client'
    )
WHERE methodology LIKE '%including mandates later withdrawn by the client%';
