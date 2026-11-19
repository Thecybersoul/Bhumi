'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link2, Unlink } from 'lucide-react'
import { api, timeAgo } from './lib'
import { Banner, Card } from './ui'

/* Connect WhatsApp: Meta Embedded Signup with coexistence, so the WhatsApp
   Business number keeps working in the app on the phone while every
   one-to-one chat (in and out), with its photos and documents, reaches
   the ERP through Meta's API. Run once, by the number's owner. */

interface Account { id: string; display_phone: string; verified_name: string; status: string; history_sync: string; history_progress: number; last_inbound_at: string | null; last_error: string; connected_at: string }
interface Config { configured: boolean; webhook_ready: boolean; app_id: string | null; config_id: string | null; graph_version: string; accounts: Account[] }

type FBType = {
  init: (o: Record<string, unknown>) => void
  login: (cb: (r: { authResponse?: { code?: string } }) => void, o: Record<string, unknown>) => void
}
declare global {
  interface Window { FB?: FBType; fbAsyncInit?: () => void }
}

function loadSdk(appId: string, version: string): Promise<FBType> {
  return new Promise((resolve, reject) => {
    if (window.FB) return resolve(window.FB)
    window.fbAsyncInit = () => {
      window.FB!.init({ appId, autoLogAppEvents: true, xfbml: false, version })
      resolve(window.FB!)
    }
    const s = document.createElement('script')
    s.src = 'https://connect.facebook.net/en_US/sdk.js'
    s.async = true
    s.crossOrigin = 'anonymous'
    s.onerror = () => reject(new Error('Could not load Facebook’s sign-in. Check the connection and any ad blocker.'))
    document.body.appendChild(s)
  })
}

export default function ConnectWhatsApp({ onConnected }: { onConnected?: () => void }) {
  const [cfg, setCfg] = useState<Config | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const session = useRef<{ waba_id?: string; phone_number_id?: string }>({})

  const load = useCallback(() => {
    api.get<Config>('/api/wa/signup').then(setCfg).catch((e) => setError((e as Error).message))
  }, [])
  useEffect(() => {
    load()
    // Meta reports the WhatsApp account and number chosen in the popup by message.
    const onMsg = (e: MessageEvent) => {
      if (!/facebook\.com$/.test(new URL(e.origin).hostname)) return
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (d?.type === 'WA_EMBEDDED_SIGNUP' && d.data) {
          if (d.data.waba_id) session.current.waba_id = d.data.waba_id
          if (d.data.phone_number_id) session.current.phone_number_id = d.data.phone_number_id
          if (d.event === 'CANCEL') setError(`Sign-up was closed${d.data.current_step ? ` at “${d.data.current_step}”` : ''}. Nothing was connected.`)
          if (d.event === 'ERROR') setError(`Meta: ${d.data.error_message ?? 'sign-up failed'}${d.data.error_code ? ` (code ${d.data.error_code}${d.data.session_id ? `, session ${d.data.session_id}` : ''})` : ''}. Nothing was connected.`)
        }
      } catch {
        /* not ours */
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [load])

  async function connect() {
    if (!cfg?.app_id || !cfg.config_id) return
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      const FB = await loadSdk(cfg.app_id, cfg.graph_version)
      FB.login(
        (r) => {
          const code = r.authResponse?.code
          if (!code) {
            setBusy(false)
            return
          }
          // The number's ids arrive by message around the login callback; the code lives 5 minutes.
          ;(async () => {
            for (let i = 0; i < 60 && !(session.current.waba_id && session.current.phone_number_id); i++) await new Promise((r) => setTimeout(r, 500))
            try {
              const { waba_id, phone_number_id } = session.current
              if (!waba_id || !phone_number_id) throw new Error('Meta did not say which WhatsApp number was chosen. Try Connect WhatsApp again.')
              const out = await api.post<{ display_phone: string; history: string }>('/api/wa/signup', { code, waba_id, phone_number_id })
              setNotice(`Connected ${out.display_phone}. New chats arrive now${out.history === 'requested' ? '; past chats are on their way' : ''}.`)
              load()
              onConnected?.()
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setBusy(false)
            }
          })()
        },
        {
          config_id: cfg.config_id,
          response_type: 'code',
          override_default_response_type: true,
          extras: { setup: {}, featureType: 'whatsapp_business_app_onboarding', sessionInfoVersion: '3' },
        }
      )
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  const live = (cfg?.accounts ?? []).filter((a) => a.status === 'connected')

  return (
    <Card title="WhatsApp Business number" icon={Link2}>
      {error ? <Banner tone="error">{error}</Banner> : null}
      {notice ? <Banner tone="ok">{notice}</Banner> : null}
      {live.map((a) => (
        <div key={a.id} className="erpRow">
          <div className="erpRow__body">
            <div className="erpRow__title">{a.verified_name || 'WhatsApp'} · {a.display_phone}</div>
            <div className="erpRow__sub">
              {a.last_inbound_at ? `Last message ${timeAgo(a.last_inbound_at)}` : 'Connected, waiting for the first message'}
              {a.history_sync === 'in_progress' ? ` · past chats ${a.history_progress}%` : a.history_sync === 'done' ? ' · past chats imported' : ''}
              {a.last_error ? ` · ${a.last_error}` : ''}
            </div>
          </div>
          <button className="erpBtn ghost sm" disabled={busy} onClick={() => confirm(`Stop capturing ${a.display_phone}?`) && api.post('/api/wa/signup', { disconnect: a.id }).then(load)}>
            <Unlink size={13} /> Disconnect
          </button>
        </div>
      ))}
      {!cfg ? null : !cfg.configured ? (
        <div className="crmSub">
          <p style={{ margin: '0 0 8px' }}>
            To read the WhatsApp Business number directly through Meta’s API, the firm needs a Meta app (free). Done once, by whoever manages the firm’s Facebook business account:
          </p>
          <ol style={{ paddingLeft: 18, display: 'grid', gap: 4, margin: 0 }}>
            <li>developers.facebook.com → Create app → use case <b>Connect with customers through WhatsApp</b>, on Bhumi’s business portfolio. Fill App settings → Basic (icon, privacy <code>/privacy</code>, terms <code>/terms</code>, data deletion <code>/api/meta/data-deletion</code>).</li>
            <li>Webhook: callback URL <code>https://www.bhumiestates.in/api/wa/webhook</code>, the verify token; subscribe to <b>messages</b>, <b>smb_message_echoes</b>, <b>history</b>, <b>smb_app_state_sync</b> and <b>account_update</b>.</li>
            <li>Facebook Login for Business → Settings: Client, Web, Embedded browser and JavaScript SDK login on, Strict mode on; <code>https://www.bhumiestates.in</code> in Allowed domains and <code>https://www.bhumiestates.in/admin/inbox</code> in Valid OAuth redirect URIs. Configurations → <b>WhatsApp Embedded Signup</b>; copy its ID.</li>
            <li>In Vercel, add <code>META_APP_ID</code>, <code>META_APP_SECRET</code>, <code>WA_CONFIG_ID</code> and <code>WA_VERIFY_TOKEN</code>, then redeploy.</li>
            <li>Become a Tech Provider (Meta requires it for connecting a WhatsApp Business app number): Business Verification, then App Review for <b>whatsapp_business_messaging</b> and <b>whatsapp_business_management</b>. Meta’s own forms; free.</li>
          </ol>
          <p style={{ margin: '8px 0 0' }}>Then a <b>Connect WhatsApp</b> button appears here. Fill the Personal list first.</p>
        </div>
      ) : (
        <>
          <p className="crmSub" style={{ margin: '6px 0 10px' }}>
            Sanjog runs this once: Meta’s window opens, he picks the number and scans a code in the WhatsApp Business app, and allows sharing chat history. The app keeps working on his phone. Fill the Personal list first.
            {!cfg.webhook_ready ? ' (WA_VERIFY_TOKEN is not set on the server, so Meta cannot deliver messages yet.)' : ''}
          </p>
          <button className="erpBtn primary" disabled={busy} onClick={connect}>
            <Link2 size={15} /> {busy ? 'Connecting…' : live.length ? 'Connect another number' : 'Connect WhatsApp'}
          </button>
        </>
      )}
    </Card>
  )
}
