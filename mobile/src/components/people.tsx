import { StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { colors, text } from '@/lib/theme'
import type { Audited } from '@/lib/types'

/* Each person keeps one colour everywhere in the app, so a glance at
   an avatar says who did something before the name is read. */
const PALETTE = ['#0E3B2E', '#9E7833', '#1B6FA8', '#6B4FA8', '#B5543C', '#2F8462']
const FIXED: Record<string, string> = { Chethan: '#2F8462', Sanjog: '#B8862F', Ranjith: '#1B6FA8' }

export function personColor(name?: string | null) {
  if (!name) return colors.muted
  if (FIXED[name]) return FIXED[name]
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export function initials(name?: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function Avatar({ name, size = 28 }: { name?: string | null; size?: number }) {
  const system = !name || name === 'Website' || name === 'Imported' || name === 'System'
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: system ? colors.line2 : personColor(name) }]}>
      {system ? (
        <Ionicons name={name === 'Website' ? 'globe-outline' : 'cog-outline'} size={size * 0.5} color={colors.muted} />
      ) : (
        <Text style={[s.initials, { fontSize: size * 0.4 }]}>{initials(name)}</Text>
      )}
    </View>
  )
}

export function timeAgo(iso?: string | null) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** "Added by Sanjog · 3d ago · Edited by Chethan · 2h ago" — who is
    behind a record, shown on every card and detail screen. */
export function ByLine({ record, createdAt, compact }: { record: Audited; createdAt?: string; compact?: boolean }) {
  const by = record.created_by
  const upd = record.updated_by
  const edited = upd && record.updated_at && (upd !== by || (createdAt && Math.abs(new Date(record.updated_at).getTime() - new Date(createdAt).getTime()) > 60_000))
  if (!by && !edited) return null
  return (
    <View style={s.by}>
      {by ? (
        <View style={s.byPart}>
          <Avatar name={by} size={16} />
          <Text style={s.byText} numberOfLines={1}>
            {compact ? by : `Added by ${by}`}
            {createdAt ? ` · ${timeAgo(createdAt)}` : ''}
          </Text>
        </View>
      ) : null}
      {edited ? (
        <View style={s.byPart}>
          <Ionicons name="create-outline" size={12} color={colors.muted} />
          <Text style={s.byText} numberOfLines={1}>
            {compact ? upd : `Edited by ${upd}`} · {timeAgo(record.updated_at)}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '800' },
  by: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 4, marginTop: 6 },
  byPart: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  byText: { fontSize: text.xs, color: colors.muted, flexShrink: 1 },
})
