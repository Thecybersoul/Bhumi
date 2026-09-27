'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Briefcase, CalendarClock, FolderOpen, History, ListChecks, Map, PhoneCall, Sparkles, Target, Trash2, UserRound, Users } from 'lucide-react'
import {
  api,
  budget,
  followUpDue,
  fromLocalInput,
  isSelling,
  LEAD_CHANNELS,
  LEAD_INTENTS,
  LEAD_PIPELINE,
  LEAD_PRIORITIES,
  LEAD_TIMELINES,
  PROPERTY_TYPES,
  stageLabel,
  timeAgo,
  toLocalInput,
  TYPE_LABEL,
  type Contact,
  type Lead,
} from './lib'
import { Banner, ByLine, Card, Chips, Field, Loading, Pill } from './ui'
import { ActivityFeed, RelatedMeetings } from './records'
import { DocsJump, DocumentsPanel, PendingDocs, uploadAll } from './documents'
import { ContactActions, ContactPicker } from './contacts'
import { EmailLog, MeetNowButton } from './google'
import { ConvertPanel, LeadMatches, RelatedTasks, ShownPanel } from './leadPanels'

type Form = {
  name: string
  phone: string
  email: string
  company: string
  locations: string
  size_requirement: string
  budget_min_cr: string
  budget_max_cr: string
  assigned_to: string
  source: string
  notes: string
  next_follow_up_at: string
}
const EMPTY: Form = { name: '', phone: '', email: '', company: '', locations: '', size_requirement: '', budget_min_cr: '', budget_max_cr: '', assigned_to: '', source: '', notes: '', next_follow_up_at: '' }

/** "in 2 days" → an ISO time at 10:30 that day, when calls actually happen. */
function inDays(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(10, 30, 0, 0)
  return d.toISOString()
}

export default function LeadEditor({ id, contactId }: { id: string; contactId?: string }) {
  const isNew = id === 'new'
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [contact, setContact] = useState<Contact | null>(null)
  const [ready, setReady] = useState(true)
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState<Form>(EMPTY)
  const [intent, setIntent] = useState<string>('Buy')
  const [ptype, setPtype] = useState<string>('')
  const [priority, setPriority] = useState<string>('Warm')
  const [channel, setChannel] = useState<string>('Call')
  const [timeline, setTimeline] = useState<string>('')
  const [files, setFiles] = useState<File[]>([])
  const [fileCat, setFileCat] = useState('KYC')
  const [team, setTeam] = useState<string[]>([])
  const [converting, setConverting] = useState(false)
  const [preset, setPreset] = useState<Parameters<typeof ConvertPanel>[0]['preset']>(null)
  const [losing, setLosing] = useState(false)
  const [lostReason, setLostReason] = useState('')
  const [shownKey, setShownKey] = useState(0)
  const [picking, setPicking] = useState(false)

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }))

  const hydrate = useCallback((l: Lead) => {
    setLead(l)
    setF({
      name: l.name ?? '',
      phone: l.phone ?? '',
      email: l.email ?? '',
      company: l.company ?? '',
      locations: l.locations || l.corridor || '',
      size_requirement: l.size_requirement ?? '',
      budget_min_cr: l.budget_min_cr != null ? String(l.budget_min_cr) : '',
      budget_max_cr: l.budget_max_cr != null ? String(l.budget_max_cr) : '',
      assigned_to: l.assigned_to ?? '',
      source: l.source ?? '',
      notes: l.notes ?? '',
      next_follow_up_at: l.next_follow_up_at ?? '',
    })
    setIntent(l.intent ?? 'Buy')
    setPtype(l.property_type ?? '')
    setPriority(l.priority ?? 'Warm')
    setChannel(l.channel ?? 'Form')
    setTimeline(l.timeline ?? '')
  }, [])

  const reload = useCallback(async () => {
    const r = await api.get<{ data: Lead; contact: Contact | null; ready: boolean }>(`/api/leads/${id}`)
    hydrate(r.data)
    setContact(r.contact)
    setReady(r.ready)
  }, [id, hydrate])

  useEffect(() => {
    api
      .get<{ user: { name: string }; team: { name: string }[] }>('/api/admin/me')
      .then((r) => {
        setTeam(r.team.map((t) => t.name))
        if (isNew) setF((p) => ({ ...p, assigned_to: p.assigned_to || r.user.name }))
      })
      .catch(() => {})
    if (isNew && contactId) {
      // "Start a lead" from a contact card: their details, already linked.
      api
        .get<{ data: Contact }>(`/api/contacts/${contactId}`)
        .then((r) => {
          setContact(r.data)
          setF((p) => ({ ...p, name: r.data.name, phone: r.data.phone ?? '', email: r.data.email ?? '', company: r.data.company ?? '' }))
          if (r.data.roles?.includes('Seller') || r.data.roles?.includes('Landowner')) setIntent('Sell')
        })
        .catch(() => {})
    }
    if (isNew) return
    reload()
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [isNew, reload, contactId])

  function body() {
    const num = (v: string) => (v.trim() === '' ? null : Number(v))
    return {
      ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()])),
      budget_min_cr: num(f.budget_min_cr),
      budget_max_cr: num(f.budget_max_cr),
      next_follow_up_at: f.next_follow_up_at || null,
      intent,
      property_type: ptype,
      priority,
      channel,
      timeline,
    }
  }

  async function save() {
    if (!f.name.trim()) return setError('Who is the lead? Add a name.')
    if (isNew && !contact && !f.phone.trim() && !f.email.trim()) return setError('Add a phone number or an email so the lead can be reached.')
    setBusy(true)
    setError(null)
    try {
      if (isNew) {
        const r = await api.post<{ id?: string }>('/api/leads', { ...body(), kind: intent === 'Sell' ? 'Listing request' : 'Enquiry', ...(contact ? { contact_id: contact.id } : {}) })
        if (r.id && files.length) await uploadAll(files, { entity_type: 'lead', entity_id: r.id, entity_label: f.name.trim(), category: fileCat })
        router.push(r.id ? `/admin/deals/leads/${r.id}` : '/admin/deals?tab=leads')
        return
      }
      await api.put(`/api/leads/${id}`, body())
      await reload()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function patch(p: Record<string, unknown>) {
    setError(null)
    try {
      await api.put(`/api/leads/${id}`, p)
      await reload()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function linkContact(c: Contact) {
    setPicking(false)
    await patch({ contact_id: c.id, name: c.name, phone: c.phone || f.phone, email: c.email || f.email })
  }

  async function remove() {
    if (!lead || !confirm(`Delete the lead for ${lead.name}? Their contact card stays.`)) return
    await api.del(`/api/leads/${lead.id}`)
    router.push('/admin/deals?tab=leads')
  }

  if (loading) return <Loading />
  if (!isNew && !lead) return <Banner tone="error">{error ?? 'Lead not found'}</Banner>

  const selling = isSelling(intent)
  const open = lead ? !['Converted', 'Lost', 'Closed'].includes(lead.stage) : true
  const label = lead?.name ?? f.name
  const due = lead ? followUpDue(lead) : false

  const requirement = (
    <Card title={selling ? 'What they are selling' : 'What they are looking for'} icon={Target}>
      <div className="erpForm two">
        <Field label="They want to" full>
          <Chips options={LEAD_INTENTS} value={intent as (typeof LEAD_INTENTS)[number]} onChange={setIntent} />
        </Field>
        <Field label="Property type" full>
          <div className="erpChips">
            {PROPERTY_TYPES.map((t) => (
              <button type="button" key={t} className={`erpChip ${ptype === t ? 'is-on' : ''}`} onClick={() => setPtype(ptype === t ? '' : t)}>
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </Field>
        <Field label={selling ? 'Where it is' : 'Preferred areas'} hint="e.g. Devanahalli, Hoskote, North Bengaluru" full>
          <input className="erpInput" value={f.locations} onChange={set('locations')} />
        </Field>
        <Field label={selling ? 'Asking from (₹ crore)' : 'Budget from (₹ crore)'} hint="0.85 = ₹85 lakh">
          <input className="erpInput" inputMode="decimal" value={f.budget_min_cr} onChange={set('budget_min_cr')} />
        </Field>
        <Field label={selling ? 'Asking up to (₹ crore)' : 'Budget up to (₹ crore)'}>
          <input className="erpInput" inputMode="decimal" value={f.budget_max_cr} onChange={set('budget_max_cr')} />
        </Field>
        <Field label="Size" hint="e.g. 2–5 acres, 30×40 site, 3 BHK">
          <input className="erpInput" value={f.size_requirement} onChange={set('size_requirement')} />
        </Field>
        <Field label="Timeline">
          <select className="erpInput" value={timeline} onChange={(e) => setTimeline(e.target.value)}>
            <option value="">—</option>
            {LEAD_TIMELINES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Notes" full>
          <textarea className="erpInput" value={f.notes} onChange={set('notes')} placeholder="Anything else: family decision, loan pre-approved, wants east-facing…" />
        </Field>
      </div>
    </Card>
  )

  const person = (
    <Card title="Person" icon={UserRound} action={contact ? 'Contact card' : undefined} actionHref={contact ? `/admin/deals/contacts/${contact.id}` : undefined}>
      <div className="erpForm two">
        <Field label="Name">
          <input className="erpInput" value={f.name} onChange={set('name')} autoFocus={isNew} />
        </Field>
        <Field label="Company (optional)">
          <input className="erpInput" value={f.company} onChange={set('company')} />
        </Field>
        <Field label="Phone">
          <input className="erpInput" type="tel" value={f.phone} onChange={set('phone')} placeholder="98450 12345" />
        </Field>
        <Field label="Email">
          <input className="erpInput" type="email" value={f.email} onChange={set('email')} />
        </Field>
      </div>
      {!isNew && !contact && ready ? (
        picking ? (
          <div style={{ marginTop: 10 }}>
            <ContactPicker onPick={linkContact} defaultRole={selling ? 'Seller' : 'Buyer'} autoFocus />
          </div>
        ) : (
          <button type="button" className="erpBtn ghost sm" style={{ marginTop: 10 }} onClick={() => setPicking(true)}>
            <Users size={13} /> Link to a contact on file
          </button>
        )
      ) : null}
    </Card>
  )

  const handling = (
    <Card title="Handling" icon={CalendarClock}>
      <div className="erpForm two">
        <Field label="Priority">
          <Chips options={LEAD_PRIORITIES} value={priority as (typeof LEAD_PRIORITIES)[number]} onChange={setPriority} />
        </Field>
        <Field label="Owner">
          <select className="erpInput" value={f.assigned_to} onChange={set('assigned_to')}>
            <option value="">Unassigned</option>
            {[...new Set([...team, f.assigned_to].filter(Boolean))].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Field>
        <Field label="Next follow-up" full>
          <input type="datetime-local" className="erpInput" value={toLocalInput(f.next_follow_up_at)} onChange={(e) => setF((p) => ({ ...p, next_follow_up_at: fromLocalInput(e.target.value) }))} />
          <div className="erpChips" style={{ marginTop: 6 }}>
            {[
              ['Tomorrow', 1],
              ['In 3 days', 3],
              ['Next week', 7],
              ['In 2 weeks', 14],
            ].map(([l, n]) => (
              <button type="button" key={l} className="erpChip sm" onClick={() => setF((p) => ({ ...p, next_follow_up_at: inDays(n as number) }))}>
                {l}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Came in through" full>
          <div className="erpChips">
            {LEAD_CHANNELS.map((c) => (
              <button type="button" key={c} className={`erpChip sm ${channel === c ? 'is-on' : ''}`} onClick={() => setChannel(c)}>
                {c}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Source detail" hint="Who referred them, which portal, which hoarding" full>
          <input className="erpInput" value={f.source} onChange={set('source')} />
        </Field>
      </div>
    </Card>
  )

  return (
    <div className="erpPage">
      <Link href="/admin/deals?tab=leads" className="erpCard__action" style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> Leads
      </Link>
      <div className="erpHead">
        <div>
          <h1>{isNew ? 'New lead' : lead!.name}</h1>
          {lead ? (
            <>
              <p style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <Pill label={stageLabel(lead.stage)} tone={lead.stage === 'Visit' ? 'progress' : lead.stage} />
                <Pill label={lead.intent ?? 'Buy'} tone="progress" />
                {lead.priority ? <Pill label={lead.priority} /> : null}
                <span>
                  {[TYPE_LABEL[lead.property_type ?? ''], lead.locations || lead.corridor, budget(lead.budget_min_cr, lead.budget_max_cr)].filter(Boolean).join(' · ')}
                </span>
              </p>
              <ByLine record={lead} createdAt={lead.created_at} />
            </>
          ) : (
            <p>Someone who called, walked in, was referred or messaged. Their contact card is created or matched by phone automatically.</p>
          )}
        </div>
        {lead ? (
          <div className="erpHead__actions">
            <DocsJump entityType="lead" entityId={lead.id} />
          </div>
        ) : null}
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}
      {saved ? <Banner tone="ok">Saved.</Banner> : null}
      {!ready && !isNew ? <Banner tone="warn">Requirements, follow-ups, contacts and listings shown need database migration 015. Open Setup in the sidebar to apply it.</Banner> : null}
      {lead?.transaction_id ? (
        <Banner tone="ok">
          Converted {lead.converted_at ? timeAgo(lead.converted_at) : ''} —{' '}
          <Link href={`/admin/deals/${lead.transaction_id}`} style={{ fontWeight: 700 }}>
            open the deal <ArrowRight size={13} style={{ verticalAlign: -2 }} />
          </Link>
        </Banner>
      ) : null}

      <div className="erpGrid main">
        <div className="erpCol">
          {lead ? (
            <Card title="Pipeline" icon={Briefcase}>
              <div className="erpPipe">
                {LEAD_PIPELINE.map((s, i) => {
                  const at = LEAD_PIPELINE.indexOf(lead.stage)
                  return (
                    <button key={s} type="button" className={`erpPipe__step ${lead.stage === s ? 'is-on' : i < at ? 'is-done' : ''}`} onClick={() => patch({ stage: s })} disabled={!open && lead.stage !== 'Nurture'}>
                      {stageLabel(s)}
                    </button>
                  )
                })}
              </div>
              {open ? (
                losing ? (
                  <div className="erpForm" style={{ marginTop: 12 }}>
                    <input className="erpInput" value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder="Why? Bought elsewhere, budget too low, not reachable…" autoFocus />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="erpBtn danger" onClick={() => patch({ stage: 'Lost', lost_reason: lostReason.trim() }).then(() => setLosing(false))}>
                        Mark lost
                      </button>
                      <button type="button" className="erpBtn ghost" onClick={() => setLosing(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <button type="button" className="erpBtn primary" onClick={() => (setPreset(null), setConverting(true))}>
                      <Briefcase size={15} /> Convert to deal
                    </button>
                    {lead.stage !== 'Nurture' ? (
                      <button type="button" className="erpBtn ghost" onClick={() => patch({ stage: 'Nurture' })} title="Not now, but keep in touch">
                        Nurture
                      </button>
                    ) : null}
                    <button type="button" className="erpBtn danger sm" onClick={() => setLosing(true)}>
                      Mark lost
                    </button>
                  </div>
                )
              ) : (
                <div style={{ marginTop: 12 }}>
                  {lead.stage === 'Lost' ? <p style={{ color: 'var(--flagged)', fontWeight: 700, marginBottom: 8 }}>Lost{lead.lost_reason ? `: ${lead.lost_reason}` : ''}</p> : null}
                  {!lead.transaction_id ? (
                    <button type="button" className="erpBtn ghost" onClick={() => patch({ stage: 'Contacted', lost_reason: '' })}>
                      Reopen lead
                    </button>
                  ) : null}
                </div>
              )}
              {converting ? (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-2)' }}>
                  <ConvertPanel lead={lead} preset={preset} onCancel={() => setConverting(false)} />
                </div>
              ) : null}
            </Card>
          ) : null}

          {lead ? (
            <Card title="Reach them" icon={PhoneCall}>
              {due ? <Banner tone="warn">Follow-up due {new Date(lead.next_follow_up_at!).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</Banner> : null}
              <ContactActions name={lead.name} phone={lead.phone} email={lead.email} size="md" entity={{ entity_type: 'lead', entity_id: lead.id, entity_label: lead.name }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <MeetNowButton entityType="lead" entityId={lead.id} entityLabel={lead.name} title={`Call with ${lead.name}`} label="Google Meet now" />
                <button
                  type="button"
                  className="erpBtn ghost"
                  title="Stamp that you spoke to them just now"
                  onClick={() => patch({ last_contacted_at: new Date().toISOString(), ...(lead.stage === 'New' ? { stage: 'Contacted' } : {}) })}
                >
                  <PhoneCall size={14} /> Log a call
                </button>
              </div>
              <p className="erpRow__sub" style={{ marginTop: 8, whiteSpace: 'normal' }}>
                {lead.last_contacted_at ? `Last contacted ${timeAgo(lead.last_contacted_at)}` : 'Not contacted yet'}
                {lead.assigned_to ? ` · Owner: ${lead.assigned_to}` : ''}
              </p>
            </Card>
          ) : null}

          {person}
          {requirement}
          {handling}

          {isNew ? (
            <Card title="Documents" icon={FolderOpen}>
              <PendingDocs files={files} onChange={setFiles} entityType="lead" category={fileCat} onCategory={setFileCat} />
            </Card>
          ) : null}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="erpBtn primary" style={{ flex: 1 }} onClick={save} disabled={busy}>
              {busy ? 'Saving…' : isNew ? (files.length ? `Add lead + ${files.length} file${files.length > 1 ? 's' : ''}` : 'Add lead') : 'Save changes'}
            </button>
            {lead ? (
              <button type="button" className="erpBtn danger" onClick={remove}>
                <Trash2 size={15} /> Delete
              </button>
            ) : null}
          </div>
        </div>

        {lead ? (
          <div className="erpCol">
            <Card title="Documents" icon={FolderOpen} id="documents">
              <DocumentsPanel entityType="lead" entityId={lead.id} entityLabel={label} />
            </Card>
            {ready ? (
              <>
                <Card title={selling ? 'Listings (theirs & shared)' : 'Listings shown'} icon={Map}>
                  <ShownPanel key={shownKey} lead={lead} onChange={() => setShownKey((k) => k + 1)} />
                </Card>
                <Card title="Matches" icon={Sparkles}>
                  <LeadMatches
                    key={shownKey}
                    lead={lead}
                    onShortlist={() => setShownKey((k) => k + 1)}
                    onConvertWith={(l) => {
                      setPreset(l)
                      setConverting(true)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                </Card>
              </>
            ) : null}
            <Card title="Follow-ups" icon={ListChecks}>
              <RelatedTasks entityType="lead" entityId={lead.id} entityLabel={lead.name} suggest={`Call ${lead.name.split(' ')[0]} back`} />
            </Card>
            <Card title="Site visits & meetings" icon={Users}>
              <RelatedMeetings entityType="lead" entityId={lead.id} entityLabel={lead.name} defaultKind="Site visit" />
            </Card>
            <Card title="Emails">
              <EmailLog entityType="lead" entityId={lead.id} />
            </Card>
            <Card title="History" icon={History}>
              <ActivityFeed entityType="lead" entityId={lead.id} emptyText="No changes recorded yet." />
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}
