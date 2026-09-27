/* Run the SQL in supabase/ against the project database, oldest first.
 *
 * The dashboard's own /admin/setup page can show you which tables are
 * missing and hand you the SQL to paste, because the service role key
 * reaches PostgREST and Storage. It cannot reach DDL — creating a table
 * needs a real Postgres connection, which is what this script is for.
 *
 * Each file runs once; lib/migrator.js records it in schema_migrations.
 * Production builds on Vercel run this with --deploy, so a push to main
 * migrates the database on its own whenever Vercel has a connection
 * string (SUPABASE_DB_URL, or the POSTGRES_* variables the Supabase
 * integration adds).
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
 *   node scripts/migrate.js --deploy  # the build step: production only,
 *                                     # never fails the build
 */
const fs = require('fs')
const path = require('path')
const { migrate, URL_VARS } = require('../lib/migrator')

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

async function main() {
  const deploy = process.argv.includes('--deploy')
  const checkOnly = process.argv.includes('--check')

  if (deploy) {
    /* Preview deployments share the production database, and a branch
       may carry a migration that is not merged yet: only production
       builds migrate. A build is never failed from here: the app runs
       on an older schema (new features report that Setup needs
       attention), and Setup can apply what is left. */
    if (process.env.VERCEL_ENV !== 'production') return console.log('migrate: skipped (not a production build)')
  } else {
    loadEnv()
  }

  let r
  try {
    r = await migrate({ checkOnly })
  } catch (e) {
    if (e.code === 'NO_DB_URL') {
      console.log(`migrate: no connection string (${URL_VARS.join(' / ')}); skipping`)
      if (!deploy) process.exit(1)
      return
    }
    console.error(`migrate: ${e.message}`)
    if (!deploy) process.exit(1)
    return
  }

  console.log(`migrate: connected via ${r.via}`)
  if (checkOnly) {
    console.log(r.pending.length ? `pending: ${r.pending.join(', ')}` : 'up to date')
    return
  }
  if (r.failed) {
    console.error(`migrate: ${r.failed.name} failed: ${r.failed.error}`)
    if (!deploy) process.exit(1)
    return
  }
  console.log(r.applied.length ? `migrate: applied ${r.applied.join(', ')}` : 'migrate: already up to date')
}

main()
