import { useState } from 'react'
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi } from '@/lib/api'
import { telUrl, waUrl } from '@/lib/leads'
import { openUrl } from '@/lib/links'
import { parsePhone } from '@/lib/phone'
import { ROLE_TYPES, type ProspectContact, type RoleType } from '@/lib/crm'
import { colors, radius, space, text } from '@/lib/theme'
import { Chips, TextField } from '@/components/form'

/* The numbers at a prospect. Call for any valid number; WhatsApp only for
   numbers that can be mobiles (not landlines or toll-free). A value that is
   not a single valid number gets no buttons and a note, never a bad link. */

type IconName = keyof typeof Ionicons.glyphMap

function Pill({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.pill} onPress={onPress} hitSlop={4} accessibilityLabel={label}>
      <Ionicons name={icon} size={14} color={colors.navy} />
      <Text style={s.pillText}>{label}</Text>
    </TouchableOpacity>
  )
}

export function PhoneActions({ phone, message }: { phone: string; message?: string }) {
  if (!phone.trim()) return null
  if (!parsePhone(phone)) return <Text style={s.fix}>Number needs fixing</Text>
  const tel = telUrl(phone)
  const wa = waUrl(phone, message)
  return (
    <>
      {tel ? <Pill icon="call-outline" label="Call" onPress={() => openUrl(tel)} /> : null}
      {wa ? <Pill icon="logo-whatsapp" label="WhatsApp" onPress={() => openUrl(wa)} /> : null}
    </>
  )
}

function Row({ c, message, onDelete }: { c: ProspectContact; message?: string; onDelete?: () => void }) {
  const ph = parsePhone(c.phone)
  return (
    <View style={s.row}>
      <Text style={s.name}>{c.name}</Text>
      {c.role || c.role_type !== 'Generic' ? <Text style={s.sub}>{[c.role, c.role_type !== 'Generic' ? c.role_type : ''].filter(Boolean).join(' · ')}</Text> : null}
      {c.phone ? <Text style={s.sub}>{ph?.display ?? c.phone}</Text> : null}
      <View style={s.actions}>
        <PhoneActions phone={c.phone} message={message} />
        {c.email ? <Pill icon="mail-outline" label="Email" onPress={() => Linking.openURL(`mailto:${c.email}`).catch(() => {})} /> : null}
        {onDelete ? <Pill icon="trash-outline" label="Remove" onPress={onDelete} /> : null}
      </View>
    </View>
  )
}

export function ContactRows({ contacts, message }: { contacts: ProspectContact[]; message?: string }) {
  if (contacts.length === 0) return null
  return (
    <View style={{ marginTop: 6 }}>
      <Text style={s.sub}>Also reach</Text>
      {contacts.map((c) => <Row key={c.id} c={c} message={message} />)}
    </View>
  )
}

const blank = { name: '', role: '', role_type: 'Generic' as RoleType, phone: '', email: '' }

export function ContactsPanel({ prospectId, contacts, message, onChanged, onError }: { prospectId: string; contacts: ProspectContact[]; message?: string; onChanged: () => void; onError: (m: string) => void }) {
  const api = useApi()
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState(blank)
  const [busy, setBusy] = useState(false)

  async function add() {
    if (!f.name.trim()) return onError('Give the person or line a name, e.g. "Land acquisition" or "Head office".')
    setBusy(true)
    try {
      await api.post('/api/crm/prospect-contacts', { ...f, prospect_id: prospectId })
      setF(blank)
      setAdding(false)
      onChanged()
    } catch (e) {
      onError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const remove = (c: ProspectContact) =>
    Alert.alert('Remove this contact?', c.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => api.del(`/api/crm/prospect-contacts?id=${c.id}`).then(onChanged).catch((e) => onError((e as Error).message)) },
    ])

  return (
    <View style={s.panel}>
      <Text style={s.title}>People and lines</Text>
      {contacts.length === 0 ? <Text style={s.sub}>Nobody published yet. Add a person or a line when you find one; nothing is guessed.</Text> : null}
      {contacts.map((c) => <Row key={c.id} c={c} message={message} onDelete={() => remove(c)} />)}
      {adding ? (
        <View style={{ marginTop: space.sm }}>
          <TextField label="Name or label" value={f.name} onChange={(v) => setF({ ...f, name: v })} placeholder="e.g. Land acquisition, Head office" />
          <TextField label="Role" value={f.role} onChange={(v) => setF({ ...f, role: v })} />
          <Chips label="Kind" options={ROLE_TYPES} value={f.role_type} onChange={(v) => setF({ ...f, role_type: v })} />
          <TextField label="Phone (one number)" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} keyboard="phone-pad" />
          <TextField label="Email (only if published)" value={f.email} onChange={(v) => setF({ ...f, email: v })} keyboard="email-address" />
          <View style={s.actions}>
            <Pill icon="checkmark" label={busy ? 'Adding…' : 'Add'} onPress={() => !busy && add()} />
            <Pill icon="close" label="Cancel" onPress={() => { setAdding(false); setF(blank) }} />
          </View>
        </View>
      ) : (
        <View style={s.actions}>
          <Pill icon="add" label="Add a person or line" onPress={() => setAdding(true)} />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  panel: { backgroundColor: colors.white, borderRadius: radius.base, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: space.md },
  title: { fontSize: text.sm, fontWeight: '800', color: colors.navy, marginBottom: 4 },
  row: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line2 },
  name: { fontSize: text.base, fontWeight: '700', color: colors.ink },
  sub: { fontSize: text.sm, color: colors.muted, marginTop: 2 },
  fix: { fontSize: text.sm, color: colors.flagged, fontWeight: '700', alignSelf: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  pillText: { fontSize: text.xs, fontWeight: '700', color: colors.navy },
})
