'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Briefcase, FolderOpen, History, ListChecks, Mail, Tag, Target, Trash2, UserRound, Users, Wallet } from 'lucide-react'
import { api, type Audited, type Contact } from './lib'
import { Banner, ByLine, Card, Chips, Field, Loading, Pill } from './ui'
import { ActivityFeed, EntityPicker, RelatedMeetings, NO_LINK, type LinkValue } from './records'
import { DocsJump, DocumentsPanel, PendingDocs, uploadAll } from './documents'
import { ContactPicker, PeoplePanel } from './contacts'
import { RelatedTasks } from './leadPanels'
import { EmailButton, EmailLog, MeetNowButton } from './google'

const STAGES = ['Enquiry', 'Negotiation', 'Agreement', 'Registration', 'Closed'] as const
const REPRESENTING = ['Buyer', 'Seller', 'Both'] as const
const COMMISSION = ['Percentage', 'Flat'] as const

interface Deal extends Audited {
  id: string
  reference: string
  property_id?: string | null
  property_label: string
  stage: (typeof STAGES)[number]
  outcome: 'In progress' | 'Closed' | 'Lost'
  buyer_name: string
  buyer_phone?: string
  buyer_email?: string
  seller_name: string
  seller_phone?: string
  seller_email?: string
  representing: (typeof REPRESENTING)[number]
  deal_value_cr?: number | null
  commission_type: (typeof COMMISSION)[number]
  commission_value?: number | null
  commission_collected: boolean
  advisor?: string
  notes?: string
  lost_reason?: string
  opened_at: string
  lead_id?: string | null
  buyer_contact_id?: string | null
  seller_contact_id?: string | null
}

function dealEmail(t: Deal, who: 'buyer' | 'seller') {
  const name = (who === 'buyer' ? t.buyer_name : t.seller_name) || ''
  return {
    to: (who === 'buyer' ? t.buyer_email : t.seller_email) || '',
    subject: `${t.property_label} — next steps | Bhumi Estates`,
    body: [`Dear ${name ? name.split(' ')[0] : 'Sir / Madam'},`, `Following up on ${t.property_label}. We are now at the ${t.stage.toLowerCase()} stage.`, 'Next steps:\n• \n• ', 'Warm regards,'].join('\n\n'),
    entity_type: 'transaction',
    entity_id: t.id,
    entity_label: `${t.reference} · ${t.property_label}`,
  }
}

export default function DealEditor({ id }: { id: string }) {
  const isNew = id === 'new'
  const router = useRouter()
  const [t, setT] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [losing, setLosing] = useState(false)
  const [lostReason, setLostReason] = useState('')

  const [f, setF] = useState({
    property_label: '',
    deal_value_cr: '',
    advisor: '',
    buyer_name: '',
    buyer_phone: '',
    buyer_email: '',
    seller_name: '',
    seller_phone: '',
    seller_email: '',
    commission_value: '',
    notes: '',
  })
  const [representing, setRepresenting] = useState<Deal['representing']>('Both')
  const [ctype, setCtype] = useState<Deal['commission_type']>('Percentage')
  const [listing, setListing] = useState<LinkValue>(NO_LINK)
  const [party, setParty] = useState<{ buyer: string | null; seller: string | null }>({ buyer: null, seller: null })
  const [picking, setPicking] = useState<'buyer' | 'seller' | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [fileCat, setFileCat] = useState('Agreement')
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }))
    // Retyping a party's name or phone detaches the picked contact; the
    // server then matches (or creates) them again from what was typed.
    if (k === 'buyer_name' || k === 'buyer_phone') setParty((p) => ({ ...p, buyer: null }))
    if (k === 'seller_name' || k === 'seller_phone') setParty((p) => ({ ...p, seller: null }))
  }

  const hydrate = useCallback((x: Deal) => {
    setT(x)
    setF({
      property_label: x.property_label,
      deal_value_cr: x.deal_value_cr != null ? String(x.deal_value_cr) : '',
      advisor: x.advisor ?? '',
      buyer_name: x.buyer_name ?? '',
      buyer_phone: x.buyer_phone ?? '',
      buyer_email: x.buyer_email ?? '',
      seller_name: x.seller_name ?? '',
      seller_phone: x.seller_phone ?? '',
      seller_email: x.seller_email ?? '',
      commission_value: x.commission_value != null ? String(x.commission_value) : '',
      notes: x.notes ?? '',
    })
    setRepresenting(x.representing)
    setCtype(x.commission_type)
    setListing(x.property_id ? { entity_type: 'property', entity_id: x.property_id, entity_label: x.property_label } : NO_LINK)
    setParty({ buyer: x.buyer_contact_id ?? null, seller: x.seller_contact_id ?? null })
  }, [])

  function pickParty(side: 'buyer' | 'seller', c: Contact) {
    setF((p) => ({ ...p, [`${side}_name`]: c.name, [`${side}_phone`]: c.phone ?? '', [`${side}_email`]: c.email ?? '' }))
    setParty((p) => ({ ...p, [side]: c.id }))
    setPicking(null)
  }

  const reload = useCallback(async () => {
    const r = await api.get<{ data: Deal[] }>('/api/transactions')
    const x = r.data.find((y) => y.id === id)
    if (x) hydrate(x)
    else setError('Deal not found')
  }, [id, hydrate])

  useEffect(() => {
    if (isNew) return
    reload()
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [isNew, reload])

  async function patch(body: Record<string, unknown>) {
    if (!t) return
    setError(null)
    try {
      await api.put(`/api/transactions/${t.id}`, body)
      await reload()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function save() {
    if (!f.property_label.trim()) return setError('Give the deal a label, e.g. the parcel or unit')
    if (!f.buyer_name.trim() && !f.seller_name.trim()) return setError('Add at least a buyer or a seller')
    setBusy(true)
    setError(null)
    const body = {
      ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()])),
      property_id: listing.entity_type === 'property' ? listing.entity_id : null,
      representing,
      commission_type: ctype,
      deal_value_cr: f.deal_value_cr.trim() === '' ? null : Number(f.deal_value_cr),
      commission_value: f.commission_value.trim() === '' ? null : Number(f.commission_value),
      // A party picked from contacts is sent as-is; one typed by hand is
      // matched or created by phone on the server.
      ...(party.buyer ? { buyer_contact_id: party.buyer } : {}),
      ...(party.seller ? { seller_contact_id: party.seller } : {}),
    }
    try {
      if (isNew) {
        const r = await api.post<{ id?: string; reference?: string }>('/api/transactions', body)
        if (r.id && files.length) await uploadAll(files, { entity_type: 'transaction', entity_id: r.id, entity_label: `${r.reference ?? ''} · ${f.property_label.trim()}`, category: fileCat })
        router.push(r.id ? `/admin/deals/${r.id}` : '/admin/deals')
      } else {
        await api.put(`/api/transactions/${id}`, body)
        await reload()
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!t || !confirm(`Delete ${t.reference}? This cannot be undone.`)) return
    await api.del(`/api/transactions/${t.id}`)
    router.push('/admin/deals')
  }

  if (loading) return <Loading />

  return (
    <div className="erpPage">
      <Link href="/admin/deals" className="erpCard__action" style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> Deals
      </Link>
      <div className="erpHead">
        <div>
          <h1>{isNew ? 'New deal' : t?.property_label}</h1>
          {t ? (
            <>
              <p>
                {t.reference} · <Pill label={t.outcome === 'In progress' ? t.stage : t.outcome} tone={t.outcome === 'In progress' ? 'progress' : t.outcome} />
              </p>
              <ByLine record={t} createdAt={t.opened_at} />
            </>
          ) : null}
        </div>
        {t ? (
          <div className="erpHead__actions">
            <DocsJump entityType="transaction" entityId={t.id} />
          </div>
        ) : null}
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}
      {saved ? <Banner tone="ok">Saved.</Banner> : null}
      {t?.lead_id ? (
        <Banner tone="ok">
          <Target size={15} /> Came from a lead —{' '}
          <Link href={`/admin/deals/leads/${t.lead_id}`} style={{ fontWeight: 700 }}>
            open the lead and the listings shown
          </Link>
        </Banner>
      ) : null}

      <div className="erpGrid main">
        <div className="erpCol">
          {t ? (
            <Card title="Stage" icon={Briefcase}>
              <Chips options={STAGES} value={t.outcome === 'Lost' ? '' : t.stage} onChange={(stage) => patch({ stage })} />
              <div style={{ marginTop: 12 }}>
                {t.outcome === 'Lost' ? (
                  <>
                    <p style={{ color: 'var(--flagged)', fontWeight: 700, marginBottom: 8 }}>Lost{t.lost_reason ? `: ${t.lost_reason}` : ''}</p>
                    <button className="erpBtn ghost" onClick={() => patch({ reopen: true })}>
                      Reopen deal
                    </button>
                  </>
                ) : t.outcome === 'In progress' ? (
                  losing ? (
                    <div className="erpForm">
                      <input className="erpInput" value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder="Why was it lost? Buyer went with another parcel, price gap…" />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="erpBtn ghost" onClick={() => setLosing(false)}>
                          Cancel
                        </button>
                        <button
                          className="erpBtn danger"
                          onClick={async () => {
                            await patch({ mark_lost: true, lost_reason: lostReason.trim() })
                            setLosing(false)
                          }}
                        >
                          Mark lost
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="erpBtn danger sm" onClick={() => setLosing(true)}>
                      Mark as lost
                    </button>
                  )
                ) : null}
              </div>
            </Card>
          ) : null}

          <Card title="Deal" icon={Briefcase}>
            <div className="erpForm two">
              <Field label="Property / deal label" full>
                <input className="erpInput" value={f.property_label} onChange={set('property_label')} placeholder="e.g. 3 BHK, JP Nagar" />
              </Field>
              <div className="erpField full">
                <EntityPicker
                  value={listing}
                  types={['property']}
                  label="Linked listing (optional)"
                  onChange={(v) => {
                    setListing(v)
                    if (v.entity_label && !f.property_label.trim()) setF((p) => ({ ...p, property_label: v.entity_label }))
                  }}
                />
              </div>
              <Field label="Deal value (₹ crore)">
                <input className="erpInput" inputMode="decimal" value={f.deal_value_cr} onChange={set('deal_value_cr')} />
              </Field>
              <Field label="Advisor">
                <input className="erpInput" value={f.advisor} onChange={set('advisor')} />
              </Field>
              <Field label="Representing" full>
                <Chips options={REPRESENTING} value={representing} onChange={setRepresenting} />
              </Field>
            </div>
          </Card>

          <Card title="Parties" icon={Users}>
            <div className="erpForm two" style={{ marginBottom: 12 }}>
              {(['buyer', 'seller'] as const).map((side) => (
                <div key={side}>
                  {party[side] ? (
                    <Link href={`/admin/deals/contacts/${party[side]}`} className="erpLink">
                      <UserRound size={12} /> <span>{side === 'buyer' ? 'Buyer' : 'Seller'}’s contact card</span>
                    </Link>
                  ) : null}
                  <button type="button" className="erpBtn ghost sm" style={{ marginTop: 4 }} onClick={() => setPicking(picking === side ? null : side)}>
                    <Users size={13} /> {party[side] ? 'Change' : 'Pick'} {side} from contacts
                  </button>
                </div>
              ))}
            </div>
            {picking ? (
              <div style={{ marginBottom: 12 }}>
                <ContactPicker defaultRole={picking === 'buyer' ? 'Buyer' : 'Seller'} autoFocus onPick={(c) => pickParty(picking, c)} />
              </div>
            ) : null}
            <div className="erpForm two">
              <Field label="Buyer">
                <input className="erpInput" value={f.buyer_name} onChange={set('buyer_name')} />
              </Field>
              <Field label="Seller">
                <input className="erpInput" value={f.seller_name} onChange={set('seller_name')} />
              </Field>
              <Field label="Buyer phone">
                <input className="erpInput" type="tel" value={f.buyer_phone} onChange={set('buyer_phone')} />
              </Field>
              <Field label="Seller phone">
                <input className="erpInput" type="tel" value={f.seller_phone} onChange={set('seller_phone')} />
              </Field>
              <Field label="Buyer email">
                <input className="erpInput" type="email" value={f.buyer_email} onChange={set('buyer_email')} />
              </Field>
              <Field label="Seller email">
                <input className="erpInput" type="email" value={f.seller_email} onChange={set('seller_email')} />
              </Field>
            </div>
          </Card>

          <Card title="Commission" icon={Wallet}>
            <div className="erpForm two">
              <Field label="Type">
                <Chips options={COMMISSION} value={ctype} onChange={setCtype} />
              </Field>
              <Field label={ctype === 'Percentage' ? 'Percent of deal value' : 'Flat fee (₹ lakh)'}>
                <input className="erpInput" inputMode="decimal" value={f.commission_value} onChange={set('commission_value')} />
              </Field>
              {t ? (
                <label className="erpToggle erpField full">
                  Commission collected
                  <input type="checkbox" checked={t.commission_collected} onChange={(e) => patch({ commission_collected: e.target.checked })} />
                </label>
              ) : null}
            </div>
          </Card>

          <Card title="Notes">
            <textarea className="erpInput" value={f.notes} onChange={set('notes')} />
          </Card>

          {isNew ? (
            <Card title="Documents" icon={FolderOpen}>
              <PendingDocs files={files} onChange={setFiles} entityType="transaction" category={fileCat} onCategory={setFileCat} />
            </Card>
          ) : null}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="erpBtn primary" style={{ flex: 1 }} onClick={save} disabled={busy}>
              {busy ? 'Saving…' : isNew ? (files.length ? `Create deal + ${files.length} file${files.length > 1 ? 's' : ''}` : 'Create deal') : 'Save changes'}
            </button>
            {t ? (
              <button className="erpBtn danger" onClick={remove}>
                <Trash2 size={15} /> Delete
              </button>
            ) : null}
          </div>
        </div>

        {t ? (
          <div className="erpCol">
            <Card title="Documents" icon={FolderOpen} id="documents">
              <DocumentsPanel entityType="transaction" entityId={t.id} entityLabel={`${t.reference} · ${t.property_label}`} />
            </Card>
            <Card title="Contact" icon={Mail}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <EmailButton block label={t.buyer_name ? `Email ${t.buyer_name.split(' ')[0]}` : 'Email buyer'} draft={dealEmail(t, 'buyer')} />
                <EmailButton block label={t.seller_name ? `Email ${t.seller_name.split(' ')[0]}` : 'Email seller'} draft={dealEmail(t, 'seller')} />
              </div>
              <div style={{ marginTop: 8 }}>
                <MeetNowButton block entityType="transaction" entityId={t.id} entityLabel={`${t.reference} · ${t.property_label}`} title={`Call · ${t.property_label}`} />
              </div>
              <div style={{ marginTop: 10 }}>
                <EmailLog entityType="transaction" entityId={t.id} />
              </div>
            </Card>
            <Card title="Follow-ups" icon={ListChecks}>
              <RelatedTasks entityType="transaction" entityId={t.id} entityLabel={`${t.reference} · ${t.property_label}`} />
            </Card>
            <Card title="Also involved" icon={Tag}>
              <PeoplePanel
                entityType="transaction"
                entityId={t.id}
                entityLabel={`${t.reference} · ${t.property_label}`}
                roles={['Lawyer', 'Broker', 'Landowner', 'Surveyor', 'Investor', 'Other']}
                emptyText="Tag the lawyers, brokers or co-owners on this deal."
              />
            </Card>
            <Card title="Meetings & calls" icon={Users}>
              <RelatedMeetings entityType="transaction" entityId={t.id} entityLabel={`${t.reference} · ${t.property_label}`} />
            </Card>
            <Card title="History" icon={History}>
              <ActivityFeed entityType="transaction" entityId={t.id} emptyText="No changes recorded yet." />
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}
