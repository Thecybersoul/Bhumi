import { useEffect, useState } from 'react'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useApi } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { docIcon, formatBytes, type Doc } from '@/lib/documents'
import { colors, radius, space, text } from '@/lib/theme'
import { ErrorBanner, Screen } from '@/components/ui'

const WORKSPACE = 'info@bhumiestates.in'

/* Compose and send from info@bhumiestates.in. The caller passes the
   record it's about, plus any prefilled recipient, subject and body.
   The record's documents are offered as attachments. */
export default function EmailScreen() {
  const p = useLocalSearchParams<{
    to?: string
    cc?: string
    subject?: string
    body?: string
    entity_type?: string
    entity_id?: string
    entity_label?: string
    attach?: string
  }>()
  const api = useApi()
  const nav = useNavigation()
  const { user } = useSession()
  const [to, setTo] = useState(p.to ?? '')
  const [cc, setCc] = useState(p.cc ?? '')
  const [showCc, setShowCc] = useState(Boolean(p.cc))
  const [subject, setSubject] = useState(p.subject ?? '')
  const [body, setBody] = useState(p.body ?? '')
  const [docs, setDocs] = useState<Doc[]>([])
  const [picked, setPicked] = useState<Set<string>>(new Set(p.attach ? p.attach.split(',') : []))
  const [gmail, setGmail] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    nav.setOptions({ title: 'New email' })
    api
      .get<{ services?: { gmail?: boolean } }>('/api/admin/google/status')
      .then((g) => setGmail(Boolean(g.services?.gmail)))
      .catch(() => setGmail(false))
    if (p.entity_type && p.entity_id) {
      api
        .get<{ data: Doc[] }>(`/api/documents?entity_type=${p.entity_type}&entity_id=${encodeURIComponent(p.entity_id)}`)
        .then((r) => setDocs(r.data))
        .catch(() => {})
    }
  }, [api, nav, p.entity_type, p.entity_id])

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const total = docs.filter((d) => picked.has(d.id)).reduce((a, d) => a + (d.bytes ?? 0), 0)

  async function send() {
    setError(null)
    if (!to.trim()) return setError('Add a recipient')
    if (!subject.trim() || !body.trim()) return setError('Add a subject and a message')
    setBusy(true)
    try {
      await api.post('/api/email', {
        to,
        cc: showCc ? cc : '',
        subject,
        body,
        document_ids: [...picked],
        entity_type: p.entity_type,
        entity_id: p.entity_id,
        entity_label: p.entity_label,
      })
      setSent(true)
      setTimeout(() => router.back(), 900)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <Screen>
        <View style={s.sent}>
          <Ionicons name="checkmark-circle" size={56} color={colors.verified} />
          <Text style={s.sentTitle}>Sent</Text>
          <Text style={s.sentSub}>From {WORKSPACE} · in the Sent folder</Text>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        {gmail === false ? <ErrorBanner message="Gmail isn't connected yet. Connect Google from Profile (sign in as info@bhumiestates.in)." /> : null}
        {error ? <ErrorBanner message={error} /> : null}

        <View style={s.card}>
          <View style={s.line}>
            <Text style={s.k}>From</Text>
            <Text style={s.from} numberOfLines={1}>
              {user?.name ?? 'You'} · Bhumi Estates <Text style={s.muted}>&lt;{WORKSPACE}&gt;</Text>
            </Text>
          </View>
          <View style={s.line}>
            <Text style={s.k}>To</Text>
            <TextInput style={s.input} value={to} onChangeText={setTo} placeholder="client@example.com" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" />
            {!showCc ? (
              <TouchableOpacity onPress={() => setShowCc(true)} hitSlop={8}>
                <Text style={s.ccBtn}>Cc</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {showCc ? (
            <View style={s.line}>
              <Text style={s.k}>Cc</Text>
              <TextInput style={s.input} value={cc} onChangeText={setCc} placeholder="Separate with commas" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" />
            </View>
          ) : null}
          <View style={s.line}>
            <Text style={s.k}>Subject</Text>
            <TextInput style={[s.input, { fontWeight: '700' }]} value={subject} onChangeText={setSubject} placeholder="Subject" placeholderTextColor={colors.muted} />
          </View>
          <TextInput style={s.body} value={body} onChangeText={setBody} multiline placeholder="Write your message…" placeholderTextColor={colors.muted} textAlignVertical="top" />
          <Text style={s.sig}>Your name, Bhumi Estates, the company email and website are added as a signature.</Text>
        </View>

        {docs.length ? (
          <View style={s.card}>
            <Text style={s.h}>
              Attach documents {p.entity_label ? <Text style={s.muted}>from {p.entity_label}</Text> : null}
            </Text>
            {docs.map((d) => {
              const on = picked.has(d.id)
              const { icon, tint } = docIcon(d.mime, d.name)
              return (
                <TouchableOpacity key={d.id} style={s.doc} onPress={() => toggle(d.id)}>
                  <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? colors.navy : colors.muted} />
                  <Ionicons name={icon} size={18} color={tint} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.docName} numberOfLines={1}>{d.name}</Text>
                    <Text style={s.muted}>{[d.category, formatBytes(d.bytes), d.path === 'link' ? 'sent as a link' : null].filter(Boolean).join(' · ')}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
            {picked.size ? (
              <Text style={[s.muted, total > 18 * 1024 * 1024 && { color: colors.flagged, fontWeight: '700' }]}>
                {picked.size} selected · {formatBytes(total) || 'size unknown'} (limit 18 MB)
              </Text>
            ) : null}
          </View>
        ) : null}

        <TouchableOpacity style={[s.send, (busy || gmail === false) && { opacity: 0.6 }]} onPress={send} disabled={busy || gmail === false}>
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="send" size={17} color={colors.white} />
              <Text style={s.sendText}>Send email</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  )
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.md, marginBottom: space.md },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line2, minHeight: 46 },
  k: { width: 56, fontSize: text.sm, color: colors.muted, fontWeight: '700' },
  from: { flex: 1, fontSize: text.sm, color: colors.ink, fontWeight: '600' },
  input: { flex: 1, fontSize: text.md, color: colors.ink, paddingVertical: 10 },
  ccBtn: { fontSize: text.sm, color: colors.goldDeep, fontWeight: '800' },
  body: { minHeight: 220, fontSize: text.md, color: colors.ink, paddingTop: space.md, lineHeight: 22 },
  sig: { fontSize: text['2xs'], color: colors.muted, marginTop: 6 },
  h: { fontSize: text.md, fontWeight: '800', color: colors.navy, marginBottom: 6 },
  muted: { fontSize: text.xs, color: colors.muted, fontWeight: '500' },
  doc: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  docName: { fontSize: text.base, fontWeight: '700', color: colors.ink },
  send: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy, borderRadius: radius.base, paddingVertical: 15 },
  sendText: { color: colors.white, fontWeight: '800', fontSize: text.md },
  sent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  sentTitle: { fontSize: text.xl, fontWeight: '800', color: colors.ink },
  sentSub: { fontSize: text.sm, color: colors.muted },
})
