/* Applies supabase/schema.sql and supabase/migrations/*.sql to the
 * project database, each file exactly once.
 *
 * Shared by three callers, so the database gets the same treatment
 * whichever one runs first:
 *   - the Vercel production build (scripts/migrate.js --deploy), so a
 *     push to main brings the schema along with the code that needs it;
 *   - Setup's "Apply pending updates" button (/api/admin/migrate);
 *   - `npm run migrate` on a laptop.
 *
 * The service-role key reaches PostgREST, which cannot run DDL, so this
 * needs a real Postgres connection string. The first one that connects
 * wins, from SUPABASE_DB_URL or the POSTGRES_* / DATABASE_URL variables
 * the Supabase ↔ Vercel integration injects.
 *
 * Every file is written to be re-runnable, but "re-runnable" is not
 * "harmless to repeat forever": 015 flips lead intent on listing
 * requests, which would undo a later hand edit. So applied files are
 * recorded in schema_migrations. A database migrated by hand before
 * that table existed is baselined from MARKERS: a file whose marker
 * object already exists is recorded as applied without running.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

/** Connection strings to try, most direct first. */
const URL_VARS = ['SUPABASE_DB_URL', 'POSTGRES_URL_NON_POOLING', 'POSTGRES_URL', 'DATABASE_URL']

/** What each file leaves behind, for baselining a hand-migrated database.
    null: the file is safe to repeat, so it simply runs. */
const MARKERS = {
  'schema.sql': ['table', 'properties'],
  '004_business_plan_restructure.sql': ['column', 'properties', 'property_type'],
  '005_language_cleanup.sql': null,
  '006_cms.sql': ['table', 'site_content'],
  '007_transactions.sql': ['table', 'transactions'],
  '008_notes_tasks.sql': ['table', 'notes'],
  '009_google_calendar.sql': ['table', 'google_auth'],
  '010_listing_fields.sql': ['column', 'properties', 'price_total_cr'],
  '011_documents.sql': ['table', 'documents'],
  '012_team_activity_meetings.sql': ['table', 'activity_log'],
  '013_gmail_sheets.sql': ['table', 'emails'],
  '014_notifications.sql': ['column', 'admin_users', 'notifications_seen_at'],
  '015_contacts_lead_pipeline.sql': ['table', 'contacts'],
  '016_agents.sql': ['column', 'contacts', 'agency'],
}

/** schema.sql first, then migrations by numeric prefix (string order
    would put 100 before 20). */
function sqlFiles(base = root) {
  const out = []
  const schema = path.join(base, 'supabase/schema.sql')
  if (fs.existsSync(schema)) out.push({ name: 'schema.sql', file: schema })
  const dir = path.join(base, 'supabase/migrations')
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0))
      .forEach((f) => out.push({ name: f, file: path.join(dir, f) }))
  }
  return out
}

function configuredUrls(env = process.env) {
  const seen = new Set()
  return URL_VARS.filter((k) => env[k] && !seen.has(env[k]) && seen.add(env[k])).map((k) => ({ name: k, url: env[k] }))
}

/** A connected pg Client, or throws with every attempt's reason. */
async function connect(env = process.env) {
  const { Client } = require('pg')
  const urls = configuredUrls(env)
  if (!urls.length) {
    const e = new Error(`No database connection string. Set one of ${URL_VARS.join(', ')}.`)
    e.code = 'NO_DB_URL'
    throw e
  }
  const reasons = []
  for (const { name, url } of urls) {
    // Supabase requires TLS; its chain is not in Node's default store.
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 })
    try {
      await client.connect()
      client.via = name
      return client
    } catch (e) {
      reasons.push(`${name}: ${e.message}`)
      await client.end().catch(() => {})
    }
  }
  throw new Error(`Could not connect to the database (${reasons.join('; ')})`)
}

async function markerPresent(client, marker) {
  if (!marker) return false
  if (marker[0] === 'table') {
    const r = await client.query(`SELECT to_regclass('public.' || $1) IS NOT NULL AS ok`, [marker[1]])
    return r.rows[0].ok
  }
  const r = await client.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2) AS ok`,
    [marker[1], marker[2]]
  )
  return r.rows[0].ok
}

async function ensureLedger(client, files, log) {
  const had = (await client.query(`SELECT to_regclass('public.schema_migrations') IS NOT NULL AS ok`)).rows[0].ok
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name        TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      how         TEXT NOT NULL DEFAULT 'ran'
    );
    ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;`)
  if (had) return
  for (const { name } of files) {
    if (await markerPresent(client, MARKERS[name])) {
      await client.query(`INSERT INTO schema_migrations (name, how) VALUES ($1, 'baseline') ON CONFLICT DO NOTHING`, [name])
      log(`  baseline ${name} (already in the database)`)
    }
  }
}

/** Which files have not been applied. Read-only apart from creating
    and baselining the ledger. */
async function pending(client, files = sqlFiles(), log = () => {}) {
  await ensureLedger(client, files, log)
  const done = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name))
  return files.filter((f) => !done.has(f.name))
}

/**
 * Apply every pending file, one transaction each; stop at the first
 * failure so later files never run on top of a missing one.
 * Returns { via, applied: [...], failed: {name, error} | null }.
 */
async function migrate({ env = process.env, base = root, log = console.log, checkOnly = false } = {}) {
  const client = await connect(env)
  const files = sqlFiles(base)
  const result = { via: client.via, applied: [], pending: [], failed: null }
  try {
    const todo = await pending(client, files, log)
    result.pending = todo.map((f) => f.name)
    if (checkOnly) return result
    for (const f of todo) {
      try {
        await client.query('BEGIN')
        await client.query(fs.readFileSync(f.file, 'utf8'))
        await client.query(`INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING`, [f.name])
        await client.query('COMMIT')
        result.applied.push(f.name)
        log(`  applied  ${f.name}`)
      } catch (e) {
        await client.query('ROLLBACK').catch(() => {})
        result.failed = { name: f.name, error: e.message }
        log(`  FAILED   ${f.name}: ${e.message}`)
        break
      }
    }
    result.pending = result.pending.filter((n) => !result.applied.includes(n))
    // PostgREST caches the schema; new columns 404 until it reloads.
    if (result.applied.length) await client.query(`NOTIFY pgrst, 'reload schema'`).catch(() => {})
    return result
  } finally {
    await client.end().catch(() => {})
  }
}

module.exports = { migrate, connect, pending, sqlFiles, configuredUrls, URL_VARS, MARKERS }
