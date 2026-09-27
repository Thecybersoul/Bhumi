-- ═══════════════════════════════════════════════════════════
-- 019 — Claude connector links
--
-- Each admin can connect their own Claude app (claude.ai, or the Claude
-- mobile and desktop apps on their own subscription) to the ERP as a
-- custom connector. Claude reaches /api/mcp/<secret>; the secret
-- identifies the person, so everything Claude does is theirs in the
-- activity trail. Only a SHA-256 of the secret is stored, it can be
-- revoked at any time from Profile, and it never grants more than the
-- person's own access.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS connector_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  label         TEXT NOT NULL DEFAULT 'Claude',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at  TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS connector_tokens_user ON connector_tokens (user_id);
ALTER TABLE connector_tokens ENABLE ROW LEVEL SECURITY;
