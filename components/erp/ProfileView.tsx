'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity as ActivityIcon, Bell, FolderOpen, KeyRound, RefreshCw, ShieldCheck, Sheet, Users } from 'lucide-react'
import { api, fmtDateTime, timeAgo, type GoogleStatus } from './lib'
import { Avatar, Banner, Card, Loading } from './ui'
import { ActivityFeed } from './records'

interface Me {
  user: { id: string; name: string; email: string; role: string; last_login_at: string | null; password_changed_at: string | null }
  session: { expires_at: string }
  team: { id: string; name: string; email: string; last_login_at: string | null; last_active_at: string | null }[]
  notify_prefs?: { digest_email?: boolean }
}
interface Register {
  enabled: boolean
  url?: string
  last_synced_at?: string
  synced_by?: string
  error?: string
}

const SERVICES = [
  ['drive', 'Drive'],
  ['calendar', 'Calendar'],
  ['meet', 'Meet'],
  ['gmail', 'Gmail'],
  ['sheets', 'Sheets'],
] as const

/* The same Profile as the app: your account, the team, the shared
   Google Workspace connection, the Sheets register and your
   recent activity. */
export default function ProfileView({ googleResult, googleMessage }: { googleResult?: string; googleMessage?: string }) {
  const [me, setMe] = useState<Me | null>(null)
  const [google, setGoogle] = useState<GoogleStatus | null>(null)
  const [register, setRegister] = useState<Register | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api.get<Me>('/api/admin/me').then(setMe).catch((e) => setError((e as Error).message))
    api.get<GoogleStatus>('/api/admin/google/status').then(setGoogle).catch(() => {})
    api.get<Register>('/api/sheets').then(setRegister).catch(() => {})
  }, [])
  useEffect(load, [load])

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, text: 'The new passwords don’t match.' })
    try {
      await api.post('/api/admin/password', { current: pw.current, next: pw.next })
      setPw({ current: '', next: '', confirm: '' })
      setPwMsg({ ok: true, text: 'Password changed. Use it next time you sign in.' })
    } catch (err) {
      setPwMsg({ ok: false, text: (err as Error).message })
    }
  }

  async function disconnect() {
    if (!confirm('Disconnect Google for everyone? Calendar sync, Drive uploads, Gmail and Sheets stop until someone reconnects. Files already in Drive stay there.')) return
    await api.del('/api/admin/google/status').catch(() => {})
    load()
  }

  async function sync() {
    setSyncing(true)
    try {
      await api.post('/api/sheets')
      setRegister(await api.get<Register>('/api/sheets'))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  async function toggleDigest(v: boolean) {
    await api.patch('/api/admin/me', { notify_prefs: { digest_email: v } }).catch((e) => setError((e as Error).message))
    load()
  }

  if (!me) return error ? <Banner tone="error">{error}</Banner> : <Loading />
  const g = google
  const gState = !g ? 'Checking…' : !g.configured ? 'Not set up on the server yet' : !g.connected ? `Not connected — sign in as ${g.account}` : g.missing?.length ? `Connected, but without ${g.missing.join(', ')} — reconnect to add ${g.missing.length > 1 ? 'them' : 'it'}` : `Connected by ${g.connected_by || 'a team member'} · ${timeAgo(g.connected_at)}`

  return (
    <div className="erpPage">
      <div className="erpHero" style={{ display: 'flex', alignItems: 'center', gap: 18, paddingBottom: 26 }}>
        <Avatar name={me.user.name} size={68} />
        <div>
          <h1>{me.user.name}</h1>
          <div className="erpHero__date">{me.user.email}</div>
          <span className="erpPill" style={{ marginTop: 8, background: 'rgba(255,255,255,.1)', color: 'var(--gold-soft)' }}>
            <ShieldCheck size={12} /> {me.user.role} · full access
          </span>
        </div>
      </div>
      <div style={{ height: 16 }} />
      {googleResult === 'connected' ? <Banner tone="ok">Google Workspace connected for the whole team.</Banner> : null}
      {googleResult === 'error' ? <Banner tone="error">Couldn’t connect Google: {googleMessage || 'something went wrong'}.</Banner> : null}
      {googleResult === 'denied' ? <Banner>Google access was declined.</Banner> : null}
      {error ? <Banner tone="error">{error}</Banner> : null}

      <div className="erpGrid main">
        <div className="erpCol">
          <Card title="Google Workspace" icon={FolderOpen}>
            <div className="erpRow" style={{ borderTop: 0 }}>
              <div className="erpRow__body">
                <div className="erpRow__title">{g?.email || g?.account || 'info@bhumiestates.in'}</div>
                <div className="erpRow__sub" style={{ whiteSpace: 'normal' }}>{gState}</div>
              </div>
            </div>
            <div className="erpChips" style={{ margin: '4px 0 14px' }}>
              {SERVICES.map(([k, label]) => {
                const on = Boolean(g?.connected && g.services?.[k])
                return (
                  <span key={k} className="erpPill" style={{ background: on ? 'var(--verified-bg)' : 'var(--line-2)', color: on ? 'var(--verified)' : 'var(--muted)', fontSize: 11 }}>
                    {label}
                  </span>
                )
              })}
            </div>
            {g?.configured ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a href="/api/admin/google/connect" className="erpBtn primary">
                  {g.connected ? (g.missing?.length ? 'Reconnect to add the rest' : 'Reconnect') : 'Connect Google account'}
                </a>
                {g.connected ? (
                  <button className="erpBtn danger" onClick={disconnect}>
                    Disconnect
                  </button>
                ) : null}
              </div>
            ) : null}
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 12, lineHeight: 1.6 }}>
              One company account for the whole team. When anyone connects it, it’s connected for everyone. Documents go to Drive in a folder per listing and deal, meetings go on its calendar with Meet links, emails are sent from its Gmail, and a Sheets register mirrors the ERP.
            </p>
            {register?.enabled ? (
              <div className="erpRow" style={{ marginTop: 8 }}>
                <span className="erpRow__icon" style={{ background: 'var(--verified-bg)', color: 'var(--verified)' }}>
                  <Sheet size={16} />
                </span>
                <div className="erpRow__body">
                  <div className="erpRow__title">Live register in Google Sheets</div>
                  <div className="erpRow__sub">
                    {register.error ? `Last sync failed: ${register.error}` : register.last_synced_at ? `Synced ${timeAgo(register.last_synced_at)} by ${register.synced_by ?? 'the team'}` : 'Not created yet'}
                  </div>
                </div>
                {register.url ? (
                  <a href={register.url} target="_blank" rel="noreferrer" className="erpBtn ghost sm">
                    Open
                  </a>
                ) : null}
                <button className="erpBtn soft sm" onClick={sync} disabled={syncing}>
                  <RefreshCw size={13} /> {syncing ? 'Syncing…' : 'Sync now'}
                </button>
              </div>
            ) : null}
          </Card>

          <Card title="Your recent activity" icon={ActivityIcon} action="Whole team" actionHref="/admin/activity">
            <ActivityFeed actorId={me.user.id} limit={10} emptyText="Nothing yet — your changes will show here." />
          </Card>
        </div>

        <div className="erpCol">
          <Card title="Account" icon={KeyRound}>
            <div className="erpRow" style={{ borderTop: 0 }}>
              <div className="erpRow__body">
                <div className="erpRow__sub">Last sign-in</div>
                <div className="erpRow__title">{fmtDateTime(me.user.last_login_at)}</div>
              </div>
            </div>
            <div className="erpRow">
              <div className="erpRow__body">
                <div className="erpRow__sub">This session ends</div>
                <div className="erpRow__title">{fmtDateTime(me.session.expires_at)}</div>
              </div>
            </div>
            <form className="erpForm" onSubmit={changePassword} style={{ marginTop: 12 }}>
              <b style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-2)' }}>
                Change password {me.user.password_changed_at ? <span style={{ fontWeight: 500, color: 'var(--muted)' }}>· last changed {timeAgo(me.user.password_changed_at)}</span> : null}
              </b>
              <input className="erpInput" type="password" placeholder="Current password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
              <input className="erpInput" type="password" placeholder="New password (12+ characters)" autoComplete="new-password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
              <input className="erpInput" type="password" placeholder="Repeat new password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} />
              {pwMsg ? <Banner tone={pwMsg.ok ? 'ok' : 'error'}>{pwMsg.text}</Banner> : null}
              <button className="erpBtn primary">Update password</button>
            </form>
          </Card>

          <Card title="Notifications" icon={Bell}>
            <label className="erpToggle">
              <span>
                Daily email at 8:30 AM
                <small style={{ display: 'block', fontWeight: 500, color: 'var(--muted)' }}>Today’s meetings, tasks due and overdue, new leads — from the company Gmail</small>
              </span>
              <input type="checkbox" checked={me.notify_prefs?.digest_email !== false} onChange={(e) => toggleDigest(e.target.checked)} />
            </label>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 10 }}>
              Phone reminders (meetings, due tasks, the morning digest, team updates) are set in the Bhumi app under Profile.
            </p>
          </Card>

          <Card title="Team" icon={Users}>
            {me.team.map((t) => (
              <div key={t.id} className="erpRow">
                <Avatar name={t.name} size={34} />
                <div className="erpRow__body">
                  <div className="erpRow__title">
                    {t.name} {t.id === me.user.id ? <span style={{ fontSize: 11, color: 'var(--gold-deep)', fontWeight: 800 }}>You</span> : null}
                  </div>
                  <div className="erpRow__sub">{t.email}</div>
                </div>
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--muted)', textAlign: 'right' }}>
                  {t.last_active_at ? `Active ${timeAgo(t.last_active_at)}` : t.last_login_at ? `Signed in ${timeAgo(t.last_login_at)}` : 'Not signed in yet'}
                </span>
              </div>
            ))}
            <Link href="/admin/activity" className="erpCard__action" style={{ marginTop: 10 }}>
              See the team’s activity ›
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
