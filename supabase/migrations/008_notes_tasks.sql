-- ═══════════════════════════════════════════════════════════
-- 008 — Notes & tasks
--
-- The one thing an ERP needs that a marketing site never did: a
-- place to write down what was said and what has to happen next.
-- `entity_type`/`entity_id` optionally point a note or task at a
-- specific lead, transaction, property or verification case;
-- `entity_label` carries a human-readable reference so the admin
-- can show what something is about without a join. Both columns
-- are nullable — a note or task with no entity is simply general.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   TEXT NOT NULL DEFAULT 'general'
                  CHECK (entity_type IN ('lead','transaction','property','verification','general')),
  entity_id     UUID,
  entity_label  TEXT DEFAULT '',
  body          TEXT NOT NULL,
  author        TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_entity  ON notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);

CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  entity_type   TEXT NOT NULL DEFAULT 'general'
                  CHECK (entity_type IN ('lead','transaction','property','verification','general')),
  entity_id     UUID,
  entity_label  TEXT DEFAULT '',
  due_at        TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Done')),
  priority      TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low','Normal','High')),
  assignee      TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due    ON tasks(due_at);
