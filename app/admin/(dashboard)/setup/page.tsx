import fs from 'node:fs'
import path from 'node:path'
import Icon from '@/components/site/Icon'
import CopyBlock from '@/components/admin/CopyBlock'
import { checkHealth } from '@/lib/cms'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Setup · Admin' }

/* Creating tables is the one step that cannot be done from here.

   Supabase exposes no SQL endpoint over its REST API, and the
   service-role key is not a database password — it authenticates
   against PostgREST, which only speaks to tables that already
   exist. So this page does the next best thing: it tells you
   exactly what is missing and hands you the statement to run. */

function projectRef(url: string | undefined) {
  if (!url) return null
  try {
    return new URL(url).host.split('.')[0]
  } catch {
    return null
  }
}

function readMigrations() {
  const dir = path.join(process.cwd(), 'supabase', 'migrations')
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
      .map((f) => ({ name: f, sql: fs.readFileSync(path.join(dir, f), 'utf8') }))
  } catch {
    return []
  }
}

export default async function SetupPage() {
  const health = await checkHealth()
  const ref = projectRef(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const migrations = readMigrations()
  const missing = health.tables.filter((t) => !t.exists)
  const done = health.state === 'live' || health.state === 'empty'

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Setup</h1>
          <p>
            What the database needs before the dashboard can save anything. The public site renders
            correctly throughout — nothing here is blocking visitors.
          </p>
        </div>
        {ref && (
          <a
            href={`https://supabase.com/dashboard/project/${ref}/sql/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-primary"
          >
            Open SQL editor <Icon name="arrow" size={12} />
          </a>
        )}
      </div>

      <section className={`healthCard ${done ? 'is-live' : 'is-warn'}`}>
        <div className="healthCard__main">
          <span className="healthCard__dot" aria-hidden="true" />
          <div>
            <h2>{health.headline}</h2>
            <p>{health.detail}</p>
            {health.action && <p className="healthCard__action">{health.action}</p>}
          </div>
        </div>
        {health.tables.length > 0 && (
          <ul className="healthCard__tables">
            {health.tables.map((t) => (
              <li key={t.name} className={t.exists ? 'is-ok' : 'is-missing'}>
                <code>{t.name}</code>
                <span>{t.exists ? `${t.rows ?? 0} rows` : 'missing'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done ? (
        <div className="emptyPanel">
          <Icon name="check" size={26} />
          <h3>Nothing left to do</h3>
          <p>
            Every table exists and the dashboard can save. Uploading a file creates the storage bucket
            automatically the first time.
          </p>
        </div>
      ) : (
        <section className="adminSection">
          <h2>Run these, oldest first</h2>
          <p className="muted" style={{ fontSize: '.86rem', marginBottom: 18, maxWidth: '80ch', lineHeight: 1.7 }}>
            Paste each into the SQL editor and run it. Every statement is guarded with{' '}
            <code>IF NOT EXISTS</code>, so running one twice is harmless and nothing already in the
            database is dropped or renamed.
            {missing.length > 0 && (
              <>
                {' '}
                Currently missing: <strong>{missing.map((t) => t.name).join(', ')}</strong>.
              </>
            )}
          </p>

          {migrations.map((m) => (
            <CopyBlock key={m.name} title={m.name} text={m.sql} />
          ))}
        </section>
      )}
    </>
  )
}
