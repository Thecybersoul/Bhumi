import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import * as Updates from 'expo-updates'
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useApi } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { API_URL } from '@/lib/config'
import { colors, space, text } from '@/lib/theme'
import { Screen } from '@/components/ui'
import { Button } from '@/components/form'

function Row({ title, sub, onPress }: { title: string; sub: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowSub}>{sub}</Text>
      </View>
      <Text style={s.chev}>›</Text>
    </TouchableOpacity>
  )
}

export default function MoreScreen() {
  const api = useApi()
  const { signOut } = useSession()
  const [google, setGoogle] = useState<string>('…')
  const [upd, setUpd] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .get<{ configured: boolean; connected: boolean }>('/api/admin/google/status')
      .then((r) => setGoogle(r.connected ? 'Connected' : r.configured ? 'Not connected — connect from the web admin → Setup' : 'Not configured on the server'))
      .catch(() => setGoogle('Unavailable'))
  }, [api])

  async function checkUpdates() {
    if (!Updates.isEnabled) return setUpd('Updates are only available in an installed build.')
    setBusy(true)
    try {
      const r = await Updates.checkForUpdateAsync()
      if (!r.isAvailable) return setUpd('You have the latest version.')
      setUpd('Downloading…')
      await Updates.fetchUpdateAsync()
      await Updates.reloadAsync()
    } catch (e) {
      setUpd((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg }}>
        <Text style={s.group}>Website & marketplace</Text>
        <Row title="Website content" sub="Homepage, Property Consultancy, Branding, contact details" onPress={() => router.push('/content')} />
        <Row title="Media library" sub="Upload and manage photos and videos" onPress={() => router.push('/media')} />
        <Text style={s.hintLine}>Marketplace listings are under the Listings tab.</Text>

        <Text style={s.group}>Integrations</Text>
        <View style={s.card}>
          <Text style={s.rowTitle}>Google Calendar & Meet</Text>
          <Text style={s.rowSub}>{google}</Text>
        </View>

        <Text style={s.group}>App</Text>
        <View style={s.card}>
          <Text style={s.rowSub}>Server: {API_URL}</Text>
          <Text style={s.rowSub}>{Platform.OS} · {Updates.isEnabled ? `update ${(Updates.updateId ?? 'embedded').slice(0, 8)}` : 'development build'}</Text>
        </View>
        <Button label="Check for updates" tone="ghost" onPress={checkUpdates} busy={busy} />
        {upd ? <Text style={s.hintLine}>{upd}</Text> : null}

        <View style={{ marginTop: space.xl }}>
          <Button label="Sign out" tone="danger" onPress={signOut} />
        </View>
      </ScrollView>
    </Screen>
  )
}

const s = StyleSheet.create({
  group: { fontSize: text.sm, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: space.lg, marginBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: 8 },
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: 8 },
  rowTitle: { fontSize: text.md, fontWeight: '700', color: colors.navy },
  rowSub: { fontSize: text.sm, color: colors.muted, marginTop: 2 },
  chev: { fontSize: 26, color: colors.muted, marginLeft: 8 },
  hintLine: { fontSize: text.sm, color: colors.muted, marginTop: 6 },
})
