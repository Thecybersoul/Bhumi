'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Briefcase, FolderOpen, History, ListChecks, Plus, Tag, Target, Trash2, UserRound, Users } from 'lucide-react'
import { api, budget, CONTACT_ROLES, stageLabel, timeAgo, TYPE_LABEL, type Contact, type Lead } from './lib'
import { Banner, ByLine, Card, Empty, Field, Loading, Pill, RecordLink } from './ui'
import { ActivityFeed, RelatedMeetings } from './records'
import { DocsJump, DocumentsPanel, PendingDocs, uploadAll } from './documents'
import { ContactActions } from './contacts'
import { RelatedTasks } from './leadPanels'
import { EmailLog } from './google'

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
type Key = (typeof KEYS)[number]

export default function ContactEditor({ id }: { id: string }) {
  const isNew = id === 'new'
  const router = useRouter()
  const [c, setC] = useState<Contact | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [links, setLinks] = useState<LinkRow[]>([])
  const [f, setF] = useState<Record<Key, string>>(Object.fromEntries(KEYS.map((k) => [k, ''])) as Record<Key, string>)
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [dup, setDup] = useState<Contact | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [fileCat, setFileCat] = useState('KYC')

  const set = (k: Key) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }))

  const reload = useCallback(async () => {
    const r = await api.get<{ data: Contact; leads: Lead[]; deals: Deal[]; links: LinkRow[] }>(`/api/contacts/${id}`)
    setC(r.data)
    setLeads(r.leads)
    setDeals(r.deals)
    setLinks(r.links)
    setF(Object.fromEntries(KEYS.map((k) => [k, (r.data[k] as string | undefined) ?? ''])) as Record<Key, string>)
    setRoles(r.data.roles ?? [])
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
    const body = { ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()])), roles, force }
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
        router.push(out.id ? `/admin/deals/contacts/${out.id}` : '/admin/deals?tab=contacts')
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
      <Link href="/admin/deals?tab=contacts" className="erpCard__action" style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> Contacts
      </Link>
      <div className="erpHead">
        <div>
          <h1>{isNew ? 'New contact' : c!.name}</h1>
          {c ? (
            <>
              <p style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {(c.roles ?? []).map((r) => (
                  <Pill key={r} label={r} tone="progress" />
                ))}
                <span>{[c.company, c.city].filter(Boolean).join(' · ')}</span>
              </p>
              <ByLine record={c} createdAt={c.created_at} />
            </>
          ) : (
            <p>Buyers, sellers, landowners, brokers, lawyers — anyone you deal with. Tag them on deals, listings, tasks and notes.</p>
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

            <Card title="Tagged on" icon={Tag}>
              {links.length === 0 ? (
                <Empty>Tag {c.name.split(' ')[0]} on a listing, deal, task or meeting from its page.</Empty>
              ) : (
                links.map((l) => (
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
