'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Link2, Loader2, Sparkles } from 'lucide-react'
import { api, timeAgo } from './lib'
import { Card } from './ui'

/* Profile → Claude connector, on the web: the twin of the app's
   (mobile/src/components/claudeConnector.tsx), over /api/connector. */

interface Link {
  id: string
  label: string
  created_at: string
  last_used_at: string | null
}

export function ClaudeConnectorCard() {
  const [links, setLinks] = useState<Link[] | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api
      .get<{ links: Link[] }>('/api/connector')
      .then((r) => setLinks(r.links))
      .catch((e) => (setError((e as Error).message), setLinks([])))
  }, [])
  useEffect(load, [load])

  async function create() {
    setBusy(true)
    setError(null)
    try {
      setUrl((await api.post<{ url: string }>('/api/connector', { label: 'Claude · web' })).url)
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function revoke(l: Link) {
    if (!confirm('Disconnect this link? Claude loses access to the ERP through it straight away.')) return
    await api.del(`/api/connector?id=${l.id}`).catch((e) => setError((e as Error).message))
    load()
  }

  return (
    <Card title="Claude connector" icon={Sparkles}>
      <p style={{ margin: "0 0 12px", fontSize: "var(--text-sm)", color: "var(--ink-2)", lineHeight: 1.55 }}>
        Use your own Claude (claude.ai or the Claude app) with the ERP: paste a WhatsApp post or just ask, and it adds listings, leads, meetings and tasks as you. It runs
        on your Claude subscription, with nothing extra to pay.
      </p>
      {url ? (
        <div className="claudeLink">
          <small>Your connector link (shown once, keep it private)</small>
          <code>{url}</code>
          <button
            type="button"
            className="erpBtn"
            onClick={() => navigator.clipboard.writeText(url).then(() => setCopied(true))}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy link'}
          </button>
          <ol>
            <li>
              Open <a href="https://claude.ai/settings/connectors" target="_blank" rel="noreferrer">claude.ai → Settings → Connectors</a>.
            </li>
            <li>Click <b>Add custom connector</b>, name it <b>Bhumi ERP</b>, and paste the link.</li>
            <li>In a chat, turn on Bhumi ERP from the tools menu, then ask: “Add this WhatsApp post as a listing…”, “What follow-ups are due today?”</li>
          </ol>
        </div>
      ) : (
        <button type="button" className="erpBtn" onClick={create} disabled={busy}>
          {busy ? <Loader2 size={15} className="spin" /> : <Link2 size={15} />} {links?.length ? 'Make a new connector link' : 'Connect Claude'}
        </button>
      )}
      {links && links.length > 0 && (
        <ul className="claudeLinks">
          {links.map((l) => (
            <li key={l.id}>
              <Sparkles size={14} />
              <span>
                <b>{l.label}</b>
                <small>{l.last_used_at ? `Last used ${timeAgo(l.last_used_at)}` : 'Not used yet'}</small>
              </span>
              <button type="button" className="erpBtn ghost" onClick={() => revoke(l)}>
                Disconnect
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p style={{ color: "var(--flagged)", fontSize: "var(--text-sm)" }}>{error}</p>}
    </Card>
  )
}
