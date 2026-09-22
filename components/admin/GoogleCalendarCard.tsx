'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Icon from '@/components/site/Icon'

/* Tasks with a due date can sync to a real calendar event with a
   Google Meet link attached — this is where that connection is
   made once. One admin, one Google account: connecting again
   simply replaces whichever account was linked before. */

export default function GoogleCalendarCard({
  configured,
  connected,
  result,
  errorMessage,
}: {
  configured: boolean
  connected: boolean
  result?: string
  errorMessage?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function disconnect() {
    if (!confirm('Disconnect Google Calendar? Tasks already synced keep their calendar event until you delete it yourself.')) return
    setBusy(true)
    try {
      await fetch('/api/admin/google/status', { method: 'DELETE' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`healthCard ${connected ? 'is-live' : configured ? 'is-ok' : 'is-warn'}`} style={{ marginBottom: 22 }}>
      <div className="healthCard__main">
        <span className="healthCard__dot" aria-hidden="true" />
        <div>
          <h2>Google Calendar & Meet</h2>
          {connected ? (
            <p>
              Connected. Tasks with a due date can be synced to a calendar event with an automatic Google
              Meet link, from the Notes &amp; Tasks board.
            </p>
          ) : configured ? (
            <p>Credentials are set. Connect an account to start syncing tasks to Calendar and Meet.</p>
          ) : (
            <p>
              Not configured. Add <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code> and{' '}
              <code>GOOGLE_REDIRECT_URI</code> to your environment — a Google Cloud project with the Calendar
              API enabled and an OAuth client of type &ldquo;Web application&rdquo;, redirect URI pointed at{' '}
              <code>/api/admin/google/callback</code> on this domain.
            </p>
          )}

          {result === 'connected' && (
            <p className="healthCard__action" style={{ color: 'var(--verified)' }}>
              <Icon name="check" size={13} /> Google account connected.
            </p>
          )}
          {result === 'denied' && <p className="healthCard__action">Connection cancelled — nothing changed.</p>}
          {result === 'error' && (
            <p className="healthCard__action" style={{ color: 'var(--flagged)' }}>
              Could not connect{errorMessage ? `: ${errorMessage}` : '.'}
            </p>
          )}
        </div>
      </div>

      <div className="row-wrap" style={{ marginTop: 14 }}>
        {connected ? (
          <>
            <a href="/api/admin/google/connect" className="btn btn-sm btn-outline">
              Reconnect
            </a>
            <button className="btn btn-sm btn-ghost" onClick={disconnect} disabled={busy}>
              Disconnect
            </button>
          </>
        ) : (
          configured && (
            <a href="/api/admin/google/connect" className="btn btn-sm btn-primary">
              Connect Google account
            </a>
          )
        )}
      </div>
    </div>
  )
}
