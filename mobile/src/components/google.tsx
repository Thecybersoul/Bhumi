import { useCallback, useEffect, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi } from '@/lib/api'
import { colors, radius, space, text } from '@/lib/theme'
import { Avatar, timeAgo } from './people'

/* Gmail and Meet actions that any record screen can drop in. */

export interface EmailDraft {
  to?: string
  cc?: string
  subject: string
  body: string
  entity_type: string
  entity_id: string
  entity_label: string
  attach?: string[]
}

export function composeEmail(d: EmailDraft) {
  router.push({
    pathname: '/email',
    params: { ...d, attach: d.attach?.join(',') ?? '' },
  })
}

interface SentEmail {
  id: string
  to_addresses: string
  subject: string
  attachments: { name: string }[]
  created_by: string
  created_at: string
}

/** Emails sent about one record, newest first. */
export function EmailLog({ entityType, entityId }: { entityType: string; entityId: string }) {
  const api = useApi()
  const [items, setItems] = useState<SentEmail[] | null>(null)
  const load = useCallback(() => {
    api
      .get<{ data: SentEmail[] }>(`/api/email?entity_type=${entityType}&entity_id=${encodeURIComponent(entityId)}`)
      .then((r) => setItems(r.data))
      .catch(() => setItems([]))
  }, [api, entityType, entityId])
  useFocusEffect(load)

  if (items === null) return <ActivityIndicator color={colors.navy} style={{ marginVertical: space.sm }} />
  if (!items.length) return <Text style={s.empty}>No emails sent yet.</Text>
  return (
    <View>
      {items.slice(0, 8).map((e) => (
        <View key={e.id} style={s.row}>
          <Avatar name={e.created_by} size={26} />
          <View style={{ flex: 1 }}>
            <Text style={s.subject} numberOfLines={1}>{e.subject}</Text>
            <Text style={s.meta} numberOfLines={1}>
              To {e.to_addresses}
              {e.attachments?.length ? ` · ${e.attachments.length} attachment${e.attachments.length > 1 ? 's' : ''}` : ''}
            </Text>
          </View>
          <Text style={s.time}>{timeAgo(e.created_at)}</Text>
        </View>
      ))}
    </View>
  )
}

/** "Start a Meet now": opens a fresh Google Meet room and logs it as a
    video call against the record. */
export function MeetNowButton({
  entityType,
  entityId,
  entityLabel,
  title,
  compact,
}: {
  entityType?: string
  entityId?: string
  entityLabel?: string
  title?: string
  compact?: boolean
}) {
  const api = useApi()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enabled, setEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    api
      .get<{ services?: { meet?: boolean } }>('/api/admin/google/status')
      .then((g) => setEnabled(Boolean(g.services?.meet)))
      .catch(() => setEnabled(false))
  }, [api])

  async function start() {
    setBusy(true)
    setError(null)
    try {
      const r = await api.post<{ url: string }>('/api/meet/instant', { entity_type: entityType, entity_id: entityId, entity_label: entityLabel, title })
      await Linking.openURL(r.url)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (enabled === false) return null
  return (
    <View style={{ flex: compact ? 1 : undefined }}>
      <TouchableOpacity style={s.meet} onPress={start} disabled={busy || enabled === null}>
        {busy ? <ActivityIndicator color={colors.white} /> : <Ionicons name="videocam" size={17} color={colors.white} />}
        <Text style={s.meetText}>{compact ? 'Meet now' : 'Start a Google Meet now'}</Text>
      </TouchableOpacity>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  )
}

interface Session {
  started_at: string | null
  ended_at: string | null
  participants: { name: string; kind: string; joined_at: string | null; left_at: string | null; minutes: number | null }[]
  recordings: { url: string }[]
  transcripts: { url: string }[]
}

/** Who joined a meeting's Google Meet, and for how long, from the Meet
    API. Recording and transcript links appear when Workspace made them. */
export function MeetAttendance({ meetingId }: { meetingId: string }) {
  const api = useApi()
  const [data, setData] = useState<{ data: Session[]; reason?: string } | null>(null)
  const load = useCallback(() => {
    setData(null)
    api
      .get<{ data: Session[]; reason?: string }>(`/api/meetings/${meetingId}/attendance`)
      .then(setData)
      .catch((e) => setData({ data: [], reason: (e as Error).message }))
  }, [api, meetingId])
  useEffect(load, [load])

  if (!data) return <ActivityIndicator color={colors.navy} style={{ marginVertical: space.sm }} />
  if (!data.data.length) {
    return (
      <View>
        <Text style={s.empty}>{data.reason ?? 'Nobody has joined this Meet yet. Attendance appears here a few minutes after the call ends.'}</Text>
        <TouchableOpacity onPress={load} style={{ marginTop: 6 }}>
          <Text style={s.link}>Refresh</Text>
        </TouchableOpacity>
      </View>
    )
  }
  const t = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '…')
  return (
    <View>
      {data.data.map((c, i) => (
        <View key={i} style={{ marginBottom: space.sm }}>
          <Text style={s.session}>
            {c.started_at ? new Date(c.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} · {t(c.started_at)} – {c.ended_at ? t(c.ended_at) : 'ongoing'}
          </Text>
          {c.participants.map((p, j) => (
            <View key={j} style={s.row}>
              <Avatar name={p.name} size={24} />
              <View style={{ flex: 1 }}>
                <Text style={s.subject}>{p.name}</Text>
                <Text style={s.meta}>
                  {p.kind} · joined {t(p.joined_at)}
                </Text>
              </View>
              <Text style={s.time}>{p.minutes != null ? `${p.minutes} min` : ''}</Text>
            </View>
          ))}
          {[...c.recordings.map((r) => ['Recording', r.url] as const), ...c.transcripts.map((r) => ['Transcript', r.url] as const)].map(([label, url], j) => (
            <TouchableOpacity key={`${label}${j}`} style={s.asset} onPress={() => Linking.openURL(url)}>
              <Ionicons name={label === 'Recording' ? 'play-circle' : 'document-text'} size={16} color={colors.progress} />
              <Text style={s.assetText}>Open {label.toLowerCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  )
}

export function EmailButton({ draft, label = 'Email', compact }: { draft: EmailDraft; label?: string; compact?: boolean }) {
  return (
    <TouchableOpacity style={[s.email, compact && { flex: 1 }]} onPress={() => composeEmail(draft)}>
      <Ionicons name="mail" size={17} color={colors.navy} />
      <Text style={s.emailText}>{label}</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  empty: { fontSize: text.sm, color: colors.muted, marginVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line2 },
  subject: { fontSize: text.base, fontWeight: '700', color: colors.ink },
  meta: { fontSize: text.xs, color: colors.muted, marginTop: 1 },
  time: { fontSize: text['2xs'], color: colors.muted },
  meet: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.progress, borderRadius: radius.base, paddingVertical: 13, paddingHorizontal: 14 },
  meetText: { color: colors.white, fontWeight: '800', fontSize: text.sm },
  email: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navyTint, borderRadius: radius.base, paddingVertical: 13, paddingHorizontal: 14 },
  emailText: { color: colors.navy, fontWeight: '800', fontSize: text.sm },
  error: { fontSize: text.xs, color: colors.flagged, marginTop: 4 },
  link: { fontSize: text.sm, fontWeight: '700', color: colors.goldDeep },
  session: { fontSize: text.xs, fontWeight: '800', color: colors.navy, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  asset: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  assetText: { fontSize: text.sm, fontWeight: '700', color: colors.progress },
})
