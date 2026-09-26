import { useCallback, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi } from '@/lib/api'
import { colors, radius, space, text } from '@/lib/theme'
import type { Meeting, MeetingEntityType, MeetingKind } from '@/lib/types'
import { MeetingCard } from './meetingCard'

/** Meetings, calls and site visits logged against one listing, deal
    or lead, with a button to log the next one pre-linked. */
export function RelatedMeetings({
  entityType,
  entityId,
  entityLabel,
  defaultKind = 'In person',
}: {
  entityType: MeetingEntityType
  entityId: string
  entityLabel: string
  defaultKind?: MeetingKind
}) {
  const api = useApi()
  const [items, setItems] = useState<Meeting[] | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ data: Meeting[] }>(`/api/meetings?entity_type=${entityType}&entity_id=${encodeURIComponent(entityId)}`)
      setItems([...r.data].sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at)))
    } catch {
      setItems([])
    }
  }, [api, entityType, entityId])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  return (
    <View>
      {items === null ? (
        <ActivityIndicator color={colors.navy} style={{ marginVertical: space.sm }} />
      ) : items.length === 0 ? (
        <Text style={s.empty}>None logged yet.</Text>
      ) : (
        items.slice(0, 6).map((m) => <MeetingCard key={m.id} m={m} showDay />)
      )}
      <TouchableOpacity
        style={s.add}
        onPress={() =>
          router.push({ pathname: '/meeting/[id]', params: { id: 'new', entity_type: entityType, entity_id: entityId, entity_label: entityLabel, kind: defaultKind } })
        }
      >
        <Ionicons name="add-circle-outline" size={18} color={colors.navy} />
        <Text style={s.addText}>{defaultKind === 'Site visit' ? 'Log a site visit or meeting' : 'Log a meeting or call'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  empty: { fontSize: text.sm, color: colors.muted, marginBottom: space.sm },
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: radius.base, borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed', marginTop: 4 },
  addText: { fontSize: text.sm, fontWeight: '700', color: colors.navy },
})
