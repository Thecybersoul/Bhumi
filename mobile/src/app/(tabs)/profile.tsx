import { useCallback, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import * as Updates from 'expo-updates'
import * as WebBrowser from 'expo-web-browser'
import Constants from 'expo-constants'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, Alert, Image, Linking, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useApi } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { API_URL } from '@/lib/config'
import { colors, radius, space, text } from '@/lib/theme'
import { Screen } from '@/components/ui'
import { Avatar, timeAgo } from '@/components/people'
import { ActivityFeed } from '@/components/activity'
import { NotifySettings } from '@/components/notifySettings'
import { ClaudeConnector } from '@/components/claudeConnector'

type IconName = keyof typeof Ionicons.glyphMap

interface Me {
  user: { id: string; name: string; email: string; role: string; last_login_at: string | null; password_changed_at: string | null; created_at: string | null }
  session: { expires_at: string }
  team: { id: string; name: string; email: string; role: string; last_login_at: string | null; last_active_at: string | null }[]
}

interface GoogleStatus {
  configured: boolean
  connected: boolean
  drive?: boolean
  account?: string
  email?: string | null
  connected_by?: string | null
  connected_at?: string | null
  services?: Record<'drive' | 'calendar' | 'meet' | 'gmail' | 'sheets', boolean>
  missing?: string[]
}

interface Register {
  enabled: boolean
  url?: string
  last_synced_at?: string
  synced_by?: string
  error?: string
}

function Row({ icon, title, sub, onPress, right, danger }: { icon: IconName; title: string; sub?: string; onPress?: () => void; right?: React.ReactNode; danger?: boolean }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress} activeOpacity={0.6}>
      <View style={[s.rowIcon, danger && { backgroundColor: colors.flaggedBg }]}>
        <Ionicons name={icon} size={19} color={danger ? colors.flagged : colors.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowTitle, danger && { color: colors.flagged }]}>{title}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null)}
    </TouchableOpacity>
  )
}

const Sep = () => <View style={s.sep} />

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'

export default function ProfileScreen() {
  const api = useApi()
  const { user, signOut } = useSession()
  const [me, setMe] = useState<Me | null>(null)
  const [google, setGoogle] = useState<GoogleStatus | null>(null)
  const [gBusy, setGBusy] = useState(false)
  const [upd, setUpd] = useState('')
  const [updBusy, setUpdBusy] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pwBusy, setPwBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [feedKey, setFeedKey] = useState(0)
  const [register, setRegister] = useState<Register | null>(null)
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(async () => {
    const [m, g] = await Promise.all([
      api.get<Me>('/api/admin/me').catch(() => null),
      api.get<GoogleStatus>('/api/admin/google/status').catch(() => ({ configured: false, connected: false })),
    ])
    setMe(m)
    setGoogle(g)
    api
      .get<Register>('/api/sheets')
      .then(setRegister)
      .catch(() => setRegister(null))
    setFeedKey((k) => k + 1)
  }, [api])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

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
      load()
    }
  }

  function disconnectGoogle() {
    Alert.alert(
      'Disconnect Google for everyone?',
      'The whole team shares this connection. Calendar sync and Drive uploads stop until someone reconnects. Files already in Drive stay there.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await api.del('/api/admin/google/status').catch(() => {})
            load()
          },
        },
      ]
    )
  }

  async function syncSheets() {
    setSyncing(true)
    try {
      await api.post('/api/sheets')
      setRegister(await api.get<Register>('/api/sheets'))
    } catch (e) {
      Alert.alert('Sync failed', (e as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  async function changePassword() {
    setPwMsg(null)
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, text: 'The new passwords don’t match.' })
    setPwBusy(true)
    try {
      await api.post('/api/admin/password', { current: pw.current, next: pw.next })
      setPw({ current: '', next: '', confirm: '' })
      setPwMsg({ ok: true, text: 'Password changed. Use it next time you sign in.' })
    } catch (e) {
      setPwMsg({ ok: false, text: (e as Error).message })
    } finally {
      setPwBusy(false)
    }
  }

  async function checkUpdates() {
    if (!Updates.isEnabled) return setUpd('Updates are only available in an installed build.')
    setUpdBusy(true)
    try {
      const r = await Updates.checkForUpdateAsync()
      if (!r.isAvailable) return setUpd('You have the latest version.')
      setUpd('Downloading…')
      await Updates.fetchUpdateAsync()
      await Updates.reloadAsync()
    } catch (e) {
      setUpd((e as Error).message)
    } finally {
      setUpdBusy(false)
    }
  }

  const name = me?.user.name ?? user?.name ?? ''
  const email = me?.user.email ?? user?.email ?? ''
  const gConnected = google?.connected
  const gSub = !google
    ? 'Checking…'
    : !google.configured
      ? 'Not set up on the server yet'
      : !gConnected
        ? `Not connected — sign in as ${google.account}`
        : google.missing?.length
          ? `Connected, but without ${google.missing.join(', ')} — reconnect to add ${google.missing.length > 1 ? 'them' : 'it'}`
          : `Connected by ${google.connected_by || 'a team member'} · ${timeAgo(google.connected_at)}`

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              await load()
              setRefreshing(false)
            }}
            tintColor={colors.white}
          />
        }
      >
        <View style={s.hero}>
          <Avatar name={name} size={72} />
          <Text style={s.name}>{name}</Text>
          <Text style={s.email}>{email}</Text>
          <View style={s.role}>
            <Ionicons name="shield-checkmark" size={12} color={colors.goldSoft} />
            <Text style={s.roleText}>{me?.user.role ?? 'Admin'} · full access</Text>
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.group}>Account</Text>
          <View style={s.block}>
            <Row icon="mail-outline" title="Email" sub={email} />
            <Sep />
            <Row icon="phone-portrait-outline" title="Signed in on this phone" sub={`Until ${fmtDate(me?.session.expires_at)}`} />
            <Sep />
            <Row icon="time-outline" title="Last sign-in" sub={fmtDate(me?.user.last_login_at)} />
            <Sep />
            <Row
              icon="key-outline"
              title="Change password"
              sub={me?.user.password_changed_at ? `Last changed ${timeAgo(me.user.password_changed_at)}` : undefined}
              onPress={() => {
                setPwOpen((o) => !o)
                setPwMsg(null)
              }}
              right={<Ionicons name={pwOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />}
            />
            {pwOpen ? (
              <View style={s.pw}>
                {(
                  [
                    ['current', 'Current password'],
                    ['next', 'New password (12+ characters)'],
                    ['confirm', 'Repeat new password'],
                  ] as const
                ).map(([k, ph]) => (
                  <TextInput
                    key={k}
                    style={s.input}
                    placeholder={ph}
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    autoCapitalize="none"
                    value={pw[k]}
                    onChangeText={(v) => setPw((p) => ({ ...p, [k]: v }))}
                  />
                ))}
                {pwMsg ? <Text style={[s.pwMsg, { color: pwMsg.ok ? colors.verified : colors.flagged }]}>{pwMsg.text}</Text> : null}
                <TouchableOpacity style={s.primary} onPress={changePassword} disabled={pwBusy}>
                  {pwBusy ? <ActivityIndicator color={colors.white} /> : <Text style={s.primaryText}>Update password</Text>}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <Text style={s.group}>Notifications & reminders</Text>
          <View style={[s.block, { paddingHorizontal: space.md, paddingVertical: space.sm }]}>
            <NotifySettings />
          </View>

          <Text style={s.group}>Claude connector</Text>
          <View style={[s.block, { paddingHorizontal: space.md, paddingVertical: space.md }]}>
            <ClaudeConnector />
          </View>

          <Text style={s.group}>Team</Text>
          <View style={s.block}>
            {(me?.team ?? []).map((t, i) => (
              <View key={t.id}>
                {i ? <Sep /> : null}
                <View style={s.row}>
                  <Avatar name={t.name} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>
                      {t.name}
                      {t.id === me?.user.id ? <Text style={s.you}>  You</Text> : null}
                    </Text>
                    <Text style={s.rowSub}>{t.email}</Text>
                  </View>
                  <Text style={s.active}>{t.last_active_at ? `Active ${timeAgo(t.last_active_at)}` : t.last_login_at ? `Signed in ${timeAgo(t.last_login_at)}` : 'Not signed in yet'}</Text>
                </View>
              </View>
            ))}
            {!me ? <ActivityIndicator color={colors.navy} style={{ margin: space.md }} /> : null}
          </View>

          <Text style={s.group}>Google Workspace</Text>
          <View style={s.block}>
            <Row
              icon="logo-google"
              title={google?.email || google?.account || 'info@bhumiestates.in'}
              sub={gSub}
              right={gConnected ? <View style={[s.dot, { backgroundColor: google?.missing?.length ? colors.pending : colors.verified }]} /> : null}
            />
            <View style={s.services}>
              {(
                [
                  ['drive', 'folder', 'Drive'],
                  ['calendar', 'calendar', 'Calendar'],
                  ['meet', 'videocam', 'Meet'],
                  ['gmail', 'mail', 'Gmail'],
                  ['sheets', 'grid', 'Sheets'],
                ] as const
              ).map(([key, icon, label]) => {
                const on = Boolean(gConnected && google?.services?.[key])
                return (
                  <View key={key} style={[s.service, on && s.serviceOn]}>
                    <Ionicons name={icon} size={14} color={on ? colors.verified : colors.muted} />
                    <Text style={[s.serviceText, on && { color: colors.verified }]}>{label}</Text>
                  </View>
                )
              })}
            </View>
            {google?.configured ? (
              <View style={s.gActions}>
                <TouchableOpacity style={[s.primary, { flex: 1 }]} onPress={connectGoogle} disabled={gBusy}>
                  {gBusy ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={s.primaryText}>{gConnected ? (google.missing?.length ? 'Reconnect to add the rest' : 'Reconnect') : 'Connect Google account'}</Text>
                  )}
                </TouchableOpacity>
                {gConnected ? (
                  <TouchableOpacity style={s.ghost} onPress={disconnectGoogle}>
                    <Text style={s.ghostText}>Disconnect</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
            {google?.drive ? (
              <>
                <Sep />
                <Row
                  icon="folder-open-outline"
                  title="Open Bhumi Estates ERP in Drive"
                  sub="Listings, Deals, Meetings — one folder per record"
                  onPress={() => Linking.openURL('https://drive.google.com/drive/search?q=Bhumi%20Estates%20ERP')}
                />
              </>
            ) : null}
            {register?.enabled ? (
              <>
                <Sep />
                <Row
                  icon="grid-outline"
                  title="Live register in Google Sheets"
                  sub={
                    register.error
                      ? `Last sync failed: ${register.error}`
                      : register.last_synced_at
                        ? `Synced ${timeAgo(register.last_synced_at)} by ${register.synced_by ?? 'the team'} · Listings, Deals, Leads, Meetings, Tasks, Activity`
                        : 'Not created yet — tap Sync now'
                  }
                  onPress={register.url ? () => Linking.openURL(register.url as string) : undefined}
                  right={register.url ? <Ionicons name="open-outline" size={17} color={colors.muted} /> : null}
                />
                <View style={s.gActions}>
                  <TouchableOpacity style={[s.ghost, { flex: 1, paddingVertical: 11, alignItems: 'center' }]} onPress={syncSheets} disabled={syncing}>
                    {syncing ? <ActivityIndicator color={colors.navy} /> : <Text style={[s.ghostText, { color: colors.navy }]}>Sync now</Text>}
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
          <Text style={s.note}>
            One company account for the whole team. When anyone connects it, it’s connected for everyone. Documents go to Drive in a folder for each listing and deal, meetings go on its calendar with Meet links, emails are sent from its Gmail, and a Sheets register mirrors the ERP.
          </Text>

          <Text style={s.group}>Your recent activity</Text>
          <View style={[s.block, { paddingHorizontal: space.md }]}>
            {me ? <ActivityFeed key={`me-${feedKey}`} actorId={me.user.id} limit={6} emptyText="Nothing yet — your changes will show here." /> : null}
          </View>
          <TouchableOpacity style={s.seeAll} onPress={() => router.push('/activity')}>
            <Text style={s.seeAllText}>See the whole team’s activity</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.goldDeep} />
          </TouchableOpacity>

          <Text style={s.group}>Website & marketplace</Text>
          <View style={s.block}>
            <Row icon="create-outline" title="Website content" sub="Homepage, services, contact details" onPress={() => router.push('/content')} />
            <Sep />
            <Row icon="images-outline" title="Media library" sub="Photos and videos used on the site" onPress={() => router.push('/media')} />
            <Sep />
            <Row icon="folder-outline" title="All documents" sub="Search every deed, EC and agreement" onPress={() => router.push('/documents')} />
            <Sep />
            <Row icon="globe-outline" title="Open the live website" sub="bhumiestates.in" onPress={() => Linking.openURL(API_URL)} />
          </View>

          <Text style={s.group}>App</Text>
          <View style={s.block}>
            <Row
              icon="cloud-download-outline"
              title="Check for updates"
              sub={upd || `Version ${Constants.expoConfig?.version ?? '1.0'}${Updates.updateId ? ` · ${Updates.updateId.slice(0, 8)}` : ''}`}
              onPress={checkUpdates}
              right={updBusy ? <ActivityIndicator color={colors.navy} /> : undefined}
            />
            <Sep />
            <Row icon="server-outline" title="Server" sub={`${API_URL.replace(/^https?:\/\//, '')} · ${Platform.OS}`} />
            <Sep />
            <Row icon="log-out-outline" title="Sign out" danger onPress={signOut} />
          </View>

          <Image source={require('../../../assets/logo-light.png')} style={s.footLogo} resizeMode="contain" />
        </View>
      </ScrollView>
    </Screen>
  )
}

const s = StyleSheet.create({
  hero: { backgroundColor: colors.navy, alignItems: 'center', paddingTop: space.md, paddingBottom: space.xl, gap: 4 },
  name: { color: colors.white, fontSize: text.xl, fontWeight: '800', marginTop: space.sm },
  email: { color: 'rgba(255,255,255,0.7)', fontSize: text.sm },
  role: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  roleText: { color: colors.goldSoft, fontSize: text['2xs'], fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  body: { padding: space.lg, paddingTop: space.sm },
  group: { fontSize: text['2xs'], fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: space.lg, marginBottom: space.sm, marginLeft: 4 },
  block: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: space.md },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.navyTint, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: text.md, fontWeight: '700', color: colors.ink },
  rowSub: { fontSize: text.sm, color: colors.muted, marginTop: 1 },
  you: { fontSize: text['2xs'], fontWeight: '800', color: colors.goldDeep },
  active: { fontSize: text['2xs'], color: colors.muted, fontWeight: '600', maxWidth: 110, textAlign: 'right' },
  sep: { height: 1, backgroundColor: colors.line2, marginLeft: 62 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  services: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: space.md, paddingBottom: space.md },
  service: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, backgroundColor: colors.line2 },
  serviceOn: { backgroundColor: colors.verifiedBg },
  serviceText: { fontSize: text['2xs'], fontWeight: '800', color: colors.muted },
  gActions: { flexDirection: 'row', gap: 8, paddingHorizontal: space.md, paddingBottom: space.md },
  primary: { backgroundColor: colors.navy, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.white, fontWeight: '700', fontSize: text.sm },
  ghost: { paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  ghostText: { color: colors.flagged, fontWeight: '700', fontSize: text.sm },
  note: { fontSize: text.xs, color: colors.muted, marginTop: 8, marginHorizontal: 4, lineHeight: 17 },
  pw: { paddingHorizontal: space.md, paddingBottom: space.md, gap: 8 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.base, padding: 12, fontSize: text.base, color: colors.ink, backgroundColor: colors.paper },
  pwMsg: { fontSize: text.sm, fontWeight: '600' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginTop: 8, marginRight: 4 },
  seeAllText: { fontSize: text.sm, fontWeight: '700', color: colors.goldDeep },
  footLogo: { width: 150, height: 150 * (260 / 1200), alignSelf: 'center', marginTop: space.xl, opacity: 0.5 },
})
