import { useCallback, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import * as Updates from 'expo-updates'
import * as WebBrowser from 'expo-web-browser'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useApi } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { API_URL } from '@/lib/config'
import { colors, space, text } from '@/lib/theme'
import { Screen } from '@/components/ui'

type IconName = keyof typeof Ionicons.glyphMap

function Row({ icon, title, sub, onPress, right }: { icon: IconName; title: string; sub?: string; onPress?: () => void; right?: React.ReactNode }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress} activeOpacity={0.6}>
      <View style={s.rowIcon}>
        <Ionicons name={icon} size={19} color={colors.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null)}
    </TouchableOpacity>
  )
}

interface GoogleStatus {
  configured: boolean
  connected: boolean
  drive?: boolean
}

export default function MoreScreen() {
  const api = useApi()
  const { signOut } = useSession()
  const [google, setGoogle] = useState<GoogleStatus | null>(null)
  const [gBusy, setGBusy] = useState(false)
  const [upd, setUpd] = useState('')
  const [busy, setBusy] = useState(false)

  const loadGoogle = useCallback(() => {
    api
      .get<GoogleStatus>('/api/admin/google/status')
      .then(setGoogle)
      .catch(() => setGoogle({ configured: false, connected: false }))
  }, [api])

  useFocusEffect(loadGoogle)

  async function connectGoogle() {
    setGBusy(true)
    try {
      const { url } = await api.post<{ url: string }>('/api/admin/google/connect')
      const res = await WebBrowser.openAuthSessionAsync(url, 'bhumiadmin://google')
      if (res.type === 'success' && res.url.includes('google=error')) {
        const msg = decodeURIComponent(res.url.match(/google_message=([^&]+)/)?.[1] ?? 'Google sign-in failed')
        Alert.alert('Could not connect', msg.replace(/\+/g, ' '))
      }
    } catch (e) {
      Alert.alert('Could not connect', (e as Error).message)
    } finally {
      setGBusy(false)
      loadGoogle()
    }
  }

  function disconnectGoogle() {
    Alert.alert('Disconnect Google?', 'Calendar sync and Drive uploads stop. Files already in Drive stay there.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await api.del('/api/admin/google/status').catch(() => {})
          loadGoogle()
        },
      },
    ])
  }

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

  const gStatus = !google
    ? 'Checking…'
    : !google.configured
      ? 'Google credentials are not set on the server yet'
      : !google.connected
        ? 'Not connected'
        : google.drive
          ? 'Connected · Calendar, Meet and Drive'
          : 'Connected for Calendar only — reconnect to add Drive'

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 48 }}>
        <Text style={s.group}>Website & marketplace</Text>
        <View style={s.block}>
          <Row icon="create-outline" title="Website content" sub="Homepage, services, contact details" onPress={() => router.push('/content')} />
          <View style={s.sep} />
          <Row icon="images-outline" title="Media library" sub="Photos and videos used on the site" onPress={() => router.push('/media')} />
          <View style={s.sep} />
          <Row icon="globe-outline" title="Open the live website" sub="bhumiestates.in" onPress={() => Linking.openURL(API_URL)} />
        </View>

        <Text style={s.group}>Records</Text>
        <View style={s.block}>
          <Row icon="folder-outline" title="All documents" sub="Deeds, ECs, agreements — search across every record" onPress={() => router.push('/documents')} />
        </View>

        <Text style={s.group}>Google Workspace</Text>
        <View style={s.block}>
          <Row
            icon="logo-google"
            title="Calendar, Meet & Drive"
            sub={gStatus}
            right={
              google?.connected ? (
                <View style={[s.dot, { backgroundColor: google.drive ? colors.verified : colors.pending }]} />
              ) : null
            }
          />
          {google?.configured ? (
            <View style={s.gActions}>
              <TouchableOpacity style={s.gBtn} onPress={connectGoogle} disabled={gBusy}>
                {gBusy ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={s.gBtnText}>{google.connected ? (google.drive ? 'Reconnect' : 'Reconnect with Drive') : 'Connect Google account'}</Text>
                )}
              </TouchableOpacity>
              {google.connected ? (
                <TouchableOpacity style={s.gGhost} onPress={disconnectGoogle}>
                  <Text style={s.gGhostText}>Disconnect</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          {google?.drive ? (
            <>
              <View style={s.sep} />
              <Row icon="folder-open-outline" title="Open Bhumi Estates ERP in Drive" sub="Every uploaded document, by record" onPress={() => Linking.openURL('https://drive.google.com/drive/search?q=Bhumi%20Estates%20ERP')} />
            </>
          ) : null}
        </View>
        <Text style={s.note}>
          Documents are saved to Google Drive once it is connected, in folders per listing, deal and note. Until then they go to Bhumi's private storage.
        </Text>

        <Text style={s.group}>App</Text>
        <View style={s.block}>
          <Row
            icon="cloud-download-outline"
            title="Check for updates"
            sub={upd || (Updates.isEnabled ? `Version ${(Updates.updateId ?? 'embedded').slice(0, 8)}` : 'Development build')}
            onPress={checkUpdates}
            right={busy ? <ActivityIndicator color={colors.navy} /> : undefined}
          />
          <View style={s.sep} />
          <Row icon="server-outline" title="Server" sub={`${API_URL} · ${Platform.OS}`} />
        </View>

        <TouchableOpacity style={s.signOut} onPress={signOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.flagged} />
          <Text style={s.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  )
}

const s = StyleSheet.create({
  group: { fontSize: text['2xs'], fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: space.lg, marginBottom: space.sm, marginLeft: 4 },
  block: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: space.md },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.navyTint, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: text.md, fontWeight: '700', color: colors.ink },
  rowSub: { fontSize: text.sm, color: colors.muted, marginTop: 1 },
  sep: { height: 1, backgroundColor: colors.line2, marginLeft: 62 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  gActions: { flexDirection: 'row', gap: 8, paddingHorizontal: space.md, paddingBottom: space.md },
  gBtn: { flex: 1, backgroundColor: colors.navy, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  gBtnText: { color: colors.white, fontWeight: '700', fontSize: text.sm },
  gGhost: { paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  gGhostText: { color: colors.flagged, fontWeight: '700', fontSize: text.sm },
  note: { fontSize: text.xs, color: colors.muted, marginTop: 8, marginHorizontal: 4, lineHeight: 17 },
  signOut: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: space.xl, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.flaggedBg },
  signOutText: { color: colors.flagged, fontWeight: '700', fontSize: text.md },
})
