'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AtSign, Calendar, Check, ExternalLink, Send, Trash2, Unlink } from 'lucide-react'
import { api, timeAgo } from './lib'
import { Banner, Card, Empty, Loading, Pill } from './ui'

/* Instagram (migration 027): connect the firm's account through Meta's
   API, draft posts from listings (or let Claude draft them), and publish
   or schedule them. Nothing is public until a person approves it. */

interface Post { id: string; status: string; kind: string; image_urls: string[]; video_url: string; caption: string; property_id: string | null; scheduled_at: string | null; published_at: string | null; permalink: string; error: string; created_by: string | null; created_at: string }
interface Data { ready: boolean; configured: boolean; error?: string; account: { id: string; username: string; token_expires_at: string | null; last_error: string } | null; posts: Post[] }
interface Listing { id: string; code: string; title: string; location: string; img_url: string; status: string; extent_acres?: number; price_total_cr?: number }

const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')

export default function InstagramView() {
  const params = useSearchParams()
  const [data, setData] = useState<Data | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [error, setError] = useState<string | null>(params.get('error'))
  const [notice, setNotice] = useState<string | null>(params.get('connected') ? `Connected @${params.get('connected')}.` : null)
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState({ property_id: '', urls: '', video: '', caption: '', when: '' })

  const load = useCallback(async () => {
    try {
      setData(await api.get<Data>('/api/ig'))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])
  useEffect(() => {
    load()
    api
      .get<{ data: Listing[]; source?: string }>('/api/properties?admin=1')
      .then((r) => setListings(r.source === 'live' ? r.data.filter((l) => l.status === 'Live') : []))
      .catch(() => {})
  }, [load])

  async function act(fn: () => Promise<unknown>, done?: string) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await fn()
      if (done) setNotice(done)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function pickListing(id: string) {
    const l = listings.find((x) => x.id === id)
    setDraft((d) => ({
      ...d,
      property_id: id,
      urls: l?.img_url && /^https:/.test(l.img_url) ? l.img_url : d.urls,
      caption: d.caption || (l ? `${l.title}\n📍 ${l.location}${l.extent_acres ? ` · ${l.extent_acres} acres` : ''}\n\nTitle-verified by Bhumi Estates. DM us or call to arrange a site visit.\n\n#BhumiEstates #Bengaluru #Land #${String(l.location).split(/[ ,]/)[0]}` : ''),
    }))
  }

  if (!data) return <div className="erpPage">{error ? <Banner tone="error">{error}</Banner> : <Loading />}</div>

  return (
    <div className="erpPage">
      <div className="erpHead">
        <div>
          <h1>Instagram</h1>
          <p>Posts made from your listings, approved by a person, published or scheduled through Instagram’s own API. Comments and DMs come into the WhatsApp Inbox as enquiries.</p>
        </div>
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}
      {notice ? <Banner tone="ok">{notice}</Banner> : null}
      {!data.ready ? <Banner tone="warn">{data.error}</Banner> : null}

      <div className="erpGrid main">
        <div className="erpCol">
          <Card title="Account" icon={AtSign}>
            {data.account ? (
              <div className="erpRow">
                <div className="erpRow__body">
                  <div className="erpRow__title">@{data.account.username}</div>
                  <div className="erpRow__sub">{data.account.last_error || (data.account.token_expires_at ? `Access renews itself; good until ${new Date(data.account.token_expires_at).toLocaleDateString('en-IN')}` : 'Connected')}</div>
                </div>
                <button className="erpBtn ghost sm" disabled={busy} onClick={() => confirm('Disconnect Instagram?') && act(() => api.post('/api/ig', { action: 'disconnect', id: data.account!.id }))}>
                  <Unlink size={13} /> Disconnect
                </button>
              </div>
            ) : data.configured ? (
              <button className="erpBtn primary" disabled={busy} onClick={() => act(async () => {
                const r = await api.post<{ url: string }>('/api/ig', { action: 'connect' })
                window.location.href = r.url
              })}>
                <AtSign size={15} /> Connect Instagram
              </button>
            ) : (
              <div className="crmSub">
                <p style={{ margin: '0 0 8px' }}>Set up once, free, by whoever manages the firm’s Meta account:</p>
                <ol style={{ paddingLeft: 18, display: 'grid', gap: 4, margin: 0 }}>
                  <li>In the Instagram app, make the Bhumi account a <b>Professional (Business)</b> account.</li>
                  <li>Add the account to the Bhumi Estates business portfolio, and as an <b>Instagram Tester</b> on the Meta app (accept the invite in Instagram).</li>
                  <li>Meta app → Instagram use case → <b>API setup with Unified login</b>: a configuration with redirect URL <code>https://www.bhumiestates.in/api/ig/callback</code>.</li>
                  <li>Webhooks → callback <code>https://www.bhumiestates.in/api/ig/webhook</code>, the same verify token as WhatsApp; subscribe to <b>comments</b> and <b>messages</b>.</li>
                  <li>In Vercel add <code>META_APP_ID</code>, <code>META_APP_SECRET</code> and <code>IG_CONFIG_ID</code> and redeploy.</li>
                </ol>
                <p style={{ margin: '8px 0 0' }}>Then a <b>Connect Instagram</b> button appears here. Posting to your own account needs no Meta review.</p>
              </div>
            )}
          </Card>

          <Card title="New post" icon={Send} style={{ marginTop: 16 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <select className="erpInput" value={draft.property_id} onChange={(e) => pickListing(e.target.value)}>
                <option value="">From a Live listing (optional)</option>
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>{l.code} · {l.title}</option>
                ))}
              </select>
              <textarea className="erpInput" rows={2} placeholder="Photo links (public https JPEG), one per line. 2–10 make a carousel." value={draft.urls} onChange={(e) => setDraft({ ...draft, urls: e.target.value })} />
              <input className="erpInput" placeholder="Or a video link (MP4) for a reel" value={draft.video} onChange={(e) => setDraft({ ...draft, video: e.target.value })} />
              <textarea className="erpInput" rows={6} placeholder="Caption" value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} />
              <label className="crmSub">Publish at (leave empty to publish when approved)
                <input className="erpInput" type="datetime-local" value={draft.when} onChange={(e) => setDraft({ ...draft, when: e.target.value })} />
              </label>
              <button
                className="erpBtn primary"
                disabled={busy || !draft.caption.trim()}
                onClick={() => act(async () => {
                  await api.post('/api/ig', { action: 'create', property_id: draft.property_id || null, image_urls: draft.urls.split(/\s+/).filter(Boolean), video_url: draft.video, caption: draft.caption, scheduled_at: draft.when ? new Date(draft.when).toISOString() : null })
                  setDraft({ property_id: '', urls: '', video: '', caption: '', when: '' })
                }, 'Draft saved. Approve it below to publish or schedule it.')}
              >
                Save draft
              </button>
              <p className="crmSub" style={{ margin: 0 }}>Or ask Claude: “draft an Instagram carousel for listing BLR-P-2601”.</p>
            </div>
          </Card>
        </div>

        <div className="erpCol">
          <Card title={`Posts · ${data.posts.length}`} icon={Calendar}>
            {data.posts.length === 0 ? (
              <Empty>No posts yet.</Empty>
            ) : (
              data.posts.map((p) => (
                <div key={p.id} className="erpRow" style={{ alignItems: 'flex-start' }}>
                  {p.image_urls[0] ? <img src={p.image_urls[0]} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} /> : null}
                  <div className="erpRow__body">
                    <div className="erpRow__title" style={{ whiteSpace: 'pre-wrap' }}>{p.caption.slice(0, 140) || '(no caption)'}</div>
                    <div className="erpRow__sub">
                      {p.kind}{p.image_urls.length > 1 ? ` · ${p.image_urls.length} photos` : ''} ·{' '}
                      {p.status === 'published' ? `published ${timeAgo(p.published_at)}` : p.status === 'scheduled' ? `scheduled for ${new Date(p.scheduled_at!).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` : `by ${p.created_by ?? '—'} ${timeAgo(p.created_at)}`}
                      {p.scheduled_at && p.status === 'draft' ? ` · wants ${toLocal(p.scheduled_at).replace('T', ' ')}` : ''}
                    </div>
                    {p.error ? <div className="crmSub is-late">{p.error}</div> : null}
                    <div className="crmActions" style={{ marginTop: 6 }}>
                      {['draft', 'failed'].includes(p.status) ? (
                        <button className="erpBtn primary sm" disabled={busy || !data.account} title={data.account ? '' : 'Connect Instagram first'} onClick={() => confirm(p.scheduled_at && new Date(p.scheduled_at) > new Date() ? 'Schedule this post?' : 'Publish this post to Instagram now?') && act(() => api.post('/api/ig', { action: 'approve', id: p.id }), 'Done.')}>
                          <Check size={13} /> {p.scheduled_at && new Date(p.scheduled_at) > new Date() ? 'Approve & schedule' : 'Approve & publish'}
                        </button>
                      ) : null}
                      {p.status === 'scheduled' ? <button className="erpBtn ghost sm" disabled={busy} onClick={() => act(() => api.post('/api/ig', { action: 'unschedule', id: p.id }))}>Unschedule</button> : null}
                      {p.permalink ? <a className="erpBtn ghost sm" href={p.permalink} target="_blank" rel="noreferrer"><ExternalLink size={13} /> View</a> : null}
                      {p.status !== 'published' && p.status !== 'publishing' ? (
                        <button className="erpBtn ghost sm" disabled={busy} onClick={() => confirm('Delete this draft?') && act(() => api.post('/api/ig', { action: 'delete', id: p.id }))}><Trash2 size={13} /></button>
                      ) : null}
                    </div>
                  </div>
                  <Pill label={p.status} tone={p.status === 'published' ? 'verified' : p.status === 'failed' ? 'flagged' : p.status === 'scheduled' ? 'progress' : 'pending'} />
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
