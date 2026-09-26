import { useEffect, useState } from 'react'
import { Linking, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as Notifications from 'expo-notifications'
import { useApi } from '@/lib/api'
import { DEFAULT_PREFS, ensurePermission, getPrefs, setPrefs, syncReminders, type NotifyPrefs } from '@/lib/notify'
import { colors, space, text } from '@/lib/theme'

const LEADS: NotifyPrefs['meetingLead'][] = [0, 15, 30, 60]
const DIGEST_TIMES: [number, number][] = [
  [7, 30],
  [8, 30],
  [9, 30],
]

/** Profile → Notifications: what the phone reminds you about, and when. */
export function NotifySettings() {
  const api = useApi()
  const [prefs, set] = useState<NotifyPrefs>(DEFAULT_PREFS)
  const [permitted, setPermitted] = useState<boolean | null>(null)
  const [digestEmail, setDigestEmail] = useState(true)
  const [tested, setTested] = useState(false)

  useEffect(() => {
    getPrefs().then(set)
    if (Platform.OS !== 'web') Notifications.getPermissionsAsync().then((p) => setPermitted(p.granted))
    api
      .get<{ notify_prefs?: { digest_email?: boolean } }>('/api/admin/me')
      .then((r) => setDigestEmail(r.notify_prefs?.digest_email !== false))
      .catch(() => {})
  }, [api])

  async function update(patch: Partial<NotifyPrefs>) {
    const next = { ...prefs, ...patch }
    set(next)
    await setPrefs(next)
    syncReminders().catch(() => {})
  }

  async function toggleEmail(v: boolean) {
    setDigestEmail(v)
    await api.patch('/api/admin/me', { notify_prefs: { digest_email: v } }).catch(() => setDigestEmail(!v))
  }

  async function allow() {
    const ok = await ensurePermission()
    setPermitted(ok)
    if (!ok) Linking.openSettings()
  }

  async function test() {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Bhumi reminders are on', body: 'You’ll get meeting reminders, due tasks, and your day at a glance each morning.', data: { path: '/' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, channelId: 'reminders' },
    })
    setTested(true)
  }

  return (
    <View>
      {permitted === false ? (
        <TouchableOpacity style={s.warn} onPress={allow}>
          <Ionicons name="notifications-off" size={18} color={colors.pending} />
          <Text style={s.warnText}>Notifications are off for Bhumi. Tap to allow them.</Text>
        </TouchableOpacity>
      ) : null}

      <Row title="Morning digest" sub="Today’s meetings, tasks due and anything overdue" value={prefs.digest} onChange={(v) => update({ digest: v })} />
      {prefs.digest ? (
        <View style={s.chips}>
          {DIGEST_TIMES.map(([h, m]) => {
            const on = prefs.digestHour === h && prefs.digestMinute === m
            return (
              <TouchableOpacity key={`${h}${m}`} style={[s.chip, on && s.chipOn]} onPress={() => update({ digestHour: h, digestMinute: m })}>
                <Text style={[s.chipText, on && { color: colors.white }]}>{`${h}:${String(m).padStart(2, '0')} AM`}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      ) : null}

      <View style={s.sep} />
      <Text style={s.label}>Meeting reminder</Text>
      <View style={s.chips}>
        {LEADS.map((l) => (
          <TouchableOpacity key={l} style={[s.chip, prefs.meetingLead === l && s.chipOn]} onPress={() => update({ meetingLead: l })}>
            <Text style={[s.chipText, prefs.meetingLead === l && { color: colors.white }]}>{l ? `${l} min before` : 'Off'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.sep} />
      <Row title="After a meeting" sub="A nudge to write up the outcome and follow-ups" value={prefs.outcomeNudge} onChange={(v) => update({ outcomeNudge: v })} />
      <View style={s.sep} />
      <Row title="Tasks due" sub="An alert the moment a task falls due" value={prefs.taskDue} onChange={(v) => update({ taskDue: v })} />
      <View style={s.sep} />
      <Row title="Team updates" sub="New leads, document requests, deal and meeting changes" value={prefs.teamUpdates} onChange={(v) => update({ teamUpdates: v })} />
      <View style={s.sep} />
      <Row title="Daily email" sub="The same digest by email at 8:30 AM, from the company Gmail" value={digestEmail} onChange={toggleEmail} />

      {Platform.OS !== 'web' ? (
        <TouchableOpacity style={s.test} onPress={test}>
          <Ionicons name={tested ? 'checkmark-circle' : 'notifications-outline'} size={16} color={colors.navy} />
          <Text style={s.testText}>{tested ? 'Sent. Check your notifications' : 'Send a test notification'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

function Row({ title, sub, value, onChange }: { title: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.sub}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.navy600, false: colors.line }} />
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  title: { fontSize: text.md, fontWeight: '700', color: colors.ink },
  sub: { fontSize: text.sm, color: colors.muted, marginTop: 1 },
  label: { fontSize: text.md, fontWeight: '700', color: colors.ink, marginTop: 10, marginBottom: 8 },
  sep: { height: 1, backgroundColor: colors.line2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: text.xs, fontWeight: '700', color: colors.ink2 },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.pendingBg, borderRadius: 12, padding: space.sm, marginBottom: space.sm },
  warnText: { flex: 1, fontSize: text.sm, fontWeight: '700', color: colors.pending },
  test: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: space.sm, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.navyTint },
  testText: { fontSize: text.sm, fontWeight: '700', color: colors.navy },
})
