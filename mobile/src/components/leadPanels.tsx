import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi } from '@/lib/api'
import { budget, cr, isSelling, SHOWN_STATUSES, stageLabel, TYPE_LABEL, waUrl, whenShort } from '@/lib/leads'
import { colors, radius, space, text } from '@/lib/theme'
import type { Contact, Lead, MatchItem, Property, Shown, Task } from '@/lib/types'
import { timeAgo } from './people'
import { Badge } from './ui'
import { Button } from './form'
import { EntityPicker } from './entityPicker'
import { WhenField } from './when'
import { ContactPickerSheet } from './contacts'
import { pickFiles, takePhoto } from './documents'
import type { PickedFile } from '@/lib/documents'
import { CATEGORIES, type DocEntity } from '@/lib/documents'

interface ListingLite {
  id: string
  code: string
  title: string
  location: string
  status: string
  property_type?: string
  value_cr?: number | null
}
type LeadLite = Pick<Lead, 'id' | 'name' | 'phone' | 'intent' | 'stage' | 'priority' | 'property_type' | 'locations' | 'budget_min_cr' | 'budget_max_cr' | 'contact_id'>

const SITE = 'https://www.bhumiestates.in'
const valueOf = (p: Partial<Property> & { value_cr?: number | null }) =>
  p.value_cr ??
  p.price_total_cr ??
  (p.extent_acres && p.price_per_acre_cr ? p.extent_acres * p.price_per_acre_cr : p.built_up_sqft && p.price_per_sqft ? (p.built_up_sqft * p.price_per_sqft) / 1e7 : null)

export function listingMessage(name: string, p: { code: string; title: string; location: string } & Partial<Property>) {
  const v = valueOf(p)
  return [
    `Hello ${name.split(' ')[0]}, sharing a property that fits what you're looking for:`,
    `*${p.title}* (${p.code})`,
    [p.location, v ? cr(v) : ''].filter(Boolean).join(' · '),
    `${SITE}/marketplace/${encodeURIComponent(p.code)}`,
    'Happy to arrange a site visit. — Bhumi Estates',
  ].join('\n')
}

function Reasons({ m }: { m: MatchItem<unknown> }) {
  return (
    <View style={s.reasons}>
      {m.reasons.map((r) => (
        <View key={r} style={[s.reason, { backgroundColor: colors.verifiedBg }]}>
          <Text style={[s.reasonText, { color: colors.verified }]}>✓ {r}</Text>
        </View>
      ))}
      {m.concerns.map((r) => (
        <View key={r} style={[s.reason, { backgroundColor: colors.flaggedBg }]}>
          <Text style={[s.reasonText, { color: colors.flagged }]}>! {r}</Text>
        </View>
      ))}
    </View>
  )
}

export function Sub({ children }: { children: React.ReactNode }) {
  return <Text style={s.sub}>{children}</Text>
}

/* ─── Listings shown to a lead ───────────────────────────── */

export function ShownPanel({ lead, onChange }: { lead: Lead; onChange?: () => void }) {
  const api = useApi()
  const [rows, setRows] = useState<Shown[] | null>(null)
  const [listings, setListings] = useState<Record<string, Property>>({})
  const [open, setOpen] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api
      .get<{ data: Shown[] }>(`/api/lead-listings?lead_id=${lead.id}`)
      .then((r) => setRows(r.data))
      .catch((e) => {
        setError(e.message)
        setRows([])
      })
  }, [api, lead.id])
  useEffect(() => {
    load()
    api
      .get<{ data: Property[]; source: string }>('/api/properties?admin=1')
      .then((r) => setListings(Object.fromEntries((r.source === 'live' ? r.data : []).map((p) => [p.id, p]))))
      .catch(() => {})
  }, [load, api])

  async function run(fn: () => Promise<unknown>) {
    setError(null)
    try {
      await fn()
      load()
      onChange?.()
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const add = (property_id: string) => run(() => api.post('/api/lead-listings', { lead_id: lead.id, property_id }))
  const setStatus = (r: Shown, status: string) => run(() => api.patch(`/api/lead-listings?id=${r.id}`, { status }))

  return (
    <View>
      {error ? <Text style={s.error}>{error}</Text> : null}
      {rows === null ? (
        <ActivityIndicator color={colors.navy} />
      ) : rows.length === 0 ? (
        <Text style={s.empty}>Nothing shown yet. Shortlist from the matches, or pick a listing.</Text>
      ) : (
        rows.map((r) => {
          const p = listings[r.property_id]
          const expanded = open === r.id
          return (
            <View key={r.id} style={s.row}>
              <TouchableOpacity onPress={() => (setOpen(expanded ? null : r.id), setFeedback(r.feedback ?? ''))}>
                <View style={s.rowHead}>
                  <Text style={s.title} numberOfLines={1}>{r.property_label}</Text>
                  <Badge label={r.status} tone={r.status.toLowerCase()} />
                </View>
                <Text style={s.meta}>
                  {[p?.location, p ? cr(valueOf(p)) : '', r.visited_at ? `visited ${timeAgo(r.visited_at)}` : r.shared_at ? `shared ${timeAgo(r.shared_at)}` : `added ${timeAgo(r.created_at)}`]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                {r.feedback && !expanded ? <Text style={s.feedback}>“{r.feedback}”</Text> : null}
              </TouchableOpacity>
              {expanded ? (
                <View style={{ marginTop: 8 }}>
                  <View style={s.chips}>
                    {SHOWN_STATUSES.map((st) => (
                      <TouchableOpacity key={st} style={[s.chip, r.status === st && s.chipOn]} onPress={() => setStatus(r, st)}>
                        <Text style={[s.chipText, r.status === st && { color: colors.white }]}>{st}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput style={s.input} value={feedback} onChangeText={setFeedback} placeholder="What did they say? Liked the frontage, price high…" placeholderTextColor={colors.muted} multiline />
                  <View style={s.btnRow}>
                    <View style={{ flex: 1 }}>
                      <Button label="Save feedback" tone="ghost" onPress={() => run(() => api.patch(`/api/lead-listings?id=${r.id}`, { feedback }))} />
                    </View>
                    {lead.phone && p ? (
                      <View style={{ flex: 1 }}>
                        <Button
                          label="WhatsApp it"
                          onPress={() => {
                            Linking.openURL(waUrl(lead.phone, listingMessage(lead.name, p)))
                            if (r.status === 'Shortlisted') setStatus(r, 'Shared')
                          }}
                        />
                      </View>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={{ marginTop: 8 }}
                    onPress={() =>
                      Alert.alert('Remove from list?', r.property_label, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => run(() => api.del(`/api/lead-listings?id=${r.id}`)) },
                      ])
                    }
                  >
                    <Text style={[s.meta, { color: colors.flagged, fontWeight: '700' }]}>Remove from list</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )
        })
      )}
      <View style={{ marginTop: space.sm }}>
        <EntityPicker value={{ entity_type: 'general', entity_id: null, entity_label: '' }} types={['property']} label="Add a listing" onChange={(v) => v.entity_id && add(v.entity_id)} />
      </View>
    </View>
  )
}

/* ─── Matches ────────────────────────────────────────────── */

export function LeadMatches({ lead, refreshKey, onShortlist, onDealWith }: { lead: Lead; refreshKey?: number; onShortlist: () => void; onDealWith: (l: LeadLite) => void }) {
  const api = useApi()
  const [data, setData] = useState<{ listings: MatchItem<ListingLite>[]; leads: MatchItem<LeadLite>[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    api
      .get<{ listings: MatchItem<ListingLite>[]; leads: MatchItem<LeadLite>[] }>(`/api/matches?lead_id=${lead.id}`)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [api, lead.id])
  useEffect(load, [load, refreshKey])

  async function shortlist(p: ListingLite) {
    try {
      await api.post('/api/lead-listings', { lead_id: lead.id, property_id: p.id })
      load()
      onShortlist()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const selling = isSelling(lead.intent)
  if (error) return <Text style={s.error}>{error}</Text>
  if (!data) return <ActivityIndicator color={colors.navy} />
  const bare = !lead.property_type && !lead.locations && !lead.corridor && lead.budget_min_cr == null && lead.budget_max_cr == null
  return (
    <View>
      {bare ? <Text style={s.hint}>Add the requirement — type, areas and budget — for sharper matches.</Text> : null}
      {!selling ? (
        <>
          <Sub>Listings that fit</Sub>
          {data.listings.length === 0 ? (
            <Text style={s.empty}>No listing fits yet.</Text>
          ) : (
            data.listings.map((m) => (
              <View key={m.item.id} style={s.match}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push({ pathname: '/property/[id]', params: { id: m.item.id } })}>
                  <Text style={s.title} numberOfLines={1}>{m.item.code} · {m.item.title}</Text>
                  <Text style={s.meta}>{[m.item.location, cr(m.item.value_cr), m.item.status].filter(Boolean).join(' · ')}</Text>
                  <Reasons m={m} />
                </TouchableOpacity>
                {m.shown ? (
                  <Badge label="On list" tone="verified" />
                ) : (
                  <TouchableOpacity style={s.pill} onPress={() => shortlist(m.item)}>
                    <Text style={s.pillText}>+ Shortlist</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </>
      ) : null}
      <Sub>{selling ? 'Buyers looking for this' : 'Sellers with something similar'}</Sub>
      {data.leads.length === 0 ? (
        <Text style={s.empty}>{selling ? 'No open buyer lead fits yet.' : 'No open seller lead fits yet.'}</Text>
      ) : (
        data.leads.map((m) => (
          <View key={m.item.id} style={s.match}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push({ pathname: '/lead/[id]', params: { id: m.item.id } })}>
              <Text style={s.title}>{m.item.name}</Text>
              <Text style={s.meta}>{[m.item.intent, TYPE_LABEL[m.item.property_type ?? ''], m.item.locations, budget(m.item.budget_min_cr, m.item.budget_max_cr), stageLabel(m.item.stage)].filter(Boolean).join(' · ')}</Text>
              <Reasons m={m} />
            </TouchableOpacity>
            <TouchableOpacity style={s.pill} onPress={() => onDealWith(m.item)}>
              <Text style={s.pillText}>Deal →</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  )
}

/** For a listing: who it has been shown to, and open buyers it suits. */
export function ListingBuyers({ propertyId }: { propertyId: string }) {
  const api = useApi()
  const [matches, setMatches] = useState<MatchItem<LeadLite>[] | null>(null)
  const [shown, setShown] = useState<Shown[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    Promise.all([
      api.get<{ leads: MatchItem<LeadLite>[] }>(`/api/matches?property_id=${propertyId}`),
      api.get<{ data: Shown[] }>(`/api/lead-listings?property_id=${propertyId}`),
      api.get<{ data: Lead[] }>('/api/leads'),
    ])
      .then(([m, sh, l]) => {
        setMatches(m.leads)
        setShown(sh.data)
        setNames(Object.fromEntries(l.data.map((x) => [x.id, x.name])))
      })
      .catch((e) => setError(e.message))
  }, [api, propertyId])
  useEffect(load, [load])

  async function shortlist(l: LeadLite) {
    try {
      await api.post('/api/lead-listings', { lead_id: l.id, property_id: propertyId })
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (error) return <Text style={s.error}>{error}</Text>
  if (!matches) return <ActivityIndicator color={colors.navy} />
  const fresh = matches.filter((m) => !m.shown)
  return (
    <View>
      <Sub>Shown to</Sub>
      {shown.length === 0 ? (
        <Text style={s.empty}>Not shown to anyone yet.</Text>
      ) : (
        shown.map((x) => (
          <TouchableOpacity key={x.id} style={s.row} onPress={() => router.push({ pathname: '/lead/[id]', params: { id: x.lead_id } })}>
            <View style={s.rowHead}>
              <Text style={s.title}>{names[x.lead_id] ?? 'Lead'}</Text>
              <Badge label={x.status} tone={x.status.toLowerCase()} />
            </View>
            <Text style={s.meta}>{[x.feedback ? `“${x.feedback}”` : '', timeAgo(x.updated_at ?? x.created_at)].filter(Boolean).join(' · ')}</Text>
          </TouchableOpacity>
        ))
      )}
      <Sub>Buyers it could suit</Sub>
      {fresh.length === 0 ? (
        <Text style={s.empty}>No other open buyer lead fits.</Text>
      ) : (
        fresh.map((m) => (
          <View key={m.item.id} style={s.match}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push({ pathname: '/lead/[id]', params: { id: m.item.id } })}>
              <Text style={s.title}>{m.item.name}</Text>
              <Text style={s.meta}>{[TYPE_LABEL[m.item.property_type ?? ''], m.item.locations, budget(m.item.budget_min_cr, m.item.budget_max_cr)].filter(Boolean).join(' · ')}</Text>
              <Reasons m={m} />
            </TouchableOpacity>
            <TouchableOpacity style={s.pill} onPress={() => shortlist(m.item)}>
              <Text style={s.pillText}>+ Shortlist</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  )
}

/* ─── Convert to a deal ──────────────────────────────────── */

export function ConvertPanel({ lead, preset, onCancel }: { lead: Lead; preset?: LeadLite | null; onCancel: () => void }) {
  const api = useApi()
  const selling = isSelling(lead.intent)
  const [shown, setShown] = useState<Shown[]>([])
  const [listing, setListing] = useState('')
  const [other, setOther] = useState<{ kind: 'lead' | 'contact'; id: string; name: string } | null>(preset ? { kind: 'lead', id: preset.id, name: preset.name } : null)
  const [picking, setPicking] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (preset) setOther({ kind: 'lead', id: preset.id, name: preset.name })
  }, [preset])
  useEffect(() => {
    api
      .get<{ data: Shown[] }>(`/api/lead-listings?lead_id=${lead.id}`)
      .then((r) => {
        setShown(r.data)
        const best = r.data.find((x) => x.status === 'Offer made') ?? r.data.find((x) => x.status === 'Interested')
        if (best) setListing(best.property_id)
      })
      .catch(() => {})
  }, [api, lead.id])
  const options = useMemo(() => shown.filter((x) => x.status !== 'Not interested'), [shown])

  async function go() {
    setBusy(true)
    setError(null)
    try {
      const r = await api.post<{ id?: string }>(`/api/leads/${lead.id}/convert`, {
        property_id: listing || undefined,
        counterpart_lead_id: other?.kind === 'lead' ? other.id : undefined,
        counterpart_contact_id: other?.kind === 'contact' ? other.id : undefined,
        deal_value_cr: value.trim() ? Number(value) : undefined,
      })
      if (r.id) router.replace({ pathname: '/transaction/[id]', params: { id: r.id } })
      else router.back()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <View>
      <Text style={s.meta}>
        Opens a deal with {lead.name} as the {selling ? 'seller' : 'buyer'}. The lead is marked Converted and links to it.
      </Text>
      <Sub>Listing</Sub>
      <View style={s.chips}>
        <TouchableOpacity style={[s.chip, !listing && s.chipOn]} onPress={() => setListing('')}>
          <Text style={[s.chipText, !listing && { color: colors.white }]}>Off-market</Text>
        </TouchableOpacity>
        {options.map((o) => (
          <TouchableOpacity key={o.id} style={[s.chip, listing === o.property_id && s.chipOn]} onPress={() => setListing(o.property_id)}>
            <Text style={[s.chipText, listing === o.property_id && { color: colors.white }]} numberOfLines={1}>
              {o.property_label.split(' · ')[0]} · {o.status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Sub>{selling ? 'Buyer' : 'Seller'} (optional)</Sub>
      {other ? (
        <View style={s.picked}>
          <Ionicons name="person" size={15} color={colors.navy} />
          <Text style={[s.title, { flex: 1 }]}>{other.name}</Text>
          <TouchableOpacity onPress={() => setOther(null)}>
            <Text style={s.pillText}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Button label="Pick from contacts" tone="ghost" onPress={() => setPicking(true)} />
      )}
      <Sub>Deal value (₹ crore)</Sub>
      <TextInput style={s.input} value={value} onChangeText={setValue} placeholder="Blank = the listing price" placeholderTextColor={colors.muted} keyboardType="numeric" />
      {error ? <Text style={s.error}>{error}</Text> : null}
      <View style={s.btnRow}>
        <View style={{ flex: 1 }}>
          <Button label="Cancel" tone="ghost" onPress={onCancel} />
        </View>
        <View style={{ flex: 1.4 }}>
          <Button label="Create the deal" onPress={go} busy={busy} />
        </View>
      </View>
      <ContactPickerSheet
        visible={picking}
        onClose={() => setPicking(false)}
        defaultRole={selling ? 'Buyer' : 'Seller'}
        title={selling ? 'Who is buying?' : 'Who is selling?'}
        onPick={(c: Contact) => setOther({ kind: 'contact', id: c.id, name: c.name })}
      />
    </View>
  )
}

/* ─── Tasks on a record ──────────────────────────────────── */

export function RelatedTasks({ entityType, entityId, entityLabel, suggest }: { entityType: string; entityId: string; entityLabel: string; suggest?: string }) {
  const api = useApi()
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    api
      .get<{ data: Task[]; source: string }>('/api/tasks')
      .then((r) => setTasks((r.source === 'live' ? r.data : []).filter((t) => t.entity_type === entityType && t.entity_id === entityId)))
      .catch(() => setTasks([]))
  }, [api, entityType, entityId])
  useEffect(load, [load])

  async function add() {
    if (!title.trim()) return
    setBusy(true)
    setError(null)
    try {
      await api.post('/api/tasks', { title: title.trim(), due_at: due || undefined, entity_type: entityType, entity_id: entityId, entity_label: entityLabel })
      setTitle('')
      setDue('')
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function toggle(t: Task) {
    const status = t.status === 'Open' ? 'Done' : 'Open'
    setTasks((p) => p?.map((x) => (x.id === t.id ? { ...x, status } : x)) ?? null)
    await api.patch(`/api/tasks/${t.id}`, { status }).catch((e) => setError(e.message))
  }

  const list = [...(tasks ?? []).filter((t) => t.status === 'Open'), ...(tasks ?? []).filter((t) => t.status === 'Done').slice(0, 3)]
  return (
    <View>
      {tasks === null ? (
        <ActivityIndicator color={colors.navy} />
      ) : list.length === 0 ? (
        <Text style={s.empty}>No follow-ups yet.</Text>
      ) : (
        list.map((t) => {
          const late = t.status === 'Open' && t.due_at && new Date(t.due_at).getTime() < Date.now()
          return (
            <TouchableOpacity key={t.id} style={s.task} onPress={() => toggle(t)}>
              <View style={[s.box, t.status === 'Done' && s.boxOn]}>{t.status === 'Done' ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}</View>
              <View style={{ flex: 1 }}>
                <Text style={[s.title, t.status === 'Done' && { textDecorationLine: 'line-through', color: colors.muted }]}>{t.title}</Text>
                <Text style={[s.meta, late ? { color: colors.flagged, fontWeight: '700' } : null]}>{t.due_at ? `${late ? 'Overdue · ' : ''}${whenShort(t.due_at)}` : 'No due date'}</Text>
              </View>
            </TouchableOpacity>
          )
        })
      )}
      {error ? <Text style={s.error}>{error}</Text> : null}
      <TextInput style={[s.input, { marginTop: space.sm }]} value={title} onChangeText={setTitle} placeholder={suggest ?? 'Next step'} placeholderTextColor={colors.muted} />
      {title.trim() ? (
        <>
          <WhenField label="Due" value={due} onChange={setDue} />
          <Button label="Add follow-up" onPress={add} busy={busy} />
        </>
      ) : null}
    </View>
  )
}

/* ─── Files picked before the record exists ──────────────── */

/** Files and photos chosen on a "new" form. The screen uploads them
    with uploadDocument() right after the record is saved. */
export function PendingFiles({
  files,
  onChange,
  entityType,
  category,
  onCategory,
}: {
  files: PickedFile[]
  onChange: (f: PickedFile[]) => void
  entityType: DocEntity
  category: string
  onCategory: (c: string) => void
}) {
  const cats = CATEGORIES[entityType]
  return (
    <View>
      {cats.length > 1 ? (
        <View style={s.chips}>
          {cats.map((c) => (
            <TouchableOpacity key={c} style={[s.chip, category === c && s.chipGold]} onPress={() => onCategory(c)}>
              <Text style={[s.chipText, category === c && { color: colors.goldDeep }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      {files.map((f, i) => (
        <View key={`${f.uri}${i}`} style={s.pending}>
          <Ionicons name="attach" size={16} color={colors.navy} />
          <Text style={s.pendingName} numberOfLines={1}>{f.name}</Text>
          <TouchableOpacity hitSlop={10} onPress={() => onChange(files.filter((_, j) => j !== i))}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>
      ))}
      <View style={s.btnRow}>
        <TouchableOpacity style={s.attach} onPress={async () => onChange([...files, ...(await pickFiles())])}>
          <Ionicons name="attach" size={17} color={colors.navy} />
          <Text style={s.attachText}>Attach file</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.attach} onPress={async () => onChange([...files, ...(await takePhoto())])}>
          <Ionicons name="camera-outline" size={17} color={colors.navy} />
          <Text style={s.attachText}>Photo</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.hint}>Uploaded as “{category}” when you save.</Text>
    </View>
  )
}

const s = StyleSheet.create({
  sub: { fontSize: text['2xs'], fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.muted, marginTop: space.md, marginBottom: 6 },
  error: { fontSize: text.sm, color: colors.flagged, marginVertical: 6 },
  empty: { fontSize: text.sm, color: colors.muted, paddingVertical: 6 },
  hint: { fontSize: text.xs, color: colors.pending, marginVertical: 6 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: text.base, fontWeight: '700', color: colors.navy, flexShrink: 1 },
  meta: { fontSize: text.xs, color: colors.muted, marginTop: 2 },
  feedback: { fontSize: text.sm, color: colors.ink2, fontStyle: 'italic', marginTop: 6, backgroundColor: colors.cream, borderRadius: radius.sm, padding: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, maxWidth: '100%' },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipGold: { backgroundColor: colors.goldTint, borderColor: colors.gold },
  chipText: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.base, padding: 12, fontSize: text.base, backgroundColor: colors.white, color: colors.ink, marginBottom: 8 },
  btnRow: { flexDirection: 'row', gap: 8 },
  match: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  reason: { borderRadius: 100, paddingHorizontal: 7, paddingVertical: 2 },
  reasonText: { fontSize: 10.5, fontWeight: '700' },
  pill: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 100, backgroundColor: colors.navyTint },
  pillText: { fontSize: text.xs, fontWeight: '800', color: colors.navy },
  picked: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: radius.base, backgroundColor: colors.navyTint, marginBottom: 8 },
  task: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.navy500, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  boxOn: { backgroundColor: colors.navy500 },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.navyTint, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6 },
  pendingName: { flex: 1, fontSize: text.sm, color: colors.navy, fontWeight: '600' },
  attach: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed' },
  attachText: { fontSize: text.sm, fontWeight: '700', color: colors.navy },
})
