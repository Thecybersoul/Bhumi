import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppState, StyleSheet, Switch, Text, View } from 'react-native'
import { useEffect } from 'react'
import { useSession } from '@/lib/auth'
import { API_URL } from '@/lib/config'
import { colors, radius, space, text } from '@/lib/theme'
import { waCapture } from '@/lib/waNotify'

/* Profile → WhatsApp capture. Turns on the notification reader
   (modules/wa-notify), which sends this phone's WhatsApp messages to the
   ERP's Inbox as they arrive. Nothing shows where the module is absent. */
export function WaCapture() {
  const { token } = useSession()
  const [st, setSt] = useState(waCapture?.status() ?? null)

  const refresh = useCallback(() => {
    if (!waCapture) return
    const s = waCapture.status()
    // Keep the service's token current so it never posts with an expired one.
    if (s.enabled && token) waCapture.configure(API_URL, token, true)
    setSt(waCapture.status())
  }, [token])
  useFocusEffect(refresh)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (a) => a === 'active' && refresh())
    return () => sub.remove()
  }, [refresh])

  if (!waCapture || !st) return null

  const toggle = (on: boolean) => {
    waCapture!.configure(API_URL, token, on)
    if (on && !waCapture!.isPermissionGranted()) waCapture!.openPermissionSettings()
    setSt(waCapture!.status())
  }

  const working = st.enabled && st.granted
  const line = !st.enabled
    ? 'Off. Turn on to send this phone’s WhatsApp business messages to the ERP automatically.'
    : !st.granted
      ? 'Allow “Bhumi” in Notification access (opened for you), then come back.'
      : st.lastError
        ? `On, but the last send failed: ${st.lastError}`
        : st.lastSentAt
          ? `On. Last sent ${new Date(st.lastSentAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}${st.queued ? ` · ${st.queued} waiting for signal` : ''}.`
          : 'On. Messages appear in the ERP Inbox as they arrive.'

  return (
    <View style={s.box}>
      <View style={s.row}>
        <View style={s.icon}>
          <Ionicons name="logo-whatsapp" size={19} color={colors.navy} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>WhatsApp capture</Text>
          <Text style={[s.sub, st.enabled && (!st.granted || st.lastError) ? { color: colors.flagged } : null]}>{line}</Text>
        </View>
        <Switch value={st.enabled} onValueChange={toggle} trackColor={{ true: colors.navy600, false: colors.line }} />
      </View>
      {working ? (
        <Text style={s.note}>
          New chats wait in the Inbox until someone marks them Business. Family and friends on the Personal list (ERP → WhatsApp Inbox) are never kept. Muted chats send no notifications, so they can’t be captured.
        </Text>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  box: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.navyTint, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: text.md, fontWeight: '700', color: colors.ink },
  sub: { fontSize: text.sm, color: colors.muted, marginTop: 2 },
  note: { fontSize: text.xs, color: colors.ink2, marginTop: space.sm, lineHeight: 17 },
})
