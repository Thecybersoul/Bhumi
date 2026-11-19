-- ═══════════════════════════════════════════════════════════
-- 026 — The WhatsApp Business number linked through Meta's API
--
-- One row per number connected with "Connect WhatsApp" (Meta Embedded
-- Signup, coexistence: the number keeps working in the WhatsApp Business
-- app on the phone). The token is Meta's business token for that number;
-- this table is service-role only, like every ERP table.
--
-- Additive and reversible.
--   rollback:  DROP TABLE wa_accounts;
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wa_accounts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id    TEXT NOT NULL UNIQUE,
  waba_id            TEXT NOT NULL,
  display_phone      TEXT NOT NULL DEFAULT '',
  verified_name      TEXT NOT NULL DEFAULT '',
  token              TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected')),
  history_sync       TEXT NOT NULL DEFAULT 'not_requested',
  history_progress   INTEGER NOT NULL DEFAULT 0,
  last_inbound_at    TIMESTAMPTZ,
  last_error         TEXT NOT NULL DEFAULT '',
  connected_by       TEXT,
  connected_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE wa_accounts ENABLE ROW LEVEL SECURITY;
