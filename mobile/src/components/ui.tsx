import { ActivityIndicator, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { colors, radius, space, statusColor, text } from '@/lib/theme'

export function Screen({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.cardTitle}>{children}</Text>
}

export function StatTile({
  value,
  label,
  note,
  accent = 'navy',
}: {
  value: string
  label: string
  note?: string
  accent?: 'navy' | 'gold' | 'verified' | 'flagged' | 'progress'
}) {
  const accentColor =
    accent === 'gold'
      ? colors.gold
      : accent === 'verified'
        ? colors.verified
        : accent === 'flagged'
          ? colors.flagged
          : accent === 'progress'
            ? colors.progress
            : colors.navy
  return (
    <View style={[styles.statTile, { borderTopColor: accentColor }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {note && <Text style={styles.statNote}>{note}</Text>}
    </View>
  )
}

export function Badge({ label, tone = 'pending' }: { label: string; tone?: keyof typeof statusColor }) {
  const c = statusColor[tone] ?? statusColor.pending
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  )
}

export function LoadingScreen() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.navy} />
    </View>
  )
}

export function EmptyState({ text: msg }: { text: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.empty}>{msg}</Text>
    </View>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    marginBottom: space.md,
  },
  cardTitle: { fontSize: text.lg, fontWeight: '700', color: colors.navy, marginBottom: space.sm },
  statTile: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopWidth: 3,
    padding: space.md,
    flex: 1,
    minWidth: 140,
  },
  statValue: { fontSize: text['2xl'], fontWeight: '700', color: colors.navy },
  statLabel: { fontSize: text.base, fontWeight: '600', color: colors.ink, marginTop: 2 },
  statNote: { fontSize: text.sm, color: colors.muted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, alignSelf: 'flex-start' },
  badgeText: { fontSize: text['2xs'], fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  empty: { color: colors.muted, fontSize: text.md, textAlign: 'center' },
  errorBanner: { backgroundColor: colors.pendingBg, borderRadius: radius.base, padding: space.md, margin: space.lg },
  errorText: { color: colors.pending, fontSize: text.base },
})
