/* Run the SQL in supabase/ against the project database, oldest first.
 *
 * The dashboard's own /admin/setup page can show you which tables are
 * missing and hand you the SQL to paste, because the service role key
 * reaches PostgREST and Storage. It cannot reach DDL — creating a table
 * needs a real Postgres connection, which is what this script is for.
 *
 * Every file is written with IF NOT EXISTS, so running this twice is
 * harmless and nothing already in the database is dropped or renamed.
 *
 * Setup, once:
 *   Supabase dashboard -> Settings -> Database -> Connection string ->
 *   URI. Copy it, put your database password in place of the
 *   [YOUR-PASSWORD] placeholder, and add it to .env.local as:
 *
 *     SUPABASE_DB_URL=postgresql://postgres.xxxx:PASSWORD@...pooler.supabase.com:6543/postgres
 *
 *   .env.local is gitignored, so the password stays on your machine.
 *
 * Then:
 *   node scripts/migrate.js           # apply everything
 *   node scripts/migrate.js --check   # report only, change nothing
 */
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const root = path.resolve(__dirname, '..')

/* Load .env.local without adding a dependency. Values may be bare or
   quoted; a password can legitimately contain '=' so only the first
   one separates key from value. */
function loadEnv() {
  for (const name of ['.env.local', '.env.development.local']) {
    const file = path.join(root, name)
    if (!fs.existsSync(file)) continue
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      const key = t.slice(0, eq).trim()
      if (process.env[key]) continue
      process.env[key] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    }
  }
}

/* schema.sql first, then migrations by their numeric prefix. Sorting
   the filenames as strings would be right today and wrong at 010. */
function sqlFiles() {
  const files = [path.join(root, 'supabase/schema.sql')].filter(fs.existsSync)
  const dir = path.join(root, 'supabase/migrations')
  if (fs.existsSync(dir)) {
    const migrations = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0))
      .map((f) => path.join(dir, f))
    files.push(...migrations)
  }
  return files
}

const EXPECTED = ['site_content', 'media', 'properties', 'billboards', 'designs', 'insights', 'leads']

async function tableReport(client) {
  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [EXPECTED]
  )
  const present = new Set(rows.map((r) => r.table_name))
  return EXPECTED.map((name) => ({ name, exists: present.has(name) }))
}

function print(report) {
  for (const t of report) console.log(`   ${t.exists ? '✓' : '✗'} ${t.name}`)
}

async function main() {
  loadEnv()
  const url = process.env.SUPABASE_DB_URL
  if (!url) {
    console.error(
      'SUPABASE_DB_URL is not set.\n\n' +
        'Supabase dashboard -> Settings -> Database -> Connection string -> URI.\n' +
        'Substitute your database password for [YOUR-PASSWORD] and add it to\n' +
        '.env.local as SUPABASE_DB_URL=...\n'
    )
    process.exit(1)
  }

  const checkOnly = process.argv.includes('--check')
  // Supabase terminates non-TLS connections; its cert chain is not in
  // Node's default store, so verification is relaxed rather than absent.
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })

  await client.connect()
  console.log('connected\n\nbefore:')
  print(await tableReport(client))

  if (checkOnly) {
    await client.end()
    return
  }

  console.log('')
  for (const file of sqlFiles()) {
    const rel = path.relative(root, file).split(path.sep).join('/')
    try {
      /* One transaction per file: a file that fails half way leaves
         nothing behind rather than a partly-created schema. */
      await client.query('BEGIN')
      await client.query(fs.readFileSync(file, 'utf8'))
      await client.query('COMMIT')
      console.log(`  applied  ${rel}`)
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {})
      console.error(`  FAILED   ${rel}\n           ${e.message}`)
      await client.end()
      process.exit(1)
    }
  }

  console.log('\nafter:')
  const report = await tableReport(client)
  print(report)
  await client.end()

  const missing = report.filter((t) => !t.exists)
  if (missing.length) {
    console.log(`\n${missing.length} still missing: ${missing.map((t) => t.name).join(', ')}`)
    process.exit(1)
  }
  console.log('\nAll tables present. Uploads and the content editor will work.')
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
