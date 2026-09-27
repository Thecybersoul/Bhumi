'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BadgeCheck, Briefcase, FolderOpen, Handshake, History, ListChecks, MessageCircle, Plus, Tag, Target, Trash2, UserRound, Users } from 'lucide-react'
import { AGENT_STATUSES, agentShareLakh, api, budget, CONTACT_ROLES, lakh, PROPERTY_TYPES, stageLabel, timeAgo, TYPE_LABEL, waHref, type Contact, type DealMoney, type Involvement, type Lead } from './lib'
import { Banner, ByLine, Card, Empty, Field, Loading, Pill, RecordLink } from './ui'
import { ActivityFeed, RelatedMeetings } from './records'
import { DocsJump, DocumentsPanel, PendingDocs, uploadAll } from './documents'
import { ContactActions } from './contacts'
import { RelatedTasks } from './leadPanels'
import { EmailLog } from './google'
import { InvolvementRow, Stars } from './agents'
import { EntityPicker, NO_LINK } from './records'
import { linkHref } from './ui'
import { listingMessage } from './leadPanels'

interface Deal {
  id: string
  reference: string
  property_label: string
  stage: string
  outcome: string
  deal_value_cr?: number | null
  side: string
}
interface LinkRow {
  id: string
  entity_type: string
  entity_id: string
  entity_label: string
  role: string
  created_at: string
}

const KEYS = ['name', 'phone', 'alt_phone', 'email', 'company', 'city', 'address', 'source', 'notes'] as const
const AGENT_KEYS = ['agency', 'rera_number', 'operating_areas', 'gstin', 'pan', 'default_share_pct'] as const
type AgentKey = (typeof AGENT_KEYS)[number]
const KIND: Record<string, string> = { property: 'Listing', transaction: 'Deal', lead: 'Lead' }
type Key = (typeof KEYS)[number]

export default function ContactEditor({ id, agent }: { id: string; agent?: boolean }) {
  const isNew = id === 'new'
  const router = useRouter()
  const [c, setC] = useState<Contact | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [links, setLinks] = useState<LinkRow[]>([])
  const [f, setF] = useState<Record<Key, string>>(Object.fromEntries(KEYS.map((k) => [k, ''])) as Record<Key, string>)
  const [roles, setRoles] = useState<string[]>(isNew && agent ? ['Agent'] : [])
  const [a, setA] = useState<Record<AgentKey, string>>(Object.fromEntries(AGENT_KEYS.map((k) => [k, ''])) as Record<AgentKey, string>)
  const [specialties, setSpecialties] = useState<string[]>([])
  const [agentStatus, setAgentStatus] = useState<string>('Active')
  const [rating, setRating] = useState<number | null>(null)
  const [money, setMoney] = useState<Record<string, DealMoney & { reference: string; property_label: string; outcome: string }>>({})
  const [sharing, setSharing] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [dup, setDup] = useState<Contact | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [fileCat, setFileCat] = useState('KYC')

  const set = (k: Key) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }))

  const reload = useCallback(async () => {
    const r = await api.get<{ data: Contact; leads: Lead[]; deals: Deal[]; links: LinkRow[]; deal_money?: Record<string, DealMoney & { reference: string; property_label: string; outcome: string }> }>(`/api/contacts/${id}`)
    setC(r.data)
    setLeads(r.leads)
    setDeals(r.deals)
    setLinks(r.links)
    setMoney(r.deal_money ?? {})
    setF(Object.fromEntries(KEYS.map((k) => [k, (r.data[k] as string | undefined) ?? ''])) as Record<Key, string>)
    setRoles(r.data.roles ?? [])
    setA(Object.fromEntries(AGENT_KEYS.map((k) => [k, r.data[k] == null ? '' : String(r.data[k])])) as Record<AgentKey, string>)
    setSpecialties(r.data.specialties ?? [])
    setAgentStatus(r.data.agent_status ?? 'Active')
    setRating(r.data.rating ?? null)
  }, [id])

  useEffect(() => {
    if (isNew) return
    reload()
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [isNew, reload])

  async function save(force = false) {
    if (!f.name.trim()) return setError('A contact needs a name')
    setBusy(true)
    setError(null)
    setDup(null)
    const isAgentNow = roles.includes('Agent')
    const body = {
      ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()])),
      roles,
      force,
      // The agent profile is only sent for agents, so a plain contact
      // still saves on a database without migration 016.
      ...(isAgentNow
        ? {
            ...Object.fromEntries(AGENT_KEYS.map((k) => [k, a[k].trim()])),
            default_share_pct: a.default_share_pct.trim() === '' ? null : Number(a.default_share_pct),
            specialties,
            agent_status: agentStatus,
            rating,
          }
        : {}),
    }
    try {
      const res = await fetch(isNew ? '/api/contacts' : `/api/contacts/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const out = await res.json().catch(() => ({}))
      if (res.status === 409 && out.duplicate) {
        setDup(out.duplicate)
        setError(out.error)
        return
      }
      if (!res.ok) throw new Error(out.error ?? 'Could not save')
      if (isNew) {
        if (out.id && files.length) await uploadAll(files, { entity_type: 'contact', entity_id: out.id, entity_label: f.name.trim(), category: fileCat })
        router.push(out.id ? `/admin/deals/contacts/${out.id}` : roles.includes('Agent') ? '/admin/deals?tab=agents' : '/admin/deals?tab=contacts')
        return
      }
      await reload()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!c || !confirm(`Delete ${c.name}? Their leads and deals stay, unlinked.`)) return
    await api.del(`/api/contacts/${c.id}`)
    router.push('/admin/deals?tab=contacts')
  }

  if (loading) return <Loading />
  if (!isNew && !c) return <Banner tone="error">{error ?? 'Contact not found'}</Banner>

  return (
    <div className="erpPage">
      <Link href={roles.includes('Agent') ? '/admin/deals?tab=agents' : '/admin/deals?tab=contacts'} className="erpCard__action" style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> {roles.includes('Agent') ? 'Agents' : 'Contacts'}
      </Link>
      <div className="erpHead">
        <div>
          <h1>
            {isNew ? (agent ? 'New agent' : 'New contact') : c!.name}
            {c?.agent_status === 'Preferred' ? <BadgeCheck size={22} color="var(--verified)" style={{ marginLeft: 8, verticalAlign: -2 }} /> : null}
          </h1>
          {c ? (
            <>
              <p style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {(c.roles ?? []).map((r) => (
                  <Pill key={r} label={r} tone="progress" />
                ))}
                <span>{[c.agency || c.company, c.rera_number ? `RERA ${c.rera_number}` : '', c.city].filter(Boolean).join(' · ')}</span>
                {c.roles?.includes('Agent') && c.rating ? <Stars n={c.rating} /> : null}
              </p>
              <ByLine record={c} createdAt={c.created_at} />
            </>
          ) : (
            <p>
              {agent
                ? 'An outside agent who works alongside Bhumi Estates. Add them to listings, deals and leads with their share, and track what they are paid.'
                : 'Buyers, sellers, landowners, agents, lawyers — anyone you deal with. Tag them on deals, listings, tasks and notes.'}
            </p>
          )}
        </div>
        {c ? (
          <div className="erpHead__actions">
            <DocsJump entityType="contact" entityId={c.id} />
          </div>
        ) : null}
      </div>
      {error ? <Banner tone={dup ? 'warn' : 'error'}>{error}</Banner> : null}
      {dup ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Link className="erpBtn primary sm" href={`/admin/deals/contacts/${dup.id}`}>
            Open {dup.name}
          </Link>
          <button type="button" className="erpBtn ghost sm" onClick={() => save(true)}>
            Save anyway (different person)
          </button>
        </div>
      ) : null}
      {saved ? <Banner tone="ok">Saved. Their details on open leads and deals were updated too.</Banner> : null}

      <div className="erpGrid main">
        <div className="erpCol">
          {c ? (
            <Card title="Reach them" icon={UserRound}>
              <ContactActions name={c.name} phone={c.phone} email={c.email} size="md" />
              {c.alt_phone ? (
                <div style={{ marginTop: 8 }}>
                  <ContactActions name={c.name} phone={c.alt_phone} />
                </div>
              ) : null}
            </Card>
          ) : null}

          <Card title="Details" icon={UserRound}>
            <div className="erpForm two">
              <Field label="Name" full>
                <input className="erpInput" value={f.name} onChange={set('name')} autoFocus={isNew} />
              </Field>
              <Field label="Phone">
                <input className="erpInput" type="tel" value={f.phone} onChange={set('phone')} placeholder="98450 12345" />
              </Field>
              <Field label="Other phone">
                <input className="erpInput" type="tel" value={f.alt_phone} onChange={set('alt_phone')} />
              </Field>
              <Field label="Email">
                <input className="erpInput" type="email" value={f.email} onChange={set('email')} />
              </Field>
              <Field label="Company">
                <input className="erpInput" value={f.company} onChange={set('company')} />
              </Field>
              <Field label="Roles" full>
                <div className="erpChips">
                  {CONTACT_ROLES.map((r) => (
                    <button type="button" key={r} className={`erpChip ${roles.includes(r) ? 'is-on' : ''}`} onClick={() => setRoles((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]))}>
                      {r}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="City / area">
                <input className="erpInput" value={f.city} onChange={set('city')} />
              </Field>
              <Field label="How we know them">
                <input className="erpInput" value={f.source} onChange={set('source')} placeholder="Referred by…, walk-in, website" />
              </Field>
              <Field label="Address" full>
                <input className="erpInput" value={f.address} onChange={set('address')} />
              </Field>
              <Field label="Notes" full>
                <textarea className="erpInput" value={f.notes} onChange={set('notes')} />
              </Field>
            </div>
          </Card>

          {roles.includes('Agent') ? (
            <Card title="Agent profile" icon={Handshake}>
              <div className="erpForm two">
                <Field label="Agency / firm">
                  <input className="erpInput" value={a.agency} onChange={(e) => setA({ ...a, agency: e.target.value })} />
                </Field>
                <Field label="RERA agent registration no.">
                  <input className="erpInput" value={a.rera_number} onChange={(e) => setA({ ...a, rera_number: e.target.value })} placeholder="PRM/KA/RERA/…" />
                </Field>
                <Field label="Areas they work" hint="Used to suggest them on listings and leads there" full>
                  <input className="erpInput" value={a.operating_areas} onChange={(e) => setA({ ...a, operating_areas: e.target.value })} placeholder="Devanahalli, Hoskote, Yelahanka" />
                </Field>
                <Field label="Property types they handle" full>
                  <div className="erpChips">
                    {PROPERTY_TYPES.map((t) => (
                      <button type="button" key={t} className={`erpChip ${specialties.includes(t) ? 'is-on' : ''}`} onClick={() => setSpecialties((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))}>
                        {TYPE_LABEL[t]}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Usual share (% of our commission)" hint="Pre-filled when you add them to a deal">
                  <input className="erpInput" inputMode="decimal" value={a.default_share_pct} onChange={(e) => setA({ ...a, default_share_pct: e.target.value })} placeholder="e.g. 50 for a 50:50 co-broke" />
                </Field>
                <Field label="Rating">
                  <div style={{ paddingTop: 8 }}>
                    <Stars n={rating} onChange={setRating} size={20} />
                  </div>
                </Field>
                <Field label="Status" full>
                  <div className="erpChips">
                    {AGENT_STATUSES.map((st) => (
                      <button type="button" key={st} className={`erpChip ${agentStatus === st ? 'is-on' : ''}`} onClick={() => setAgentStatus(st)}>
                        {st}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="GSTIN" hint="For their commission invoices">
                  <input className="erpInput" value={a.gstin} onChange={(e) => setA({ ...a, gstin: e.target.value })} />
                </Field>
                <Field label="PAN" hint="For TDS on commission">
                  <input className="erpInput" value={a.pan} onChange={(e) => setA({ ...a, pan: e.target.value })} />
                </Field>
              </div>
            </Card>
          ) : null}

          {isNew ? (
            <Card title="Documents" icon={FolderOpen}>
              <PendingDocs files={files} onChange={setFiles} entityType="contact" category={fileCat} onCategory={setFileCat} />
            </Card>
          ) : null}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="erpBtn primary" style={{ flex: 1 }} onClick={() => save()} disabled={busy}>
              {busy ? 'Saving…' : isNew ? 'Save contact' : 'Save changes'}
            </button>
            {c ? (
              <button type="button" className="erpBtn danger" onClick={remove}>
                <Trash2 size={15} /> Delete
              </button>
            ) : null}
          </div>
        </div>

        {c ? (
          <div className="erpCol">
            <Card title="Documents" icon={FolderOpen} id="documents">
              <DocumentsPanel entityType="contact" entityId={c.id} entityLabel={c.name} />
            </Card>

            <Card title="Leads" icon={Target} action="New lead" actionHref={`/admin/deals/leads/new?contact=${c.id}`}>
              {leads.length === 0 ? (
                <Empty>No leads for {c.name.split(' ')[0]} yet.</Empty>
              ) : (
                leads.map((l) => (
                  <Link key={l.id} href={`/admin/deals/leads/${l.id}`} className="erpRow" style={{ alignItems: 'flex-start' }}>
                    <div className="erpRow__body">
                      <div className="erpRow__title">
                        {l.intent ?? 'Buy'} · {[TYPE_LABEL[l.property_type ?? ''], l.locations].filter(Boolean).join(', ') || l.kind}
                      </div>
                      <div className="erpRow__sub">{[budget(l.budget_min_cr, l.budget_max_cr), timeAgo(l.created_at)].filter(Boolean).join(' · ')}</div>
                    </div>
                    <Pill label={stageLabel(l.stage)} tone={l.stage === 'Visit' ? 'progress' : l.stage} />
                  </Link>
                ))
              )}
            </Card>

            <Card title="Deals" icon={Briefcase}>
              {deals.length === 0 ? (
                <Empty>Not on any deal yet.</Empty>
              ) : (
                deals.map((d) => (
                  <Link key={d.id} href={`/admin/deals/${d.id}`} className="erpRow" style={{ alignItems: 'flex-start' }}>
                    <div className="erpRow__body">
                      <div className="erpRow__title">{d.property_label}</div>
                      <div className="erpRow__sub">
                        {d.reference} · {d.side}
                      </div>
                    </div>
                    <Pill label={d.outcome === 'In progress' ? d.stage : d.outcome} tone={d.outcome === 'In progress' ? 'progress' : d.outcome} />
                  </Link>
                ))
              )}
            </Card>

            {roles.includes('Agent') ? (
              <Card title="Work & commissions" icon={Handshake}>
                {(() => {
                  const work = (links as unknown as Involvement[]).filter((l) => ['property', 'transaction', 'lead'].includes(l.entity_type))
                  const onDeals = work.filter((l) => l.entity_type === 'transaction' && l.share_type && l.share_type !== 'Paid by their client')
                  const amount = (l: Involvement) => l.payout_amount_lakh ?? (money[l.entity_id] ? agentShareLakh(l, money[l.entity_id]) : null) ?? 0
                  const paid = onDeals.filter((l) => l.payout_status === 'Paid').reduce((x, l) => x + amount(l), 0)
                  const owed = onDeals.filter((l) => l.payout_status === 'Due' || l.payout_status === 'Invoiced').reduce((x, l) => x + amount(l), 0)
                  const pipeline = onDeals.filter((l) => !l.payout_status || l.payout_status === 'Not due').reduce((x, l) => x + amount(l), 0)
                  return (
                    <>
                      <div className="erpSplit" style={{ marginBottom: 10 }}>
                        <div>
                          <span>Paid</span>
                          <b>{lakh(paid)}</b>
                        </div>
                        <div>
                          <span>Owed now</span>
                          <b>{lakh(owed)}</b>
                        </div>
                        <div className="is-net">
                          <span>On open deals</span>
                          <b>{lakh(pipeline)}</b>
                        </div>
                      </div>
                      {work.length === 0 ? (
                        <Empty>Not on any listing, deal or lead yet. Add them from the record’s Agents card.</Empty>
                      ) : (
                        work.map((l) => (
                          <InvolvementRow
                            key={l.id}
                            r={{ ...l, contact: null }}
                            deal={money[l.entity_id] ?? null}
                            showRecord={{ href: linkHref(l.entity_type, l.entity_id), label: l.entity_label, kind: KIND[l.entity_type] ?? l.entity_type }}
                            onChange={reload}
                          />
                        ))
                      )}
                      {c.phone ? (
                        sharing ? (
                          <div style={{ marginTop: 10 }}>
                            <EntityPicker
                              value={NO_LINK}
                              types={['property']}
                              label="Listing to share with them"
                              onChange={async (v) => {
                                if (!v.entity_id) return
                                const all = await api.get<{ data: { id: string; code: string; title: string; location: string; status: string }[] }>('/api/properties?admin=1')
                                const p = all.data.find((x) => x.id === v.entity_id)
                                if (p) window.open(waHref(c.phone, listingMessage(c.name, p).replace("that fits what you're looking for", 'for your buyers')), '_blank')
                                // Remember who has it: tagged as a co-broker on the listing.
                                await api
                                  .post('/api/contact-links', { contact_id: c.id, entity_type: 'property', entity_id: v.entity_id, entity_label: v.entity_label, role: 'Co-broker' })
                                  .catch(() => {})
                                setSharing(false)
                                reload()
                              }}
                            />
                          </div>
                        ) : (
                          <button type="button" className="erpBtn soft block" style={{ marginTop: 10 }} onClick={() => setSharing(true)}>
                            <MessageCircle size={15} /> Share a listing with {c.name.split(' ')[0]}
                          </button>
                        )
                      ) : null}
                    </>
                  )
                })()}
              </Card>
            ) : null}

            <Card title="Tagged on" icon={Tag}>
              {links.filter((l) => !roles.includes('Agent') || !['property', 'transaction', 'lead'].includes(l.entity_type)).length === 0 ? (
                <Empty>Tag {c.name.split(' ')[0]} on a listing, deal, task or meeting from its page.</Empty>
              ) : (
                links.filter((l) => !roles.includes('Agent') || !['property', 'transaction', 'lead'].includes(l.entity_type)).map((l) => (
                  <div key={l.id} className="erpRow" style={{ alignItems: 'center' }}>
                    <div className="erpRow__body">
                      <RecordLink type={l.entity_type} id={l.entity_id} label={l.entity_label} />
                      <div className="erpRow__sub">{[l.role, timeAgo(l.created_at)].filter(Boolean).join(' · ')}</div>
                    </div>
                  </div>
                ))
              )}
            </Card>

            <Card title="Follow-ups" icon={ListChecks}>
              <RelatedTasks entityType="contact" entityId={c.id} entityLabel={c.name} suggest={`Call ${c.name.split(' ')[0]}`} />
            </Card>
            <Card title="Meetings" icon={Users}>
              <RelatedMeetings entityType="contact" entityId={c.id} entityLabel={c.name} />
            </Card>
            <Card title="Emails">
              <EmailLog entityType="contact" entityId={c.id} />
            </Card>
            <Card title="History" icon={History}>
              <ActivityFeed entityType="contact" entityId={c.id} emptyText="No changes recorded yet." />
            </Card>
            <Link href={`/admin/deals/leads/new?contact=${c.id}`} className="erpBtn soft block">
              <Plus size={15} /> Start a lead for {c.name.split(' ')[0]}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}
