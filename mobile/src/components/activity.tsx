import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useApi } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'
import type { Activity } from '@/lib/types'
import { Avatar, timeAgo } from './people'

const NOUN: Record<string, string> = {
  property: 'listing',
  transaction: 'deal',
  lead: 'lead',
  note: 'note',
  task: 'task',
  verification: 'verification case',
  data_room: 'document request',
  meeting: 'meeting',
  document: 'document',
  website: 'website',
  media: 'media',
  google: 'Google Workspace',
  account: 'account',
  sheets: 'Google Sheets register',
  contact: 'contact',
}

const VERB: Record<string, string> = {
  create: 'added',
  update: 'updated',
  delete: 'removed',
  upload: 'uploaded to',
  link: 'linked a file to',
  connect: 'connected',
  disconnect: 'disconnected',
  login: 'signed in',
  email: 'emailed about',
  sync: 'synced',
  tag: 'tagged',
}

export function activityHeadline(a: Activity) {
  if (a.entity_type === 'google' || a.entity_type === 'account' || a.entity_type === 'sheets') return `${VERB[a.action] ?? a.action} ${NOUN[a.entity_type] ?? ''}`.trim()
  return `${VERB[a.action] ?? a.action} ${NOUN[a.entity_type] ?? a.entity_type}`
}

export function openActivity(a: Activity) {
  if (!a.entity_id || a.action === 'delete') return
  if (a.entity_type === 'property') router.push({ pathname: '/property/[id]', params: { id: a.entity_id } })
  else if (a.entity_type === 'transaction') router.push({ pathname: '/transaction/[id]', params: { id: a.entity_id } })
  else if (a.entity_type === 'meeting') router.push({ pathname: '/meeting/[id]', params: { id: a.entity_id } })
  else if (a.entity_type === 'lead') router.push({ pathname: '/lead/[id]', params: { id: a.entity_id } })
  else if (a.entity_type === 'contact') router.push({ pathname: '/contact/[id]', params: { id: a.entity_id } })
  else if (a.entity_type === 'task' || a.entity_type === 'note') router.push('/notes-tasks')
}

export function ActivityRow({ a, showEntity = true }: { a: Activity; showEntity?: boolean }) {
  return (
    <TouchableOpacity style={s.row} onPress={() => openActivity(a)} activeOpacity={0.6}>
      <Avatar name={a.actor_name} size={30} />
      <View style={{ flex: 1 }}>
        <Text style={s.line} numberOfLines={2}>
          <Text style={s.actor}>{a.actor_name}</Text> {activityHeadline(a)}
          {showEntity && a.entity_label ? <Text style={s.entity}> {a.entity_label}</Text> : null}
        </Text>
        {a.summary ? (
          <Text style={s.summary} numberOfLines={2}>
            {a.summary}
          </Text>
        ) : null}
      </View>
      <Text style={s.time}>{timeAgo(a.created_at)}</Text>
    </TouchableOpacity>
  )
}

/** The trail for one record (pass entityType + entityId), one person
    (actorId), or everyone (neither). */
export function ActivityFeed({
  entityType,
  entityId,
  actorId,
  limit = 20,
  emptyText = 'No activity yet.',
}: {
  entityType?: string
  entityId?: string
  actorId?: string
  limit?: number
  emptyText?: string
}) {
  const api = useApi()
  const [items, setItems] = useState<Activity[] | null>(null)

  const load = useCallback(async () => {
    const q = new URLSearchParams({ limit: String(limit) })
    if (entityType) q.set('entity_type', entityType)
    if (entityId) q.set('entity_id', entityId)
    if (actorId) q.set('actor_id', actorId)
    try {
      setItems((await api.get<{ data: Activity[] }>(`/api/activity?${q}`)).data)
    } catch {
      setItems([])
    }
  }, [api, entityType, entityId, actorId, limit])

  useEffect(() => {
    load()
  }, [load])

  if (items === null) return <ActivityIndicator color={colors.navy} style={{ marginVertical: space.md }} />
  if (!items.length) return <Text style={s.empty}>{emptyText}</Text>
  return (
    <View>
      {items.map((a) => (
        <ActivityRow key={a.id} a={a} showEntity={!entityId} />
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line2, alignItems: 'flex-start' },
  line: { fontSize: text.sm, color: colors.ink2, lineHeight: 19 },
  actor: { fontWeight: '800', color: colors.ink },
  entity: { fontWeight: '700', color: colors.navy },
  summary: { fontSize: text.xs, color: colors.muted, marginTop: 2, lineHeight: 17 },
  time: { fontSize: text['2xs'], color: colors.muted, marginTop: 2 },
  empty: { fontSize: text.sm, color: colors.muted, paddingVertical: space.sm },
})
