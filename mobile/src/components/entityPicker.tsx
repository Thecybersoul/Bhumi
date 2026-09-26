import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApi } from '@/lib/api'
import { colors, radius, space, text } from '@/lib/theme'
import type { ApiResult, Lead, Property, PropertyTransaction, Task } from '@/lib/types'

export type LinkType = 'property' | 'transaction' | 'task' | 'lead'
export interface LinkValue {
  entity_type: LinkType | 'general'
  entity_id: string | null
  entity_label: string
}

const TABS: { type: LinkType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'property', label: 'Listing', icon: 'map-outline' },
  { type: 'transaction', label: 'Deal', icon: 'briefcase-outline' },
  { type: 'task', label: 'Task', icon: 'checkbox-outline' },
  { type: 'lead', label: 'Lead', icon: 'person-outline' },
]

export const LINK_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  property: 'map-outline',
  transaction: 'briefcase-outline',
  task: 'checkbox-outline',
  lead: 'person-outline',
  meeting: 'people-outline',
  verification: 'shield-checkmark-outline',
  general: 'link-outline',
}

interface Option {
  id: string
  label: string
  sub: string
}

/** "Related to" — pick the listing, deal, task or lead a meeting,
    task or note is about, from the real records rather than a
    free-text label, so it shows up on that record's page. */
export function EntityPicker({
  value,
  onChange,
  types = ['property', 'transaction', 'task', 'lead'],
  label = 'Related to',
}: {
  value: LinkValue
  onChange: (v: LinkValue) => void
  types?: LinkType[]
  label?: string
}) {
  const api = useApi()
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<LinkType>(types[0])
  const [q, setQ] = useState('')
  const [options, setOptions] = useState<Record<string, Option[] | undefined>>({})

  useEffect(() => {
    if (!open || options[tab]) return
    const load = async (): Promise<Option[]> => {
      if (tab === 'property') {
        const r = await api.get<ApiResult<Property[]>>('/api/properties?admin=1')
        return r.source === 'live' ? r.data.map((p) => ({ id: p.id, label: `${p.code} · ${p.title}`, sub: `${p.location} · ${p.status}` })) : []
      }
      if (tab === 'transaction') {
        const r = await api.get<ApiResult<PropertyTransaction[]>>('/api/transactions')
        return r.source === 'live'
          ? r.data.map((t) => ({ id: t.id, label: `${t.reference} · ${t.property_label}`, sub: `${t.stage} · ${[t.buyer_name, t.seller_name].filter(Boolean).join(' / ')}` }))
          : []
      }
      if (tab === 'task') {
        const r = await api.get<ApiResult<Task[]>>('/api/tasks')
        return r.source === 'live' ? r.data.filter((t) => t.status === 'Open').map((t) => ({ id: t.id, label: t.title, sub: t.entity_label || t.priority })) : []
      }
      const r = await api.get<ApiResult<Lead[]>>('/api/leads')
      return r.source === 'live' ? r.data.map((l) => ({ id: l.id, label: l.name, sub: `${l.kind} · ${l.stage}` })) : []
    }
    load()
      .then((o) => setOptions((p) => ({ ...p, [tab]: o })))
      .catch(() => setOptions((p) => ({ ...p, [tab]: [] })))
  }, [open, tab, api, options])

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (options[tab] ?? []).filter((o) => !needle || `${o.label} ${o.sub}`.toLowerCase().includes(needle))
  }, [options, tab, q])

  const linked = value.entity_type !== 'general' && value.entity_label

  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity style={s.trigger} onPress={() => setOpen(true)}>
        <Ionicons name={LINK_ICON[value.entity_type] ?? 'link-outline'} size={17} color={linked ? colors.navy : colors.muted} />
        <Text style={[s.triggerText, !linked && { color: colors.muted }]} numberOfLines={1}>
          {linked ? value.entity_label : 'Link a listing, deal, task or lead'}
        </Text>
        {linked ? (
          <TouchableOpacity hitSlop={10} onPress={() => onChange({ entity_type: 'general', entity_id: null, entity_label: '' })}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={16} color={colors.muted} />
        )}
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + space.md }]}>
          <View style={s.grab} />
          <Text style={s.sheetTitle}>{label}</Text>
          <View style={s.tabs}>
            {TABS.filter((t) => types.includes(t.type)).map((t) => (
              <TouchableOpacity key={t.type} style={[s.tab, tab === t.type && s.tabOn]} onPress={() => setTab(t.type)}>
                <Ionicons name={t.icon} size={14} color={tab === t.type ? colors.white : colors.ink2} />
                <Text style={[s.tabText, tab === t.type && { color: colors.white }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.search}>
            <Ionicons name="search" size={16} color={colors.muted} />
            <TextInput style={s.searchInput} value={q} onChangeText={setQ} placeholder="Search" placeholderTextColor={colors.muted} />
          </View>
          {options[tab] === undefined ? (
            <ActivityIndicator color={colors.navy} style={{ marginVertical: space.xl }} />
          ) : (
            <FlatList
              data={list}
              keyExtractor={(o) => o.id}
              style={{ maxHeight: 380 }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={s.empty}>Nothing here yet.</Text>}
              renderItem={({ item }) => {
                const on = value.entity_id === item.id
                return (
                  <TouchableOpacity
                    style={s.option}
                    onPress={() => {
                      onChange({ entity_type: tab, entity_id: item.id, entity_label: item.label })
                      setOpen(false)
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.optLabel} numberOfLines={1}>{item.label}</Text>
                      <Text style={s.optSub} numberOfLines={1}>{item.sub}</Text>
                    </View>
                    {on ? <Ionicons name="checkmark-circle" size={20} color={colors.verified} /> : null}
                  </TouchableOpacity>
                )
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  field: { marginBottom: space.md },
  label: { fontSize: text.sm, fontWeight: '700', color: colors.ink2, marginBottom: 6 },
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: radius.base, padding: space.md, backgroundColor: colors.white },
  triggerText: { flex: 1, fontSize: text.md, color: colors.ink, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(10,20,16,0.45)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: space.lg, paddingTop: 10 },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: space.md },
  sheetTitle: { fontSize: text.lg, fontWeight: '800', color: colors.navy, marginBottom: space.sm },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: space.sm },
  tab: { flex: 1, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: colors.line },
  tabOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  tabText: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: radius.base, paddingHorizontal: 12, marginBottom: 4 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: text.base, color: colors.ink },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  optLabel: { fontSize: text.base, fontWeight: '700', color: colors.ink },
  optSub: { fontSize: text.xs, color: colors.muted, marginTop: 2 },
  empty: { fontSize: text.sm, color: colors.muted, textAlign: 'center', paddingVertical: space.lg },
})
