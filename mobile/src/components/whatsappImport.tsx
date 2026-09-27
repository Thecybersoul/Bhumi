import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi } from '@/lib/api'
import { colors, radius, space, text } from '@/lib/theme'

/* ═══════════════════════════════════════════════════════════
   The free WhatsApp import, as a card in the assistant.

   Given a post (pasted, shared from WhatsApp, or dictated), the server
   reads it without AI (/api/whatsapp → lib/whatsapp/parse.ts). This
   card shows what it found as editable fields, warns about listings
   that look like one already on file, shows who sent it, and saves
   everything in one tap: Draft listings (or a lead), the contact,
   the link between them, the photos, and the listing's picture.
   A post with nothing property-like in it can be kept as a note or a
   task instead.
   ═══════════════════════════════════════════════════════════ */

type PropertyType = 'land-parcels' | 'large-land-parcels' | 'commercial' | 'residential' | 'villas' | 'warehouses'
type Zone = 'North' | 'East' | 'South' | 'West'

interface ListingDraft {
  kind: 'listing'
  title: string
  property_type: PropertyType
  location: string
  zone?: Zone
  extent_acres?: number
  price_per_acre_cr?: number
  price_total_cr?: number
  price_per_sqft?: number
  plot_area_sqft?: number
  built_up_sqft?: number
  description: string
  found: string[]
  code?: string
  [k: string]: unknown
}
interface LeadDraft {
  kind: 'lead'
  intent: 'Buy' | 'Lease' | 'Invest'
  title: string
  areas?: string
  size?: string
  budget?: string
  notes: string
  found: string[]
  [k: string]: unknown
}
type Draft = (ListingDraft | LeadDraft) & { include?: boolean }
interface Contact {
  id?: string
  name?: string
  phone?: string
  role: 'Agent' | 'Landowner' | 'Seller' | 'Buyer'
  agency?: string
}
interface Parsed {
  result: { drafts: Draft[]; contact: Contact | null; text: string; empty: boolean }
  codes: string[]
  duplicates: { id: string; code: string; title: string }[][]
  existing_contact: { id: string; name: string } | null
}
interface Saved {
  created: { type: 'listing' | 'lead' | 'contact'; id: string; label: string }[]
  problems: string[]
}
export interface Photo {
  id: string
  name: string
  mime: string
}

const TYPES: [PropertyType, string][] = [
  ['land-parcels', 'Land'],
  ['large-land-parcels', 'Large land'],
  ['residential', 'Residential'],
  ['villas', 'Villa'],
  ['commercial', 'Commercial'],
  ['warehouses', 'Warehouse'],
]
const ZONES: Zone[] = ['North', 'East', 'South', 'West']
const ROLES: Contact['role'][] = ['Agent', 'Landowner', 'Seller', 'Buyer']

const str = (n?: number) => (n === undefined || n === null || Number.isNaN(n) ? '' : String(n))
const numOrUndef = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(/,/g, '')))

export function WhatsAppImport({ source, photos = [], onDone }: { source: string; photos?: Photo[]; onDone?: (summary: string) => void }) {
  const api = useApi()
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [contact, setContact] = useState<Contact | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState<Saved | null>(null)
  const [noteSaved, setNoteSaved] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    api
      .post<Parsed>('/api/whatsapp', { action: 'parse', text: source })
      .then((p) => {
        if (!live) return
        setParsed(p)
        setDrafts(p.result.drafts.map((d, i) => ({ ...d, include: true, ...(d.kind === 'listing' ? { code: p.codes[i] } : {}) })))
        setContact(p.result.contact ? { ...p.result.contact, ...(p.existing_contact ? { id: p.existing_contact.id, name: p.result.contact.name || p.existing_contact.name } : {}) } : null)
      })
      .catch((e) => live && setError((e as Error).message))
    return () => {
      live = false
    }
  }, [api, source])

  const edit = (i: number, patch: Partial<ListingDraft> | Partial<LeadDraft> | { include: boolean }) =>
    setDrafts((all) => all.map((d, j) => (j === i ? ({ ...d, ...patch } as Draft) : d)))

  async function save() {
    const chosen = drafts.filter((d) => d.include !== false)
    if (!chosen.length) return
    setBusy(true)
    setError(null)
    try {
      const r = await api.post<Saved>('/api/whatsapp', { action: 'save', text: parsed?.result.text ?? source, drafts: chosen, contact, photos })
      setSaved(r)
      const made = r.created.filter((c) => c.type !== 'contact')
      onDone?.(made.length ? `Saved ${made.map((c) => c.label).join(', ')}` : 'Nothing was saved')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function keepAs(kind: 'note' | 'task') {
    setBusy(true)
    setError(null)
    try {
      const body = parsed?.result.text || source
      if (kind === 'note') await api.post('/api/notes', { body, entity_type: 'general' })
      else await api.post('/api/tasks', { title: body.split('\n')[0].slice(0, 140), notes: body, entity_type: 'general' })
      setNoteSaved(kind === 'note' ? 'Saved as a note.' : 'Saved as a task.')
      onDone?.(kind === 'note' ? 'Saved as a note' : 'Saved as a task')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (error && !parsed) return <Text style={s.error}>{error}</Text>
  if (!parsed) {
    return (
      <View style={s.reading}>
        <ActivityIndicator size="small" color={colors.navy} />
        <Text style={s.muted}>Reading the post…</Text>
      </View>
    )
  }

  if (saved) {
    return (
      <View style={s.card}>
        <View style={s.doneHead}>
          <Ionicons name="checkmark-circle" size={20} color={colors.verified} />
          <Text style={s.doneTitle}>{saved.created.some((c) => c.type !== 'contact') ? 'Saved' : 'Not saved'}</Text>
        </View>
        {saved.created.map((c) => (
          <TouchableOpacity
            key={`${c.type}-${c.id}`}
            style={s.link}
            onPress={() =>
              router.push({ pathname: (c.type === 'listing' ? '/property/[id]' : c.type === 'lead' ? '/lead/[id]' : '/contact/[id]') as never, params: { id: c.id } } as never)
            }
          >
            <Ionicons name={c.type === 'listing' ? 'map-outline' : c.type === 'lead' ? 'person-add-outline' : 'person-outline'} size={15} color={colors.navy} />
            <Text style={s.linkText} numberOfLines={1}>
              {c.type === 'listing' ? 'Draft listing' : c.type === 'lead' ? 'Lead' : 'Contact'}: {c.label}
            </Text>
            <Ionicons name="chevron-forward" size={15} color={colors.muted} />
          </TouchableOpacity>
        ))}
        {saved.problems.map((p) => (
          <Text key={p} style={s.error}>
            {p}
          </Text>
        ))}
        {saved.created.some((c) => c.type === 'listing') ? <Text style={s.muted}>Drafts stay off the website until someone sets them Live.</Text> : null}
      </View>
    )
  }

  if (parsed.result.empty) {
    return (
      <View style={s.card}>
        <Text style={s.cardTitle}>No property details found</Text>
        <Text style={s.muted}>This doesn’t read like a property post or a requirement. Keep it anyway?</Text>
        {noteSaved ? (
          <Text style={[s.muted, { color: colors.verified, fontWeight: '700' }]}>{noteSaved}</Text>
        ) : (
          <View style={s.row}>
            <TouchableOpacity style={s.ghostBtn} onPress={() => keepAs('note')} disabled={busy}>
              <Ionicons name="create-outline" size={15} color={colors.navy} />
              <Text style={s.ghostText}>Save as note</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={() => keepAs('task')} disabled={busy}>
              <Ionicons name="checkbox-outline" size={15} color={colors.navy} />
              <Text style={s.ghostText}>Make it a task</Text>
            </TouchableOpacity>
          </View>
        )}
        {error ? <Text style={s.error}>{error}</Text> : null}
      </View>
    )
  }

  const count = drafts.filter((d) => d.include !== false).length
  const listings = drafts.filter((d) => d.kind === 'listing' && d.include !== false).length
  const leads = count - listings

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>
        {drafts.length > 1 ? `${drafts.length} properties found` : drafts[0].kind === 'lead' ? 'A requirement: new lead' : 'A property: new draft listing'}
      </Text>
      <Text style={s.muted}>Check the details and correct anything, then save.</Text>

      {drafts.map((d, i) => (
        <View key={i} style={[s.draft, d.include === false && { opacity: 0.45 }]}>
          <View style={s.draftHead}>
            <Ionicons name={d.kind === 'listing' ? 'map' : 'person-add'} size={15} color={colors.navy} />
            <Text style={s.draftKind}>{d.kind === 'listing' ? `Listing ${String(d.code ?? '')}` : `Lead · ${d.intent}`}</Text>
            {drafts.length > 1 ? <Switch value={d.include !== false} onValueChange={(v) => edit(i, { include: v })} trackColor={{ true: colors.navy600, false: colors.line }} /> : null}
          </View>

          {d.found.length ? (
            <View style={s.chips}>
              {d.found.map((f) => (
                <View key={f} style={s.found}>
                  <Text style={s.foundText}>{f}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {d.kind === 'listing' && parsed.duplicates[i]?.length ? (
            <View style={s.warn}>
              <Ionicons name="alert-circle" size={15} color={colors.pending} />
              <View style={{ flex: 1 }}>
                <Text style={s.warnText}>Looks like a listing already on file:</Text>
                {parsed.duplicates[i].map((x) => (
                  <TouchableOpacity key={x.id} onPress={() => router.push({ pathname: '/property/[id]', params: { id: x.id } })}>
                    <Text style={[s.warnText, { textDecorationLine: 'underline' }]}>
                      {x.code} · {x.title}
                    </Text>
                  </TouchableOpacity>
                ))}
                {drafts.length === 1 ? <Text style={s.warnText}>Saving adds a separate draft.</Text> : null}
              </View>
            </View>
          ) : null}

          <Input label="Title" value={d.title} onChange={(v) => edit(i, { title: v })} />
          {d.kind === 'listing' ? (
            <>
              <Input label="Location" value={d.location} onChange={(v) => edit(i, { location: v })} placeholder="Village / area, taluk" />
              <Pills options={TYPES.map(([v, l]) => ({ v, l }))} value={d.property_type} onChange={(v) => edit(i, { property_type: v as PropertyType })} />
              <Pills options={ZONES.map((z) => ({ v: z, l: z }))} value={d.zone ?? ''} onChange={(v) => edit(i, { zone: v as Zone })} />
              <View style={s.grid}>
                <Input half label="Extent (acres)" value={str(d.extent_acres)} keyboard="numeric" onChange={(v) => edit(i, { extent_acres: numOrUndef(v) })} />
                <Input half label="₹ Cr per acre" value={str(d.price_per_acre_cr)} keyboard="numeric" onChange={(v) => edit(i, { price_per_acre_cr: numOrUndef(v) })} />
                <Input half label="Total ₹ Cr" value={str(d.price_total_cr)} keyboard="numeric" onChange={(v) => edit(i, { price_total_cr: numOrUndef(v) })} />
                <Input half label="₹ per sq ft" value={str(d.price_per_sqft)} keyboard="numeric" onChange={(v) => edit(i, { price_per_sqft: numOrUndef(v) })} />
                {d.plot_area_sqft !== undefined || d.built_up_sqft === undefined ? (
                  <Input half label="Plot (sq ft)" value={str(d.plot_area_sqft)} keyboard="numeric" onChange={(v) => edit(i, { plot_area_sqft: numOrUndef(v) })} />
                ) : null}
                {d.built_up_sqft !== undefined ? (
                  <Input half label="Built-up (sq ft)" value={str(d.built_up_sqft)} keyboard="numeric" onChange={(v) => edit(i, { built_up_sqft: numOrUndef(v) })} />
                ) : null}
                <Input half label="Listing code" value={String(d.code ?? '')} onChange={(v) => edit(i, { code: v.toUpperCase() })} />
              </View>
            </>
          ) : (
            <>
              <Input label="Areas" value={d.areas ?? ''} onChange={(v) => edit(i, { areas: v })} />
              <View style={s.grid}>
                <Input half label="Size" value={d.size ?? ''} onChange={(v) => edit(i, { size: v })} />
                <Input half label="Budget" value={d.budget ?? ''} onChange={(v) => edit(i, { budget: v })} />
              </View>
            </>
          )}
        </View>
      ))}

      <View style={s.person}>
        <Text style={s.sectionLabel}>{contact?.role === 'Buyer' ? 'Buyer' : 'Who sent it'}</Text>
        {contact?.id ? <Text style={s.muted}>Already in your contacts: they’ll be linked, not added again.</Text> : null}
        <View style={s.grid}>
          <Input half label="Name" value={contact?.name ?? ''} onChange={(v) => setContact((c) => ({ role: 'Seller', ...(c ?? {}), name: v }))} />
          <Input half label="Phone" value={contact?.phone ?? ''} keyboard="phone-pad" onChange={(v) => setContact((c) => ({ role: 'Seller', ...(c ?? {}), phone: v }))} />
        </View>
        <Pills options={ROLES.map((r) => ({ v: r, l: r }))} value={contact?.role ?? ''} onChange={(v) => setContact((c) => ({ ...(c ?? {}), role: v as Contact['role'] }))} />
        {contact?.role === 'Agent' ? <Input label="Agency" value={contact.agency ?? ''} onChange={(v) => setContact((c) => ({ ...(c as Contact), agency: v }))} /> : null}
      </View>

      {photos.length ? (
        <Text style={s.muted}>
          📷 {photos.length} photo{photos.length === 1 ? '' : 's'} will be filed on the {listings > 1 ? 'first ' : ''}listing{listings ? ', and the first one becomes its picture' : ''}.
        </Text>
      ) : null}
      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity style={[s.save, (!count || busy) && { opacity: 0.5 }]} onPress={save} disabled={!count || busy}>
        {busy ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Ionicons name="checkmark" size={18} color={colors.white} />
            <Text style={s.saveText}>
              {listings && leads ? `Save ${listings} listing${listings > 1 ? 's' : ''} and ${leads} lead${leads > 1 ? 's' : ''}` : listings ? `Save ${listings > 1 ? `${listings} draft listings` : 'draft listing'}` : `Save lead`}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  )
}

function Input({ label, value, onChange, keyboard, placeholder, half }: { label: string; value: string; onChange: (v: string) => void; keyboard?: 'numeric' | 'phone-pad'; placeholder?: string; half?: boolean }) {
  return (
    <View style={half ? s.half : { gap: 3 }}>
      <Text style={s.inputLabel}>{label}</Text>
      <TextInput style={s.input} value={value} onChangeText={onChange} keyboardType={keyboard === 'numeric' ? 'decimal-pad' : keyboard ?? 'default'} placeholder={placeholder} placeholderTextColor={colors.muted} />
    </View>
  )
}

function Pills({ options, value, onChange }: { options: { v: string; l: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.chips}>
      {options.map((o) => (
        <TouchableOpacity key={o.v} style={[s.pill, value === o.v && s.pillOn]} onPress={() => onChange(o.v)}>
          <Text style={[s.pillText, value === o.v && { color: colors.white }]}>{o.l}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  reading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  card: { backgroundColor: colors.white, borderRadius: radius.base, borderWidth: 1, borderColor: colors.line, padding: space.md, gap: 10 },
  cardTitle: { fontSize: text.md, fontWeight: '800', color: colors.ink },
  muted: { fontSize: text.sm, color: colors.muted, lineHeight: 19 },
  error: { fontSize: text.sm, color: colors.flagged, fontWeight: '600' },
  draft: { gap: 8, borderTopWidth: 1, borderTopColor: colors.line2, paddingTop: 10 },
  draftHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  draftKind: { flex: 1, fontSize: text.sm, fontWeight: '800', color: colors.navy },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  found: { backgroundColor: colors.verifiedBg, borderRadius: 100, paddingHorizontal: 9, paddingVertical: 4 },
  foundText: { fontSize: text.xs, fontWeight: '700', color: colors.verified },
  warn: { flexDirection: 'row', gap: 8, backgroundColor: colors.pendingBg, borderRadius: 10, padding: 10 },
  warnText: { fontSize: text.xs, fontWeight: '600', color: colors.pending, lineHeight: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  half: { flexBasis: '47%', flexGrow: 1, gap: 3 },
  inputLabel: { fontSize: text.xs, fontWeight: '700', color: colors.muted },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, fontSize: text.base, color: colors.ink, backgroundColor: colors.white },
  pill: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  pillOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  pillText: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
  person: { gap: 8, borderTopWidth: 1, borderTopColor: colors.line2, paddingTop: 10 },
  sectionLabel: { fontSize: text.sm, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 100, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 8 },
  ghostText: { fontSize: text.sm, fontWeight: '700', color: colors.navy },
  save: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.navy, borderRadius: 12, paddingVertical: 13, marginTop: 4 },
  saveText: { color: colors.white, fontSize: text.md, fontWeight: '800' },
  doneHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneTitle: { fontSize: text.md, fontWeight: '800', color: colors.verified },
  link: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, backgroundColor: colors.navyTint, paddingHorizontal: 10, paddingVertical: 10 },
  linkText: { flex: 1, fontSize: text.sm, fontWeight: '700', color: colors.navy },
})
