import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi } from '@/lib/api'
import {
  AGENT_LINK_ROLES,
  agentShareLakh,
  isAgent,
  lakh,
  ourCommissionLakh,
  PAYOUT_STATUSES,
  payoutTone,
  SHARE_TYPES,
  shareLabel,
  type DealMoney,
  type Involvement,
} from '@/lib/agents'
import { telUrl, waUrl } from '@/lib/leads'
import { colors, radius, space, text } from '@/lib/theme'
import type { Contact } from '@/lib/types'
import { Badge } from './ui'
import { ContactPickerSheet } from './contacts'

/* Agents on a record — the outside brokers working alongside Bhumi
   Estates on a listing, a deal or a lead: the part each plays, their
   share, and (on a deal) whether they've been paid. The app's twin of
   components/erp/agents.tsx on the web. */

type Entity = 'property' | 'transaction' | 'lead'
const DEFAULT_ROLE: Record<Entity, string> = { property: 'Listing agent', transaction: 'Buyer’s agent', lead: 'Referral' }
const isAgentRow = (r: Involvement) => isAgent(r.contact) || (AGENT_LINK_ROLES as readonly string[]).includes(r.role)

export function Stars({ n, onChange, size = 14 }: { n?: number | null; onChange?: (n: number | null) => void; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} disabled={!onChange} onPress={() => onChange?.(n === i ? null : i)} hitSlop={4}>
          <Ionicons name={n && i <= n ? 'star' : 'star-outline'} size={size} color={n && i <= n ? colors.gold : colors.line} />
        </TouchableOpacity>
      ))}
    </View>
  )
}

function Chip({ label, on, onPress, gold }: { label: string; on: boolean; onPress: () => void; gold?: boolean }) {
  return (
    <TouchableOpacity style={[s.chip, on && (gold ? s.chipGold : s.chipOn)]} onPress={onPress}>
      <Text style={[s.chipText, on && { color: gold ? colors.goldDeep : colors.white }]}>{label}</Text>
    </TouchableOpacity>
  )
}

/** One agent's line: who, what part, their terms and — on a deal —
    what they're owed and whether it's been paid. With `record`, it
    shows which listing/deal instead of who (on the agent's own card). */
export function InvolvementRow({
  r,
  deal,
  record,
  onChange,
  onRemove,
}: {
  r: Involvement
  deal?: DealMoney | null
  record?: { kind: string; label: string; onOpen?: () => void }
  onChange: () => void
  onRemove?: () => void
}) {
  const api = useApi()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState(r.role)
  const [shareType, setShareType] = useState(r.share_type ?? '')
  const [shareValue, setShareValue] = useState(r.share_value != null ? String(r.share_value) : '')
  const [notes, setNotes] = useState(r.notes ?? '')
  const [amount, setAmount] = useState(r.payout_amount_lakh != null ? String(r.payout_amount_lakh) : '')
  const [ref, setRef] = useState(r.payout_ref ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const expected = deal ? agentShareLakh(r, deal) : null
  const payable = !!r.share_type && r.share_type !== 'Paid by their client'
  const onDeal = r.entity_type === 'transaction'
  const c = r.contact

  async function patch(body: Record<string, unknown>) {
    setBusy(true)
    setError(null)
    try {
      await api.patch(`/api/contact-links?id=${r.id}`, body)
      onChange()
      return true
    } catch (e) {
      setError((e as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }
  const saveTerms = async () => {
    if (await patch({ role, share_type: shareType, share_value: shareValue.trim() === '' ? null : Number(shareValue), notes })) setOpen(false)
  }
  const setPayout = (payout_status: string) =>
    patch({
      payout_status,
      ...(payout_status === 'Paid' ? { payout_amount_lakh: amount.trim() ? Number(amount) : expected, payout_ref: ref.trim() } : {}),
    })

  return (
    <View style={s.row}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => (record ? record.onOpen?.() : c && router.push({ pathname: '/contact/[id]', params: { id: c.id } }))}
        >
          {record ? <Text style={s.kind}>{record.kind}</Text> : null}
          <Text style={s.name}>
            {record ? record.label : c?.name}
            {!record && c?.agent_status === 'Preferred' ? '  ✓' : ''}
          </Text>
          <Text style={s.sub}>
            {[!record ? c?.agency : '', r.role, shareLabel(r), onDeal && payable && expected != null ? `≈ ${lakh(expected)}` : ''].filter(Boolean).join(' · ')}
          </Text>
        </TouchableOpacity>
        {onDeal && payable ? <Badge label={r.payout_status || 'Not due'} tone={payoutTone(r.payout_status)} /> : null}
        {!record && c?.phone ? (
          <>
            <TouchableOpacity style={s.iconBtn} onPress={() => Linking.openURL(telUrl(c.phone))} accessibilityLabel={`Call ${c.name}`}>
              <Ionicons name="call" size={15} color={colors.navy} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.iconBtn}
              accessibilityLabel={`WhatsApp ${c.name}`}
              onPress={() => Linking.openURL(waUrl(c.phone, `Hello ${c.name.split(' ')[0]}, this is Bhumi Estates regarding ${r.entity_label}.`))}
            >
              <Ionicons name="logo-whatsapp" size={15} color={colors.navy} />
            </TouchableOpacity>
          </>
        ) : null}
        <TouchableOpacity style={s.iconBtn} onPress={() => setOpen((o) => !o)} accessibilityLabel="Terms and payout">
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color={colors.navy} />
        </TouchableOpacity>
      </View>
      {r.payout_status === 'Paid' ? (
        <Text style={s.paid}>
          ✓ Paid {lakh(r.payout_amount_lakh)}
          {r.paid_at ? ` · ${new Date(r.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
          {r.payout_ref ? ` · ref ${r.payout_ref}` : ''}
        </Text>
      ) : null}
      {open ? (
        <View style={s.edit}>
          <Text style={s.label}>Part they play</Text>
          <View style={s.chips}>
            {AGENT_LINK_ROLES.map((x) => (
              <Chip key={x} label={x} on={role === x} onPress={() => setRole(x)} />
            ))}
          </View>
          <Text style={s.label}>Their share</Text>
          <View style={s.chips}>
            {SHARE_TYPES.map((x) => (
              <Chip key={x} label={x} on={shareType === x} onPress={() => setShareType(x)} />
            ))}
          </View>
          {shareType && shareType !== 'Paid by their client' ? (
            <TextInput
              style={s.input}
              value={shareValue}
              onChangeText={setShareValue}
              keyboardType="decimal-pad"
              placeholder={shareType === 'Flat' ? 'Amount in ₹ lakh, e.g. 2.5' : 'Percent, e.g. 25'}
              placeholderTextColor={colors.muted}
            />
          ) : null}
          <TextInput style={s.input} value={notes} onChangeText={setNotes} placeholder="Terms in words, e.g. 50:50 co-broke, paid on registration" placeholderTextColor={colors.muted} />
          <View style={s.actions}>
            <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={saveTerms} disabled={busy}>
              {busy ? <ActivityIndicator color={colors.white} /> : <Text style={[s.btnText, { color: colors.white }]}>Save terms</Text>}
            </TouchableOpacity>
            {onRemove ? (
              <TouchableOpacity style={s.btn} onPress={onRemove}>
                <Text style={[s.btnText, { color: colors.flagged }]}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {onDeal && payable ? (
            <>
              <Text style={s.label}>Payout</Text>
              <TextInput
                style={s.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder={expected != null ? `Amount (₹ lakh), expected ${Number(expected.toFixed(2))}` : 'Amount (₹ lakh)'}
                placeholderTextColor={colors.muted}
              />
              <TextInput style={s.input} value={ref} onChangeText={setRef} placeholder="Payment ref / UTR / invoice no." placeholderTextColor={colors.muted} />
              <View style={s.chips}>
                {PAYOUT_STATUSES.map((x) => (
                  <Chip key={x} label={x === 'Paid' ? 'Mark paid' : x} on={(r.payout_status || 'Not due') === x} onPress={() => !busy && setPayout(x)} />
                ))}
              </View>
            </>
          ) : null}
          {error ? <Text style={s.error}>{error}</Text> : null}
        </View>
      ) : null}
    </View>
  )
}

/** Agents on one listing, deal or lead: add them, set terms, track
    payouts, and (listing, lead) see who works the area. */
export function AgentsPanel({ entityType, entityId, entityLabel, deal }: { entityType: Entity; entityId: string; entityLabel: string; deal?: DealMoney | null }) {
  const api = useApi()
  const suggest = entityType !== 'transaction'
  const [rows, setRows] = useState<Involvement[] | null>(null)
  const [ready, setReady] = useState({ contacts: true, agents: true })
  const [role, setRole] = useState(DEFAULT_ROLE[entityType])
  const [picking, setPicking] = useState(false)
  const [suggestions, setSuggestions] = useState<{ item: Contact; reasons: string[] }[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api
      .get<{ data: Involvement[]; ready: boolean; agents: boolean }>(`/api/contact-links?entity_type=${entityType}&entity_id=${encodeURIComponent(entityId)}`)
      .then((r) => {
        setRows(r.data.filter(isAgentRow))
        setReady({ contacts: r.ready, agents: r.agents })
      })
      .catch(() => setRows([]))
    if (suggest)
      api
        .get<{ data: { item: Contact; reasons: string[] }[] }>(`/api/agents/suggest?entity_type=${entityType}&entity_id=${encodeURIComponent(entityId)}`)
        .then((r) => setSuggestions(r.data))
        .catch(() => setSuggestions([]))
  }, [api, entityType, entityId, suggest])
  useEffect(load, [load])

  async function add(a: Contact) {
    setError(null)
    try {
      await api.post('/api/contact-links', {
        contact_id: a.id,
        entity_type: entityType,
        entity_id: entityId,
        entity_label: entityLabel,
        role,
        // Their usual cut, ready to adjust.
        ...(ready.agents && a.default_share_pct != null
          ? { share_type: 'Percent of our commission', share_value: a.default_share_pct, ...(entityType === 'transaction' ? { payout_status: 'Not due' } : {}) }
          : {}),
      })
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function remove(r: Involvement) {
    Alert.alert(`Remove ${r.contact?.name ?? 'this agent'}?`, `From ${entityLabel}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRows((p) => p?.filter((x) => x.id !== r.id) ?? null)
          await api.del(`/api/contact-links?id=${r.id}`).catch((e) => setError(e.message))
          load()
        },
      },
    ])
  }

  const money = useMemo(() => {
    if (entityType !== 'transaction' || !deal) return null
    const ours = ourCommissionLakh(deal)
    const payable = (rows ?? []).filter((r) => r.share_type && r.share_type !== 'Paid by their client')
    const shares = payable.map((r) => agentShareLakh(r, deal))
    const known = shares.every((x) => x != null)
    const agents = shares.reduce<number>((a, b) => a + (b ?? 0), 0)
    const paid = payable.filter((r) => r.payout_status === 'Paid').reduce((a, r) => a + (r.payout_amount_lakh ?? agentShareLakh(r, deal) ?? 0), 0)
    return { ours, agents, known, net: ours != null ? ours - agents : null, paid, owed: agents - paid }
  }, [entityType, deal, rows])

  if (!ready.contacts) return <Text style={s.empty}>Agents arrive with database migrations 015 and 016 (Setup, on the website).</Text>
  const noun = entityType === 'transaction' ? 'deal' : entityType === 'property' ? 'listing' : 'lead'
  return (
    <View>
      {!ready.agents ? <Text style={s.warn}>Commission shares and payouts need database migration 016 (Setup, on the website).</Text> : null}
      {money ? (
        <View style={s.split}>
          <View style={s.splitCell}>
            <Text style={s.splitLabel}>Our commission</Text>
            <Text style={s.splitValue}>{lakh(money.ours)}</Text>
          </View>
          <View style={s.splitCell}>
            <Text style={s.splitLabel}>Agents</Text>
            <Text style={s.splitValue}>− {money.known ? lakh(money.agents) : '?'}</Text>
          </View>
          <View style={[s.splitCell, s.splitNet]}>
            <Text style={[s.splitLabel, { color: colors.goldTint }]}>Bhumi net</Text>
            <Text style={[s.splitValue, { color: colors.white }]}>{money.net != null && money.known ? lakh(money.net) : '—'}</Text>
          </View>
          {money.agents > 0 ? <Text style={s.splitFoot}>{lakh(money.paid)} paid out · {lakh(Math.max(0, money.owed))} still to pay</Text> : null}
          {money.ours == null ? <Text style={s.splitFoot}>Set the deal value and commission to see the split.</Text> : null}
        </View>
      ) : null}

      {rows === null ? (
        <ActivityIndicator color={colors.navy} />
      ) : rows.length === 0 ? (
        <Text style={s.emptyLeft}>No outside agent on this {noun}.</Text>
      ) : (
        rows.map((r) => <InvolvementRow key={r.id} r={r} deal={deal} onChange={load} onRemove={() => remove(r)} />)
      )}
      {error ? <Text style={s.error}>{error}</Text> : null}

      <View style={[s.chips, { marginTop: space.sm }]}>
        {AGENT_LINK_ROLES.map((x) => (
          <Chip key={x} label={x} on={role === x} gold onPress={() => setRole(x)} />
        ))}
      </View>
      <TouchableOpacity style={s.dashed} onPress={() => setPicking(true)}>
        <Ionicons name="person-add-outline" size={16} color={colors.navy} />
        <Text style={s.dashedText}>Add an agent as {role}</Text>
      </TouchableOpacity>
      <ContactPickerSheet
        visible={picking}
        onClose={() => setPicking(false)}
        onPick={add}
        agentsOnly
        defaultRole="Agent"
        title={`Add a ${role.toLowerCase()}`}
        exclude={(rows ?? []).map((r) => r.contact?.id ?? '')}
      />

      {suggest && suggestions.length ? (
        <>
          <Text style={[s.label, { marginTop: space.md }]}>Agents who work this area</Text>
          {suggestions.map((x) => (
            <View key={x.item.id} style={s.suggest}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push({ pathname: '/contact/[id]', params: { id: x.item.id } })}>
                <Text style={s.name}>{x.item.name}</Text>
                <Text style={s.sub}>{[x.item.agency, x.item.operating_areas].filter(Boolean).join(' · ')}</Text>
                <Text style={s.reasons}>✓ {x.reasons.join('  ✓ ')}</Text>
                {x.item.rating ? <Stars n={x.item.rating} size={11} /> : null}
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnSoft, { flex: 0, paddingHorizontal: 14 }]} onPress={() => add(x.item)}>
                <Text style={s.btnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  row: { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  kind: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5, color: colors.muted, textTransform: 'uppercase' },
  name: { fontSize: text.base, fontWeight: '700', color: colors.ink },
  sub: { fontSize: text.xs, color: colors.muted, marginTop: 2 },
  paid: { fontSize: text.xs, fontWeight: '700', color: colors.verified, marginTop: 4 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  edit: { marginTop: 10, padding: 12, borderRadius: radius.base, backgroundColor: colors.bg },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color: colors.muted, textTransform: 'uppercase', marginBottom: 6, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipGold: { backgroundColor: colors.goldTint, borderColor: colors.gold },
  chipText: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.base, padding: 11, fontSize: text.base, backgroundColor: colors.white, color: colors.ink, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: radius.base, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  btnPrimary: { backgroundColor: colors.navy, borderColor: colors.navy },
  btnSoft: { backgroundColor: colors.goldTint, borderColor: colors.goldTint },
  btnText: { fontSize: text.sm, fontWeight: '700', color: colors.navy },
  error: { fontSize: text.sm, color: colors.flagged, marginTop: 6 },
  warn: { fontSize: text.sm, color: colors.pending, backgroundColor: colors.pendingBg, padding: 10, borderRadius: radius.base, marginBottom: 10 },
  empty: { fontSize: text.sm, color: colors.muted, textAlign: 'center', paddingVertical: space.lg },
  emptyLeft: { fontSize: text.sm, color: colors.muted, paddingVertical: space.sm },
  dashed: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: radius.base, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line },
  dashedText: { fontSize: text.sm, fontWeight: '700', color: colors.navy },
  suggest: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  reasons: { fontSize: text.xs, color: colors.verified, marginTop: 3, marginBottom: 2 },
  split: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: radius.base, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, marginBottom: space.md },
  splitCell: { flex: 1, minWidth: 90, padding: 10, backgroundColor: colors.white },
  splitNet: { backgroundColor: colors.navy },
  splitLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4, color: colors.muted, textTransform: 'uppercase' },
  splitValue: { fontSize: text.lg, fontWeight: '800', color: colors.navy, marginTop: 2 },
  splitFoot: { width: '100%', fontSize: text.xs, color: colors.muted, padding: 8, backgroundColor: colors.bg },
})
