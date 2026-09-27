'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Status {
  runner: boolean
  via?: string
  pending: string[] | null
  error?: string
}

/* Database updates, applied from here. Production deploys already run
   them; this shows what (if anything) is still pending and applies it
   with one click. Without a connection string on the server it says so,
   and the copy-and-paste SQL below stays the way to do it. */
export default function MigrationCard() {
  const router = useRouter()
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = () =>
    fetch('/api/admin/migrate', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ runner: false, pending: null }))

  useEffect(() => {
    load()
  }, [])

  async function apply() {
    setBusy(true)
    setMsg(null)
    try {
      const r = await fetch('/api/admin/migrate', { method: 'POST' })
      const j = await r.json()
      if (j.failed) setMsg({ ok: false, text: `${j.failed.name} failed: ${j.failed.error}` })
      else if (j.error) setMsg({ ok: false, text: j.error })
      else setMsg({ ok: true, text: j.applied.length ? `Applied ${j.applied.join(', ')}.` : 'Already up to date.' })
      await load()
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (!status) return null
  const pending = status.pending ?? []
  return (
    <section className={`healthCard ${status.runner && !pending.length && !status.error ? 'is-live' : 'is-warn'}`}>
      <div className="healthCard__main">
        <span className="healthCard__dot" aria-hidden="true" />
        <div style={{ flex: 1 }}>
          <h2>Database updates</h2>
          {!status.runner ? (
            <p>
              The server has no Postgres connection string (<code>SUPABASE_DB_URL</code> or the Supabase
              integration&rsquo;s <code>POSTGRES_URL</code>), so updates can&rsquo;t be applied from here. Use the SQL
              below instead.
            </p>
          ) : status.error ? (
            <p>Couldn&rsquo;t reach the database: {status.error}</p>
          ) : pending.length ? (
            <p>
              {pending.length} pending: <strong>{pending.join(', ')}</strong>. Each runs once, in its own transaction.
            </p>
          ) : (
            <p>Every update is applied. New ones apply automatically on each production deploy.</p>
          )}
          {msg && <p className="healthCard__action" style={{ color: msg.ok ? undefined : 'var(--danger, #b42318)' }}>{msg.text}</p>}
        </div>
        {status.runner && pending.length > 0 && (
          <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={apply}>
            {busy ? 'Applying…' : 'Apply pending updates'}
          </button>
        )}
      </div>
    </section>
  )
}
