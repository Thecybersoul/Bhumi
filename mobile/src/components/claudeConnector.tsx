import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi } from '@/lib/api'
import { colors, space, text } from '@/lib/theme'

/* Profile → Claude connector. Makes a personal link that connects your
   own Claude app (claude.ai, Claude for iPhone/Android/desktop, on your
   own subscription) to the ERP, so Claude can add listings, leads and
   meetings, file WhatsApp posts and answer questions from live data,
   all as you. The link is shown once; revoke it here any time. */

interface Link {
  id: string
  label: string
  created_at: string
  last_used_at: string | null
}

const STEPS = [
  'Open claude.ai (or the Claude app) and go to Settings → Connectors.',
  'Tap “Add custom connector”. Name it Bhumi ERP and paste the link.',
  'In a chat, turn on Bhumi ERP from the tools menu, then just ask: “Add this WhatsApp post as a listing…”, “What follow-ups are due today?”',
]

export function ClaudeConnector() {
  const api = useApi()
  const [links, setLinks] = useState<Link[] | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api
      .get<{ links: Link[] }>('/api/connector')
      .then((r) => setLinks(r.links))
      .catch((e) => (setError((e as Error).message), setLinks([])))
  }, [api])
  useEffect(load, [load])

  async function create() {
    setBusy(true)
    setError(null)
    try {
      const r = await api.post<{ url: string }>('/api/connector', { label: `Claude · ${Platform.OS === 'web' ? 'iPhone' : 'Android'}` })
      setUrl(r.url)
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!url) return
    if (Platform.OS === 'web' && navigator.clipboard) {
      await navigator.clipboard.writeText(url).then(() => setCopied(true), () => Share.share({ message: url }))
    } else await Share.share({ message: url })
  }

  function revoke(l: Link) {
    Alert.alert('Disconnect this link?', 'Claude will lose access to the ERP through it straight away.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await api.del(`/api/connector?id=${l.id}`).catch((e) => setError((e as Error).message))
          load()
        },
      },
    ])
  }

  return (
    <View style={{ gap: 10 }}>
      <Text style={s.lead}>
        Use your own Claude app with the ERP: paste a WhatsApp post or just talk to it, and it adds listings, leads, meetings and tasks as you. Runs on your Claude
        subscription, with nothing extra to pay.
      </Text>

      {url ? (
        <View style={s.linkBox}>
          <Text style={s.linkLabel}>Your connector link (shown once, keep it private)</Text>
          <Text style={s.url} selectable numberOfLines={2}>
            {url}
          </Text>
          <TouchableOpacity style={s.primary} onPress={copy}>
            <Ionicons name={copied ? 'checkmark' : Platform.OS === 'web' ? 'copy-outline' : 'share-outline'} size={16} color={colors.white} />
            <Text style={s.primaryText}>{copied ? 'Copied' : Platform.OS === 'web' ? 'Copy link' : 'Copy or share link'}</Text>
          </TouchableOpacity>
          {STEPS.map((st, i) => (
            <View key={i} style={s.step}>
              <Text style={s.stepNo}>{i + 1}</Text>
              <Text style={s.stepText}>{st}</Text>
            </View>
          ))}
        </View>
      ) : (
        <TouchableOpacity style={[s.primary, busy && { opacity: 0.6 }]} onPress={create} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.white} /> : <Ionicons name="link-outline" size={16} color={colors.white} />}
          <Text style={s.primaryText}>{links?.length ? 'Make a new connector link' : 'Connect Claude'}</Text>
        </TouchableOpacity>
      )}

      {links?.length ? (
        <View style={{ gap: 6 }}>
          <Text style={s.linkLabel}>Connected</Text>
          {links.map((l) => (
            <View key={l.id} style={s.row}>
              <Ionicons name="sparkles" size={15} color={colors.goldDeep} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{l.label}</Text>
                <Text style={s.rowSub}>
                  {l.last_used_at ? `Last used ${new Date(l.last_used_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : 'Not used yet'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => revoke(l)} hitSlop={8}>
                <Text style={s.revoke}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  )
}

const s = StyleSheet.create({
  lead: { fontSize: text.sm, color: colors.ink2, lineHeight: 20 },
  linkBox: { gap: 8, backgroundColor: colors.navyTint, borderRadius: 12, padding: space.md },
  linkLabel: { fontSize: text.xs, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  url: { fontSize: text.sm, fontWeight: '600', color: colors.navy, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.navy, borderRadius: 12, paddingVertical: 12 },
  primaryText: { color: colors.white, fontSize: text.md, fontWeight: '800' },
  step: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  stepNo: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.navy, color: colors.white, fontSize: 11, fontWeight: '800', textAlign: 'center', lineHeight: 20, overflow: 'hidden' },
  stepText: { flex: 1, fontSize: text.sm, color: colors.ink, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  rowTitle: { fontSize: text.sm, fontWeight: '700', color: colors.ink },
  rowSub: { fontSize: text.xs, color: colors.muted },
  revoke: { fontSize: text.sm, fontWeight: '700', color: colors.flagged },
  error: { fontSize: text.sm, color: colors.flagged, fontWeight: '600' },
})
