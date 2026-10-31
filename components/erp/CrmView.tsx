'use client'

import Link from 'next/link'
import DealsView from './DealsView'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Mail, MessageCircle, Phone, Plus, Trash2, Upload, X } from 'lucide-react'
import { api, followUpDue, leadIsOpen, ourCommissionLakh, telHref, waHref } from './lib'
import { Banner, Card, Empty, Field, Loading, Pill } from './ui'
import CrmPlaybook, { CopyBtn } from './CrmPlaybook'
import {
  DEAL_WEIGHT, FOLLOW_UP_DAYS, LISTS, LIST_KEYS, SOURCES, STAGES, addDays, isOverdue, matchParcels, openingMessage, prioFromScore, rupees, today,
  type ListKey, type Parcel, type Prospect,
} from '@/lib/crm'

/* The sales funnel, inside the ERP: who to contact today, what to say,
   and what happens next. Prospects are outbound targets (distinct from
   inbound leads); the pipeline holds the deals that have a value. */

type Tab = 'home' | 'prospects' | 'leads' | 'deals' | 'contacts' | 'agents' | 'docs' | 'playbook'
/* The whole sales motion in one place, in the order work moves:
   the funnel, outbound prospects and their pipeline, inbound leads and
   the deals they become, the people involved, then the playbook. */
/** What the funnel needs from a deal; the full record lives in the Deals tab. */
interface Txn { id: string; property_label: string; stage: string; outcome: string; deal_value_cr?: number | null; commission_type: 'Percentage' | 'Flat'; commission_value?: number | null; next_date?: string | null }

const TABS: [Tab, string][] = [['home', 'Funnel'], ['prospects', 'Prospects'], ['leads', 'Leads'], ['deals', 'Deals'], ['contacts', 'Contacts'], ['agents', 'Agents'], ['docs', 'Doc requests'], ['playbook', 'Playbook']]
const DEALS_TAB = { leads: 'leads', deals: 'pipeline', contacts: 'contacts', agents: 'agents', docs: 'docs' } as const
const PIPE_STAGES = [2, 3, 4, 5] as const
const PIPE_LABEL: Record<number, string> = { 2: 'Interested', 3: 'Proposal sent', 4: 'Won', 5: 'Lost' }
const PRIOS = ['A', 'B', 'C'] as const
const blank = (list: ListKey): Prospect => ({
  id: '', list, name: '', kind: '', sector: '', prio: 'B', email: '', alt_emails: '', phone: '', area: '', requirement: '',
  trigger_why: '', history: '', stage: 0, next_date: null, value: null, owner: '', note: '', contact_person: '', website: '',
  source: '', source_url: '', deal_band: '', score: null, last_contacted: null, updated_at: '',
})

export default function CrmView() {
  const params = useSearchParams()
  const router = useRouter()
  const tab = (TABS.find(([t]) => t === (params.get('tab') === 'pipeline' ? 'deals' : params.get('tab')))?.[0] ?? 'home') as Tab
  const [prospects, setProspects] = useState<Prospect[] | null>(null)
  const [txns, setTxns] = useState<Txn[]>([])
  const [me, setMe] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [list, setList] = useState<ListKey>('B')
  const [edit, setEdit] = useState<Prospect | null>(null)
  const [importing, setImporting] = useState(false)
  const [listings, setListings] = useState<Parcel[]>([])

  const [prio, setPrio] = useState('')
  const [stageF, setStageF] = useState('')
  const [areaF, setAreaF] = useState('')
  const [hasEmail, setHasEmail] = useState(false)
  const [q, setQ] = useState('')
  // Inbound side of the funnel, shown on the Funnel tab: open leads and deals in progress.
  const [inbound, setInbound] = useState({ leads: 0, due: 0 })

  const go = (t: Tab) => router.replace(`/admin/crm${t === 'home' ? '' : `?tab=${t}`}`)

  const load = useCallback(async () => {
    try {
      const [p, t, l, m, ls] = await Promise.all([
        api.get<{ data: Prospect[]; error?: string }>('/api/crm/prospects'),
        api.get<{ data: Txn[]; source: string }>('/api/transactions').catch(() => null),
        api.get<{ data: { stage: string; next_follow_up_at?: string | null }[]; source: string }>('/api/leads').catch(() => null),
        api.get<{ user: { name: string } }>('/api/admin/me').catch(() => null),
        api.get<{ data: Parcel[]; source?: string }>('/api/properties?admin=1').catch(() => ({ data: [] as Parcel[], source: 'fallback' })),
      ])
      const openLeads = l && l.source === 'live' ? l.data.filter((x) => leadIsOpen(x.stage) && x.stage !== 'Nurture') : []
      setInbound({ leads: openLeads.length, due: openLeads.filter((x) => followUpDue(x as never)).length })
      setTxns(t && t.source === 'live' ? t.data : [])
      if (ls.source === 'live') setListings(ls.data)
      setError(p.error || null)
      setProspects(p.data)
      if (m) setMe(m.user.name)
    } catch (e) {
      setError((e as Error).message)
      setProspects([])
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])

  async function run(fn: () => Promise<unknown>) {
    setError(null)
    try {
      await fn()
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const patchProspect = (id: string, patch: Partial<Prospect>) => {
    setProspects((cur) => cur && cur.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    return run(() => api.patch(`/api/crm/prospects?id=${id}`, patch))
  }
  const setStage = (p: Prospect, stage: number) => {
    const patch: Partial<Prospect> = { stage }
    // Every stage carries a next date: fill the playbook's gap if there isn't a future one.
    if (FOLLOW_UP_DAYS[stage] && (!p.next_date || p.next_date <= today())) patch.next_date = addDays(FOLLOW_UP_DAYS[stage])
    if (stage >= 1 && !p.last_contacted) patch.last_contacted = today()
    return patchProspect(p.id, patch)
  }
  const followedUp = (p: Prospect) =>
    patchProspect(p.id, { last_contacted: today(), next_date: addDays(FOLLOW_UP_DAYS[Math.max(1, p.stage)] ?? 3), stage: Math.max(1, p.stage) })
  // Opens a real deal (same record as Deals) on the prospect, then goes to it.
  const openDeal = (p: Prospect, l?: Parcel) =>
    run(async () => {
      const r = await api.post<{ id: string }>(`/api/crm/prospects/${p.id}/convert`, {
        to: 'deal',
        property_id: (l as (Parcel & { id?: string }) | undefined)?.id,
        property_label: l ? `${l.code}: ${l.title}` : undefined,
        deal_value_cr: l?.price_total_cr,
      })
      router.push(`/admin/deals/${r.id}`)
    })
  const makeLead = (p: Prospect) =>
    run(async () => {
      const r = await api.post<{ lead_id: string | null }>(`/api/crm/prospects/${p.id}/convert`, { to: 'lead' })
      if (r.lead_id) router.push(`/admin/deals/leads/${r.lead_id}`)
    })

  const all = prospects ?? []
  const areas = useMemo(() => [...new Set(all.filter((p) => p.list === list).map((p) => p.area).filter(Boolean))].sort(), [all, list])
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return all
      .filter((p) => p.list === list)
      .filter((p) => (!prio || p.prio === prio) && (stageF === '' || p.stage === Number(stageF)) && (!areaF || p.area === areaF) && (!hasEmail || p.email))
      .filter((p) => !needle || [p.name, p.kind, p.sector, p.area, p.requirement, p.email, p.phone].join(' ').toLowerCase().includes(needle))
      .sort((a, b) => (a.prio ?? 'Z').localeCompare(b.prio ?? 'Z') || a.name.localeCompare(b.name))
  }, [all, list, prio, stageF, areaF, hasEmail, q])

  const openDeals = txns.filter((t) => t.outcome === 'In progress')
  const lakh = (t: Txn) => ourCommissionLakh({ deal_value_cr: t.deal_value_cr, commission_type: t.commission_type, commission_value: t.commission_value }) ?? 0
  const crore = (t: Txn) => (t.deal_value_cr ?? 0) * 1e7
  const weightedCommission = openDeals.reduce((s, t) => s + lakh(t) * 1e5 * (DEAL_WEIGHT[t.stage] ?? 0), 0)
  const noCommission = openDeals.filter((t) => t.commission_value == null).length
  const won = txns.filter((t) => t.outcome === 'Closed')
  const dealsOverdue = openDeals.filter((t) => !!t.next_date && t.next_date <= today())
  const overdue = [...all.filter(isOverdue), ...dealsOverdue]
  const first = me.split(/\s+/)[0] || 'there'

  return (
    <div className="erpPage">
      <div className="erpHead">
        <div>
          <h1>Sales funnel</h1>
          <p>Prospects and leads in, deals out: who to contact today, what to say, and what happens next. Commission is agreed for each property.</p>
        </div>
        <div className="erpHead__actions">
          {tab in DEALS_TAB ? null : (
            <button className="erpBtn primary" onClick={() => setEdit(blank(list))}>
              <Plus size={15} /> Prospect
            </button>
          )}
        </div>
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}

      <div className="erpSeg">
        {TABS.map(([t, label]) => (
          <button key={t} className={tab === t ? 'is-on' : ''} onClick={() => go(t)}>
            {label}
          </button>
        ))}
      </div>

      {tab in DEALS_TAB ? (
        <DealsView embedded tab={DEALS_TAB[tab as keyof typeof DEALS_TAB]} />
      ) : prospects === null ? (
        <Loading />
      ) : tab === 'home' ? (
        <>
          <p style={{ margin: '0 0 14px', fontWeight: 600 }}>
            Hello, {first}.{' '}
            <span style={{ color: overdue.length ? 'var(--bad, #b3261e)' : 'var(--muted)' }}>
              {overdue.length ? `${overdue.length} follow-up${overdue.length > 1 ? 's' : ''} overdue or due today.` : 'Nothing overdue.'}
            </span>
          </p>
          <div className="crmKpis">
            <Kpi label="Commission pipeline" value={rupees(weightedCommission)} note="weighted, from each deal’s terms" />
            <Kpi label="Deals won" value={String(won.length)} note={rupees(won.reduce((s, t) => s + lakh(t) * 1e5, 0)) + ' commission'} onClick={() => go('deals')} />
            <Kpi label="Interested" value={String(all.filter((p) => p.stage === 2).length)} note="prospects" />
            <Kpi label="Overdue" value={String(overdue.length)} note="follow-ups" alert={overdue.length > 0} />
          </div>
          <div className="crmKpis" style={{ marginTop: 12 }}>
            <Kpi label="Open leads" value={String(inbound.leads)} note="inbound enquiries" onClick={() => go('leads')} />
            <Kpi label="Leads due" value={String(inbound.due)} note="follow-up today or late" alert={inbound.due > 0} onClick={() => go('leads')} />
            <Kpi label="Open pipeline" value={rupees(openDeals.reduce((s, t) => s + crore(t), 0))} note={`${openDeals.length} deal${openDeals.length === 1 ? '' : 's'}${noCommission ? ` · ${noCommission} without commission` : ''}`} alert={noCommission > 0} onClick={() => go('deals')} />
          </div>
          <div className="erpGrid main" style={{ marginTop: 16 }}>
            <div className="erpCol">
              <Card title="Follow up now">
                {all.filter(isOverdue).length === 0 ? (
                  <Empty>No follow-ups due. Set a next date on every prospect.</Empty>
                ) : (
                  all.filter(isOverdue).sort((a, b) => (a.next_date ?? '').localeCompare(b.next_date ?? '')).map((p) => <MiniRow key={p.id} p={p} onOpen={setEdit} />)
                )}
              </Card>
              <Card title="Start here" style={{ marginTop: 16 }}>
                {all.filter((p) => p.prio === 'A' && p.stage === 0).length === 0 ? (
                  <Empty>No priority-A prospects waiting to be contacted.</Empty>
                ) : (
                  all.filter((p) => p.prio === 'A' && p.stage === 0).slice(0, 8).map((p) => <MiniRow key={p.id} p={p} onOpen={setEdit} />)
                )}
              </Card>
            </div>
            <div className="erpCol">
              <Card title="Funnel">
                {STAGES.map((s, i) => {
                  const n = all.filter((p) => p.stage === i).length
                  const max = Math.max(1, ...STAGES.map((_, j) => all.filter((p) => p.stage === j).length))
                  return (
                    <div key={s} className="crmBar">
                      <span>{s}</span>
                      <i style={{ width: `${(n / max) * 100}%` }} />
                      <b>{n}</b>
                    </div>
                  )
                })}
              </Card>
              <Card title="Your lists" style={{ marginTop: 16 }}>
                {LIST_KEYS.map((k) => (
                  <button key={k} className="erpRow" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setList(k); go('prospects') }}>
                    <div className="erpRow__body">
                      <div className="erpRow__title">{LISTS[k].label}</div>
                      <div className="erpRow__sub">{LISTS[k].hint}</div>
                    </div>
                    <div className="erpRow__right">{all.filter((p) => p.list === k).length}</div>
                  </button>
                ))}
              </Card>
            </div>
          </div>
        </>
      ) : tab === 'prospects' ? (
        <>
          <div className="erpSeg">
            {LIST_KEYS.map((k) => (
              <button key={k} className={list === k ? 'is-on' : ''} onClick={() => { setList(k); setAreaF('') }}>
                {LISTS[k].label} · {all.filter((p) => p.list === k).length}
              </button>
            ))}
          </div>
          <div className="erpCard crmFilters">
            <input className="erpInput" placeholder="Search name, area, requirement…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="erpChips">
              {PRIOS.map((x) => (
                <button key={x} type="button" className={`erpChip ${prio === x ? 'is-on' : ''}`} onClick={() => setPrio(prio === x ? '' : x)}>
                  Priority {x}
                </button>
              ))}
            </div>
            <select className="erpInput" value={stageF} onChange={(e) => setStageF(e.target.value)}>
              <option value="">Any stage</option>
              {STAGES.map((s, i) => (
                <option key={s} value={i}>{s}</option>
              ))}
            </select>
            <select className="erpInput" value={areaF} onChange={(e) => setAreaF(e.target.value)}>
              <option value="">Any area</option>
              {areas.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <label className="erpToggle">
              <input type="checkbox" checked={hasEmail} onChange={(e) => setHasEmail(e.target.checked)} /> Has email
            </label>
            <button className="erpBtn ghost sm" onClick={() => setImporting((v) => !v)}>
              <Upload size={14} /> Import CSV
            </button>
          </div>
          {importing ? <ImportPanel list={list} onDone={() => { setImporting(false); load() }} onError={setError} /> : null}
          {shown.length === 0 ? (
            <div className="erpCard">
              <Empty>
                {all.some((p) => p.list === list)
                  ? 'No prospects match those filters.'
                  : `No ${LISTS[list].label.toLowerCase()} yet. Add one, or import a CSV. Only add someone if you can finish: "They buy this because ___."`}
              </Empty>
            </div>
          ) : (
            <div className="crmCards">
              {shown.map((p) => (
                <ProspectCard key={p.id} p={p} me={me} onOpen={() => setEdit(p)} onStage={(stage) => setStage(p, stage)} onFollowedUp={() => followedUp(p)} />
              ))}
            </div>
          )}
        </>
      ) : (
        <CrmPlaybook me={me} />
      )}

      {edit ? (
        <ProspectPanel
          p={edit}
          me={me}
          listings={listings}
          onDeal={(l) => { openDeal(edit, l); setEdit(null) }}
          onLead={() => { makeLead(edit); setEdit(null) }}
          onClose={() => setEdit(null)}
          onSave={(d) => run(async () => { await (d.id ? api.patch(`/api/crm/prospects?id=${d.id}`, d) : api.post('/api/crm/prospects', d)); setEdit(null) })}
          onDelete={(id) => run(async () => { await api.del(`/api/crm/prospects?id=${id}`); setEdit(null) })}
        />
      ) : null}
    </div>
  )
}

/* ─── Pieces ───────────────────────────────────────────────── */

function Kpi({ label, value, note, alert, onClick }: { label: string; value: string; note: string; alert?: boolean; onClick?: () => void }) {
  return (
    <div className={`erpCard crmKpi ${alert ? 'is-alert' : ''}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <span>{label}</span>
      <b>{value}</b>
      <small>{note}</small>
    </div>
  )
}

function PrioChip({ prio }: { prio: Prospect['prio'] }) {
  return prio ? <span className={`crmPrio is-${prio}`}>{prio}</span> : null
}

function MiniRow({ p, onOpen }: { p: Prospect; onOpen: (p: Prospect) => void }) {
  return (
    <button className="erpRow" style={{ width: '100%', textAlign: 'left' }} onClick={() => onOpen(p)}>
      <PrioChip prio={p.prio} />
      <div className="erpRow__body">
        <div className="erpRow__title">{p.name}</div>
        <div className="erpRow__sub">{[LISTS[p.list].one, p.area, STAGES[p.stage]].filter(Boolean).join(' · ')}</div>
      </div>
      {p.next_date ? <div className={`erpRow__right ${isOverdue(p) ? 'crmLate' : ''}`}>{p.next_date}</div> : null}
    </button>
  )
}

function ProspectCard({ p, me, onOpen, onStage, onFollowedUp }: { p: Prospect; me: string; onOpen: () => void; onStage: (s: number) => void; onFollowedUp: () => void }) {
  const msg = openingMessage(p, me)
  return (
    <div className="erpCard crmCard">
      <div className="crmCard__top">
        <PrioChip prio={p.prio} />
        <button className="crmLink" onClick={onOpen}>{p.name}</button>
      </div>
      <div className="crmSub">{[p.kind, p.sector, p.deal_band].filter(Boolean).join(' · ')}</div>
      {p.contact_person ? <div className="crmSub">Ask for: {p.contact_person}</div> : null}
      {p.requirement ? <p className="crmLine"><b>Needs:</b> {p.requirement}</p> : null}
      {p.trigger_why ? <p className="crmLine"><b>Why now:</b> {p.trigger_why}</p> : null}
      <div className="crmSub">{[p.email, p.phone].filter(Boolean).join(' · ')}</div>
      <div className="crmActions">
        {p.email ? <a className="erpBtn ghost sm" href={`mailto:${p.email}?subject=${encodeURIComponent('Verified land parcels near Bengaluru')}&body=${encodeURIComponent(msg)}`}><Mail size={13} /> Email</a> : null}
        {p.phone ? <a className="erpBtn ghost sm" href={telHref(p.phone)}><Phone size={13} /> Call</a> : null}
        {p.phone ? <a className="erpBtn ghost sm" href={waHref(p.phone, msg)} target="_blank" rel="noopener noreferrer"><MessageCircle size={13} /> WhatsApp</a> : null}
        <select className="erpInput crmStage" value={p.stage} onChange={(e) => onStage(Number(e.target.value))} aria-label="Stage">
          {STAGES.map((s, i) => (
            <option key={s} value={i}>{s}</option>
          ))}
        </select>
        <button className="erpBtn ghost sm" onClick={onFollowedUp} title="Logs a touch today and sets the next date per the playbook"><Check size={13} /> Followed up</button>
        {p.next_date ? <span className={`crmSub ${isOverdue(p) ? 'is-late' : ''}`}>Next: {p.next_date}</span> : null}
      </div>
    </div>
  )
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="crmOverlay" onClick={onClose}>
      <aside className="crmDrawer" onClick={(e) => e.stopPropagation()}>
        <div className="crmDrawer__head">
          <b>{title}</b>
          <button className="erpBtn ghost sm" onClick={onClose} aria-label="Close"><X size={15} /></button>
        </div>
        {children}
      </aside>
    </div>
  )
}

function ProspectPanel({ p, me, listings, onDeal, onLead, onClose, onSave, onDelete }: { p: Prospect; me: string; listings: Parcel[]; onDeal: (l?: Parcel) => void; onLead: () => void; onClose: () => void; onSave: (d: Prospect) => void; onDelete: (id: string) => void }) {
  const [d, setD] = useState<Prospect>({ ...p, owner: p.owner || me })
  const set = <K extends keyof Prospect>(k: K, v: Prospect[K]) => setD((x) => ({ ...x, [k]: v }))
  const text = (k: keyof Prospect, label: string, full = false) => (
    <Field label={label} full={full}>
      <input className="erpInput" value={String(d[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} />
    </Field>
  )
  const msg = openingMessage(d, me)
  return (
    <Drawer title={p.id ? p.name : 'New prospect'} onClose={onClose}>
      <div className="erpForm">
        <Field label="List">
          <select className="erpInput" value={d.list} onChange={(e) => set('list', e.target.value as ListKey)}>
            {LIST_KEYS.map((k) => <option key={k} value={k}>{LISTS[k].one}</option>)}
          </select>
        </Field>
        {text('name', 'Company / name')}
        {text('contact_person', 'Decision-maker (name, role)', true)}
        {text('kind', 'Kind', true)}
        {text('sector', 'Sector')}
        {text('deal_band', 'Typical land ticket (e.g. 5–25 acres)')}
        <Field label="Priority">
          <select className="erpInput" value={d.prio ?? ''} onChange={(e) => set('prio', (e.target.value || null) as Prospect['prio'])}>
            <option value="">None</option>
            {PRIOS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        {text('email', 'Email')}
        {text('phone', 'Phone')}
        {text('alt_emails', 'Other emails', true)}
        {text('website', 'Website', true)}
        <Field label="Source">
          <select className="erpInput" value={d.source} onChange={(e) => set('source', e.target.value)}>
            <option value="">Not set</option>
            {SOURCES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        {text('source_url', 'Source link')}
        <Field label="Score" hint={d.score != null ? `Priority ${prioFromScore(d.score)} (A 85+, B 70–84, C below). Fit 40 · trigger 35 · contactability 25.` : 'Fit 40 · trigger 35 · contactability 25.'}>
          <input type="number" min={0} max={100} className="erpInput" value={d.score ?? ''} onChange={(e) => { const v = e.target.value === '' ? null : Number(e.target.value); setD((x) => ({ ...x, score: v, prio: v == null ? x.prio : prioFromScore(v) })) }} />
        </Field>
        {text('area', 'Areas they develop in', true)}
        {text('requirement', 'Requirement (size, place, budget)', true)}
        {text('trigger_why', 'Why they should buy now', true)}
        <Field label="Previous contact" full>
          <textarea className="erpInput" value={d.history} onChange={(e) => set('history', e.target.value)} />
        </Field>
        <Field label="Stage">
          <select className="erpInput" value={d.stage} onChange={(e) => set('stage', Number(e.target.value))}>
            {STAGES.map((s, i) => <option key={s} value={i}>{s}</option>)}
          </select>
        </Field>
        <Field label="Next action date" hint="No date means it is not in the funnel.">
          <input type="date" className="erpInput" value={d.next_date ?? ''} onChange={(e) => set('next_date', e.target.value || null)} />
        </Field>
        <Field label="Deal value (₹)" hint="Excluding commission.">
          <input type="number" className="erpInput" value={d.value ?? ''} onChange={(e) => set('value', e.target.value === '' ? null : Number(e.target.value))} />
        </Field>
        {text('owner', 'Owner')}
        <Field label="Notes" full>
          <textarea className="erpInput" value={d.note} onChange={(e) => set('note', e.target.value)} />
        </Field>
        {p.id ? (
          <Field label="Opening message" full>
            <textarea className="erpInput" readOnly value={msg} style={{ minHeight: 110 }} />
            <CopyBtn text={msg} />
          </Field>
        ) : null}
        {p.id ? (
          <div className="erpField full">
            <span>Parcels to pitch</span>
            {matchParcels(d, listings).length === 0 ? (
              <small>No live listing matches their area, ticket or kind yet. Add what they build and where, and matches appear here.</small>
            ) : (
              matchParcels(d, listings).map(({ l, reasons }) => (
                <div key={l.code} className="crmMatch">
                  <b>{l.code} · {l.extent_acres} acres</b>
                  <div className="crmSub">{l.title}</div>
                  <div className="crmSub">{reasons.join(' · ')}</div>
                  <div className="crmActions">
                    <CopyBtn text={`${l.code}: ${l.title}. ${l.extent_acres} acres, ${l.location}.${l.price_total_cr ? ` ₹${l.price_total_cr} Cr.` : ''} Legally verified; title work done in-house.`} />
                    <button className="erpBtn ghost sm" onClick={() => onDeal(l)}><Plus size={13} /> Open deal on this</button>
                  </div>
                </div>
              ))
            )}
            <button className="erpBtn ghost sm" style={{ marginTop: 6 }} onClick={() => onDeal()}><Plus size={13} /> Open a deal without a parcel</button>
          </div>
        ) : null}
        {p.id ? (
          <div className="erpField full">
            <span>Next step</span>
            <div className="crmActions">
              {p.lead_id ? (
                <Link href={`/admin/deals/leads/${p.lead_id}`} className="erpBtn ghost sm">Open their lead</Link>
              ) : (
                <button className="erpBtn ghost sm" onClick={onLead}>{p.list === 'P' ? 'Save as agent contact' : 'Convert to lead'}</button>
              )}
              {p.contact_id ? <Link href={`/admin/deals/contacts/${p.contact_id}`} className="erpBtn ghost sm">Contact card</Link> : null}
            </div>
            <small>A lead keeps their requirement and viewings; a deal tracks the price and commission. Either way it is the same person, and the next date becomes a task.</small>
          </div>
        ) : null}
        <div className="crmActions">
          <button className="erpBtn primary" onClick={() => d.name.trim() && onSave(d)} disabled={!d.name.trim()}>Save</button>
          {p.id ? <button className="erpBtn ghost" onClick={() => confirm(`Delete ${p.name}?`) && onDelete(p.id)}><Trash2 size={14} /> Delete</button> : null}
        </div>
      </div>
    </Drawer>
  )
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',' || c === '\t') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some((x) => x.trim())) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some((x) => x.trim())) rows.push(row)
  return rows
}

function ImportPanel({ list, onDone, onError }: { list: ListKey; onDone: () => void; onError: (m: string) => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  async function go() {
    const [head, ...body] = parseCsv(text)
    if (!head || !body.length) return onError('Paste a header row and at least one prospect.')
    const keys = head.map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))
    const rows = body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()]).filter(([, v]) => v !== '')))
    for (const r of rows) if (!r.list) r.list = list
    setBusy(true)
    try {
      await api.post('/api/crm/prospects', { rows })
      onDone()
    } catch (e) {
      onError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="erpCard" style={{ marginTop: 12 }}>
      <div className="erpCard__title" style={{ marginBottom: 6 }}>Import prospects</div>
      <p className="crmSub" style={{ marginBottom: 8 }}>
        Paste CSV or tab-separated rows with a header row. Columns: name (required), list (P/D/B/I, defaults to {LISTS[list].label}), kind, sector, prio (A/B/C), email, phone, area, requirement, trigger_why, owner.
      </p>
      <textarea className="erpInput" style={{ minHeight: 140 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="name,kind,prio,email,phone,area,requirement" />
      <div className="crmActions" style={{ marginTop: 10 }}>
        <button className="erpBtn primary" onClick={go} disabled={busy || !text.trim()}>Import</button>
      </div>
    </div>
  )
}
