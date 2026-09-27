import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Linking, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ApiError, useApi } from '@/lib/api'
import { CONTACT_ROLES, telUrl, waUrl } from '@/lib/leads'
import { AGENT_LINK_ROLES, isAgent } from '@/lib/agents'
import { colors, radius, space, text } from '@/lib/theme'
import type { Contact } from '@/lib/types'
import { EmailButton } from './google'

/* ─── Call · WhatsApp · Email ────────────────────────────── */

export function ContactActions({
  name,
  phone,
  email,
  entity,
  greeting,
}: {
  name: string
  phone?: string | null
  email?: string | null
  entity?: { entity_type: string; entity_id: string; entity_label: string }
  greeting?: string
}) {
  const first = name.split(' ')[0]
  if (!phone && !email) return null
  return (
    <View style={s.actions}>
      {phone ? (
        <>
          <ActionBtn icon="call" label="Call" onPress={() => Linking.openURL(telUrl(phone))} />
          <ActionBtn icon="logo-whatsapp" label="WhatsApp" onPress={() => Linking.openURL(waUrl(phone, greeting ?? `Hello ${first}, this is Bhumi Estates.`))} />
        </>
      ) : null}
      {email ? (
        <View style={{ flex: 1 }}>
          <EmailButton
            compact
            draft={{
              to: email,
              subject: 'Bhumi Estates',
              body: `Dear ${first},\n\n\n\nWarm regards,`,
              entity_type: entity?.entity_type ?? 'general',
              entity_id: entity?.entity_id ?? '',
              entity_label: entity?.entity_label ?? name,
            }}
          />
        </View>
      ) : null}
    </View>
  )
}

export function ActionBtn({ icon, label, onPress, tone }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; tone?: 'primary' }) {
  return (
    <TouchableOpacity style={[s.action, tone === 'primary' && s.actionPrimary]} onPress={onPress}>
      <Ionicons name={icon} size={16} color={tone === 'primary' ? colors.white : colors.navy} />
      <Text style={[s.actionText, tone === 'primary' && { color: colors.white }]}>{label}</Text>
    </TouchableOpacity>
  )
}

/* ─── Picking (or adding) a contact ─────────────────────── */

function NewContact({ initial, defaultRole, agent, onSaved, onCancel }: { initial: string; defaultRole?: string; agent?: boolean; onSaved: (c: Contact) => void; onCancel: () => void }) {
  const api = useApi()
  const phoneLike = /^[\d+\s-]{6,}$/.test(initial)
  const [name, setName] = useState(phoneLike ? '' : initial)
  const [phone, setPhone] = useState(phoneLike ? initial : '')
  const [email, setEmail] = useState('')
  const [roles, setRoles] = useState<string[]>(agent ? ['Agent'] : defaultRole ? [defaultRole] : [])
  const [agency, setAgency] = useState('')
  const [areas, setAreas] = useState('')
  const [share, setShare] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dup, setDup] = useState<Contact | null>(null)

  async function save(force = false) {
    if (!name.trim()) return setError('A name is needed')
    setBusy(true)
    setError(null)
    try {
      const profile = agent ? { agency: agency.trim(), operating_areas: areas.trim(), default_share_pct: share.trim() ? Number(share) : null } : {}
      const r = await api.post<{ id: string }>('/api/contacts', { name: name.trim(), phone: phone.trim(), email: email.trim(), roles, force, ...profile })
      onSaved({ id: r.id, name: name.trim(), phone: phone.trim(), email: email.trim(), roles, created_at: new Date().toISOString(), ...profile })
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.body.duplicate) setDup(e.body.duplicate as Contact)
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <View>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.muted} autoFocus={!phoneLike} />
      <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor={colors.muted} keyboardType="phone-pad" />
      <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="Email (optional)" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" />
      {agent ? (
        <>
          <TextInput style={s.input} value={agency} onChangeText={setAgency} placeholder="Agency / firm" placeholderTextColor={colors.muted} />
          <TextInput style={s.input} value={areas} onChangeText={setAreas} placeholder="Areas they cover, e.g. Devanahalli, Hoskote" placeholderTextColor={colors.muted} />
          <TextInput style={s.input} value={share} onChangeText={setShare} placeholder="Usual share, % of our commission" placeholderTextColor={colors.muted} keyboardType="decimal-pad" />
        </>
      ) : null}
      <View style={[s.chips, agent && { display: 'none' }]}>
        {CONTACT_ROLES.map((r) => (
          <TouchableOpacity key={r} style={[s.chip, roles.includes(r) && s.chipOn]} onPress={() => setRoles((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]))}>
            <Text style={[s.chipText, roles.includes(r) && { color: colors.white }]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={[s.error, dup && { color: colors.pending }]}>{error}</Text> : null}
      <View style={s.actions}>
        {dup ? (
          <>
            <ActionBtn icon="person" label={`Use ${dup.name.split(' ')[0]}`} tone="primary" onPress={() => onSaved(dup)} />
            <ActionBtn icon="person-add-outline" label="New person" onPress={() => save(true)} />
          </>
        ) : (
          <>
            <TouchableOpacity style={[s.action, s.actionPrimary]} onPress={() => save()} disabled={busy}>
              {busy ? <ActivityIndicator color={colors.white} /> : <Text style={[s.actionText, { color: colors.white }]}>Save contact</Text>}
            </TouchableOpacity>
            <ActionBtn icon="close" label="Cancel" onPress={onCancel} />
          </>
        )}
      </View>
    </View>
  )
}

/** A bottom sheet: search the contact book, or add someone new. */
export function ContactPickerSheet({
  visible,
  onClose,
  onPick,
  title = 'Pick a contact',
  defaultRole,
  exclude = [],
  agentsOnly = false,
}: {
  visible: boolean
  onClose: () => void
  onPick: (c: Contact) => void
  title?: string
  defaultRole?: string
  exclude?: string[]
  /** Only agents; search covers agency and areas; "add" makes an agent. */
  agentsOnly?: boolean
}) {
  const api = useApi()
  const insets = useSafeAreaInsets()
  const [all, setAll] = useState<Contact[] | null>(null)
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!visible) return
    setAdding(false)
    api
      .get<{ data: Contact[] }>('/api/contacts')
      .then((r) => setAll(r.data))
      .catch(() => setAll([]))
  }, [visible, api])

  const list = useMemo(() => {
    const n = q.trim().toLowerCase()
    const d = n.replace(/\D/g, '')
    return (all ?? [])
      .filter((c) => !exclude.includes(c.id) && (!agentsOnly || isAgent(c)))
      .filter((c) => !n || `${c.name} ${c.company ?? ''} ${c.email} ${c.agency ?? ''} ${c.operating_areas ?? ''}`.toLowerCase().includes(n) || (d.length >= 3 && c.phone.replace(/\D/g, '').includes(d)))
      .slice(0, 40)
  }, [all, q, exclude, agentsOnly])

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: insets.bottom + space.md }]}>
        <View style={s.grab} />
        <Text style={s.sheetTitle}>{adding ? (agentsOnly ? 'New agent' : 'New contact') : title}</Text>
        {adding ? (
          <NewContact
            initial={q.trim()}
            defaultRole={defaultRole}
            agent={agentsOnly}
            onCancel={() => setAdding(false)}
            onSaved={(c) => {
              onPick(c)
              onClose()
            }}
          />
        ) : (
          <>
            <View style={s.search}>
              <Ionicons name="search" size={16} color={colors.muted} />
              <TextInput style={s.searchInput} value={q} onChangeText={setQ} placeholder={agentsOnly ? 'Name, agency, phone or area' : 'Name, phone or company'} placeholderTextColor={colors.muted} />
            </View>
            <TouchableOpacity style={s.addRow} onPress={() => setAdding(true)}>
              <Ionicons name="person-add" size={17} color={colors.goldDeep} />
              <Text style={s.addText}>{q.trim() ? `Add “${q.trim()}” as a new ${agentsOnly ? 'agent' : 'contact'}` : `Add a new ${agentsOnly ? 'agent' : 'contact'}`}</Text>
            </TouchableOpacity>
            {all === null ? (
              <ActivityIndicator color={colors.navy} style={{ marginVertical: space.xl }} />
            ) : (
              <FlatList
                data={list}
                keyExtractor={(c) => c.id}
                style={{ maxHeight: 360 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={<Text style={s.empty}>Nobody matches.</Text>}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.option}
                    onPress={() => {
                      onPick(item)
                      onClose()
                    }}
                  >
                    <Ionicons name="person-circle-outline" size={26} color={colors.muted} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.optLabel} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.optSub} numberOfLines={1}>{(agentsOnly ? [item.agency, item.phone, item.operating_areas] : [item.roles?.join(', '), item.phone, item.company]).filter(Boolean).join(' · ')}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}
      </View>
    </Modal>
  )
}

/* ─── People on a record ─────────────────────────────────── */

interface LinkRow {
  id: string
  role: string
  contact: { id: string; name: string; phone?: string; company?: string; roles?: string[] } | null
}

/** Contacts tagged on a record with a role: the landowner on a
    listing, the lawyer on a deal, who a task or note is about. */
export function PeoplePanel({
  entityType,
  entityId,
  entityLabel,
  roles = ['Landowner', 'Buyer', 'Seller', 'Agent', 'Lawyer', 'Other'],
  emptyText = 'Nobody tagged yet.',
  hideAgents = false,
}: {
  entityType: 'lead' | 'transaction' | 'property' | 'task' | 'note' | 'meeting' | 'verification'
  entityId: string
  entityLabel: string
  roles?: string[]
  emptyText?: string
  /** Agents are shown by AgentsPanel on this record instead. */
  hideAgents?: boolean
}) {
  const api = useApi()
  if (hideAgents) roles = roles.filter((r) => r !== 'Agent')
  const [rows, setRows] = useState<LinkRow[] | null>(null)
  const [ready, setReady] = useState(true)
  const [role, setRole] = useState(roles[0])
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api
      .get<{ data: LinkRow[]; ready: boolean }>(`/api/contact-links?entity_type=${entityType}&entity_id=${encodeURIComponent(entityId)}`)
      .then((r) => {
        setRows(hideAgents ? r.data.filter((x) => !isAgent(x.contact) && !(AGENT_LINK_ROLES as readonly string[]).includes(x.role)) : r.data)
        setReady(r.ready)
      })
      .catch(() => setRows([]))
  }, [api, entityType, entityId, hideAgents])
  useEffect(load, [load])

  async function add(c: Contact) {
    setError(null)
    try {
      await api.post('/api/contact-links', { contact_id: c.id, entity_type: entityType, entity_id: entityId, entity_label: entityLabel, role })
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }
  async function unlink(r: LinkRow) {
    setRows((p) => p?.filter((x) => x.id !== r.id) ?? null)
    await api.del(`/api/contact-links?id=${r.id}`).catch((e) => setError(e.message))
  }

  if (!ready) return <Text style={s.empty}>Contacts arrive with database migration 015.</Text>
  return (
    <View>
      {rows === null ? (
        <ActivityIndicator color={colors.navy} />
      ) : rows.length === 0 ? (
        <Text style={s.emptyLeft}>{emptyText}</Text>
      ) : (
        rows.map((r) =>
          r.contact ? (
            <View key={r.id} style={s.person}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push({ pathname: '/contact/[id]', params: { id: r.contact!.id } })}>
                <Text style={s.optLabel}>{r.contact.name}</Text>
                <Text style={s.optSub}>{[r.role, r.contact.phone, r.contact.company].filter(Boolean).join(' · ')}</Text>
              </TouchableOpacity>
              {r.contact.phone ? (
                <TouchableOpacity style={s.iconBtn} onPress={() => Linking.openURL(telUrl(r.contact!.phone))}>
                  <Ionicons name="call" size={15} color={colors.navy} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={s.iconBtn} onPress={() => unlink(r)}>
                <Ionicons name="close" size={15} color={colors.muted} />
              </TouchableOpacity>
            </View>
          ) : null
        )
      )}
      {error ? <Text style={s.error}>{error}</Text> : null}
      <View style={[s.chips, { marginTop: space.sm }]}>
        {roles.map((r) => (
          <TouchableOpacity key={r} style={[s.chip, s.chipSm, role === r && s.chipGold]} onPress={() => setRole(r)}>
            <Text style={[s.chipText, role === r && { color: colors.goldDeep }]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={s.dashed} onPress={() => setPicking(true)}>
        <Ionicons name="person-add-outline" size={16} color={colors.navy} />
        <Text style={s.dashedText}>Tag a contact as {role}</Text>
      </TouchableOpacity>
      <ContactPickerSheet visible={picking} onClose={() => setPicking(false)} onPick={add} defaultRole={role} title={`Tag a ${role.toLowerCase()}`} exclude={(rows ?? []).map((r) => r.contact?.id ?? '')} />
    </View>
  )
}

const s = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  action: { flex: 1, minWidth: 96, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: radius.base, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  actionPrimary: { backgroundColor: colors.navy, borderColor: colors.navy },
  actionText: { fontSize: text.sm, fontWeight: '700', color: colors.navy },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.base, padding: 12, fontSize: text.base, backgroundColor: colors.white, color: colors.ink, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  chipSm: { paddingHorizontal: 9, paddingVertical: 4 },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipGold: { backgroundColor: colors.goldTint, borderColor: colors.gold },
  chipText: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
  error: { fontSize: text.sm, color: colors.flagged, marginBottom: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(10,20,16,0.45)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: space.lg, paddingTop: 10 },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: space.md },
  sheetTitle: { fontSize: text.lg, fontWeight: '800', color: colors.navy, marginBottom: space.sm },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: radius.base, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: text.base, color: colors.ink },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  addText: { fontSize: text.base, fontWeight: '700', color: colors.goldDeep },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  optLabel: { fontSize: text.base, fontWeight: '700', color: colors.ink },
  optSub: { fontSize: text.xs, color: colors.muted, marginTop: 2 },
  empty: { fontSize: text.sm, color: colors.muted, textAlign: 'center', paddingVertical: space.lg },
  emptyLeft: { fontSize: text.sm, color: colors.muted, paddingVertical: space.sm },
  person: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  dashed: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: radius.base, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line },
  dashedText: { fontSize: text.sm, fontWeight: '700', color: colors.navy },
})
