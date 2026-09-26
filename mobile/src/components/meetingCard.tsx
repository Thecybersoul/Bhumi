import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { colors, radius, space, text } from '@/lib/theme'
import { KIND_ICON, KIND_TINT, needsOutcome, timeOf } from '@/lib/meetings'
import type { Meeting } from '@/lib/types'
import { LINK_ICON } from './entityPicker'
import { Avatar } from './people'

export function MeetingCard({ m, showDay }: { m: Meeting; showDay?: boolean }) {
  const tint = KIND_TINT[m.kind] ?? colors.navy
  const owed = needsOutcome(m)
  const cancelled = m.status === 'Cancelled'
  return (
    <TouchableOpacity
      style={[s.card, cancelled && { opacity: 0.55 }]}
      activeOpacity={0.75}
      onPress={() => router.push({ pathname: '/meeting/[id]', params: { id: m.id } })}
    >
      <View style={s.time}>
        <Text style={s.timeText}>{timeOf(m.scheduled_at)}</Text>
        {showDay ? (
          <Text style={s.day}>{new Date(m.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
        ) : (
          <Text style={s.day}>{m.duration_min} min</Text>
        )}
      </View>
      <View style={[s.rail, { backgroundColor: tint }]} />
      <View style={{ flex: 1 }}>
        <View style={s.top}>
          <Ionicons name={KIND_ICON[m.kind] ?? 'people'} size={13} color={tint} />
          <Text style={[s.kind, { color: tint }]}>{m.kind}</Text>
          {m.status === 'Completed' ? (
            <View style={[s.pill, { backgroundColor: colors.verifiedBg }]}>
              <Ionicons name="checkmark" size={11} color={colors.verified} />
              <Text style={[s.pillText, { color: colors.verified }]}>Done</Text>
            </View>
          ) : owed ? (
            <View style={[s.pill, { backgroundColor: colors.pendingBg }]}>
              <Text style={[s.pillText, { color: colors.pending }]}>Add outcome</Text>
            </View>
          ) : cancelled ? (
            <View style={[s.pill, { backgroundColor: colors.line2 }]}>
              <Text style={[s.pillText, { color: colors.muted }]}>Cancelled</Text>
            </View>
          ) : null}
        </View>
        <Text style={[s.title, cancelled && { textDecorationLine: 'line-through' }]} numberOfLines={2}>
          {m.title}
        </Text>
        {m.entity_label ? (
          <View style={s.link}>
            <Ionicons name={LINK_ICON[m.entity_type] ?? 'link-outline'} size={12} color={colors.goldDeep} />
            <Text style={s.linkText} numberOfLines={1}>{m.entity_label}</Text>
          </View>
        ) : null}
        {m.location || m.attendees ? (
          <Text style={s.meta} numberOfLines={1}>
            {[m.attendees, m.location].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        <View style={s.foot}>
          {m.created_by ? (
            <View style={s.by}>
              <Avatar name={m.created_by} size={16} />
              <Text style={s.byText}>{m.created_by}</Text>
            </View>
          ) : (
            <View />
          )}
          {m.google_meet_url ? (
            <View style={s.meet}>
              <Ionicons name="videocam" size={12} color={colors.progress} />
              <Text style={s.meetText}>Meet</Text>
            </View>
          ) : m.google_event_id ? (
            <Ionicons name="calendar" size={13} color={colors.progress} />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: 8, gap: 12 },
  time: { width: 58, alignItems: 'flex-start' },
  timeText: { fontSize: text.base, fontWeight: '800', color: colors.ink },
  day: { fontSize: text['2xs'], color: colors.muted, marginTop: 2, fontWeight: '600' },
  rail: { width: 3, borderRadius: 2 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  kind: { fontSize: text['2xs'], fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  pillText: { fontSize: 10, fontWeight: '800' },
  title: { fontSize: text.md, fontWeight: '700', color: colors.ink, marginTop: 3 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  linkText: { fontSize: text.xs, color: colors.goldDeep, fontWeight: '700', flexShrink: 1 },
  meta: { fontSize: text.xs, color: colors.muted, marginTop: 3 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  by: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  byText: { fontSize: text['2xs'], color: colors.muted, fontWeight: '600' },
  meet: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.progressBg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100 },
  meetText: { fontSize: 10, fontWeight: '800', color: colors.progress },
})
