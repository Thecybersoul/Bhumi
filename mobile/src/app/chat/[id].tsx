import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApi } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { uploadDocument, type PickedFile } from '@/lib/documents'
import { colors, radius, space, text } from '@/lib/theme'
import { Screen } from '@/components/ui'
import { pickFiles, takePhoto } from '@/components/documents'
import { useVoice } from '@/lib/voice'
import { dayLabel, recordPath, type ChatAttachment, type ChatMessage } from '@/lib/chat'

/* One conversation: the team room or a direct chat. New messages are
   fetched every few seconds while it's open, and opening it marks
   everything read. Photos and files go through the same private
   document store as the rest of the ERP; the mic dictates into the box. */

const POLL_MS = 4000

export default function ChatThread() {
  const api = useApi()
  const { user } = useSession()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id: string; title?: string }>()
  const [ref, setRef] = useState(String(params.id))
  const [title, setTitle] = useState(params.title ?? 'Messages')
  const [kind, setKind] = useState<'team' | 'direct'>(String(params.id) === 'team' ? 'team' : 'direct')
  const [msgs, setMsgs] = useState<ChatMessage[] | null>(null)
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<ChatAttachment[]>([])
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null)
  const scroller = useRef<ScrollView>(null)
  const box = useRef<TextInput>(null)
  /* Builds without the speech module: the keyboard's own mic does it. */
  const [keyboardMic, setKeyboardMic] = useState(false)
  const latest = useRef<string | null>(null)
  const convId = useRef<string | null>(null)

  const voice = useVoice((heard) => setInput((v) => (v.trim() ? `${v.trim()} ${heard}` : heard)))

  const merge = useCallback((incoming: ChatMessage[]) => {
    if (!incoming.length) return
    setMsgs((cur) => {
      const have = new Map((cur ?? []).filter((m) => !m.pending).map((m) => [m.id, m]))
      for (const m of incoming) have.set(m.id, m)
      const pending = (cur ?? []).filter((m) => m.pending || m.failed)
      return [...have.values()].sort((a, b) => a.created_at.localeCompare(b.created_at)).concat(pending)
    })
    const last = incoming[incoming.length - 1].created_at
    if (!latest.current || last > latest.current) latest.current = last
  }, [])

  const markRead = useCallback(() => {
    if (convId.current) api.post(`/api/messages/${convId.current}`, { read: true }).catch(() => {})
  }, [api])

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ conversation: { id: string | null; kind: 'team' | 'direct'; title: string }; messages: ChatMessage[] }>(
        `/api/messages/${encodeURIComponent(ref)}`
      )
      convId.current = r.conversation.id
      setTitle(r.conversation.title)
      setKind(r.conversation.kind)
      setMsgs(r.messages)
      latest.current = r.messages.length ? r.messages[r.messages.length - 1].created_at : null
      setError(null)
      markRead()
    } catch (e) {
      setError((e as Error).message)
      setMsgs((m) => m ?? [])
    }
  }, [api, ref, markRead])

  const poll = useCallback(async () => {
    if (!convId.current) return
    try {
      const q = latest.current ? `?after=${encodeURIComponent(latest.current)}` : ''
      const r = await api.get<{ messages: ChatMessage[] }>(`/api/messages/${convId.current}${q}`)
      if (r.messages.length) {
        merge(r.messages)
        markRead()
      }
    } catch {
      /* next poll */
    }
  }, [api, merge, markRead])

  useFocusEffect(
    useCallback(() => {
      load()
      const t = setInterval(poll, POLL_MS)
      return () => clearInterval(t)
    }, [load, poll])
  )

  useEffect(() => {
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60)
  }, [msgs?.length])

  async function attach(picked: PickedFile[]) {
    if (!picked.length) return
    setUploading((n) => n + picked.length)
    for (const f of picked) {
      try {
        const d = await uploadDocument(api, f, { entity_type: 'general', entity_id: '', entity_label: 'Team chat', category: 'Other' })
        setFiles((all) => [...all, { id: d.id, name: d.name, mime: d.mime }])
      } catch (e) {
        setError(`${f.name}: ${(e as Error).message}`)
      } finally {
        setUploading((n) => n - 1)
      }
    }
  }

  async function send() {
    const body = input.trim()
    if ((!body && !files.length) || uploading) return
    if (voice.listening) voice.cancel()
    const tempId = `tmp-${Date.now()}`
    const draft: ChatMessage = {
      id: tempId,
      conversation_id: convId.current ?? '',
      author_id: user?.id ?? null,
      author_name: user?.name ?? 'You',
      body,
      attachments: files,
      entity_type: null,
      entity_id: null,
      entity_label: null,
      created_at: new Date().toISOString(),
      deleted_at: null,
      pending: true,
    }
    setMsgs((m) => [...(m ?? []), draft])
    setInput('')
    setFiles([])
    try {
      const r = await api.post<{ conversation_id: string; message: ChatMessage }>('/api/messages', { to: convId.current ?? ref, body, attachments: draft.attachments })
      if (!convId.current) {
        convId.current = r.conversation_id
        setRef(r.conversation_id)
      }
      setMsgs((m) => (m ?? []).filter((x) => x.id !== tempId))
      merge([r.message])
    } catch (e) {
      setMsgs((m) => (m ?? []).map((x) => (x.id === tempId ? { ...x, pending: false, failed: true } : x)))
      setError((e as Error).message)
    }
  }

  function retry(m: ChatMessage) {
    setMsgs((all) => (all ?? []).filter((x) => x.id !== m.id))
    setInput(m.body)
    setFiles(m.attachments)
  }

  function remove(m: ChatMessage) {
    if (m.author_id !== user?.id || m.pending || m.deleted_at || !convId.current) return
    Alert.alert('Delete this message?', 'It will show as “Message deleted” for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/api/messages/${convId.current}?message_id=${m.id}`)
            setMsgs((all) => (all ?? []).map((x) => (x.id === m.id ? { ...x, body: '', attachments: [], deleted_at: new Date().toISOString() } : x)))
          } catch (e) {
            setError((e as Error).message)
          }
        },
      },
    ])
  }

  async function openFile(a: ChatAttachment) {
    try {
      const { url } = await api.get<{ url: string }>(`/api/documents/${a.id}`)
      if (a.mime?.startsWith('image/')) setPreview({ url, name: a.name })
      else await Linking.openURL(url)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const canSend = (!!input.trim() || files.length > 0) && !uploading

  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView ref={scroller} contentContainerStyle={{ padding: space.md, paddingBottom: space.lg, gap: 4 }} keyboardShouldPersistTaps="handled">
          {msgs === null ? <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} /> : null}
          {msgs && msgs.length === 0 ? (
            <Text style={s.empty}>{kind === 'team' ? 'Say hello to the team. Everyone signed in to Bhumi sees messages here.' : `Start a conversation with ${title}.`}</Text>
          ) : null}
          {msgs?.map((m, i) => {
            const mine = m.author_id === user?.id
            const prev = msgs[i - 1]
            const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString()
            const showName = kind === 'team' && !mine && (newDay || prev?.author_id !== m.author_id)
            const rec = recordPath(m.entity_type, m.entity_id)
            return (
              <View key={m.id}>
                {newDay ? <Text style={s.day}>{dayLabel(m.created_at)}</Text> : null}
                <Pressable
                  onLongPress={() => remove(m)}
                  onPress={() => (m.failed ? retry(m) : undefined)}
                  style={[s.bubble, mine ? s.mine : s.theirs, showName ? { marginTop: 6 } : null, m.pending ? { opacity: 0.6 } : null]}
                >
                  {showName ? <Text style={s.author}>{m.author_name}</Text> : null}
                  {m.deleted_at ? (
                    <Text style={[s.deleted, mine && { color: colors.goldTint }]}>Message deleted</Text>
                  ) : (
                    <>
                      {m.attachments.map((a) => (
                        <TouchableOpacity key={a.id} style={[s.file, mine && s.fileMine]} onPress={() => openFile(a)}>
                          <Ionicons name={a.mime?.startsWith('image/') ? 'image-outline' : 'document-attach-outline'} size={16} color={mine ? colors.white : colors.navy} />
                          <Text style={[s.fileText, mine && { color: colors.white }]} numberOfLines={1}>
                            {a.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {m.body ? <Text style={[s.body, mine && { color: colors.white }]} selectable>{m.body}</Text> : null}
                      {rec && m.entity_label ? (
                        <TouchableOpacity style={[s.file, mine && s.fileMine]} onPress={() => router.push(rec as never)}>
                          <Ionicons name="link-outline" size={15} color={mine ? colors.white : colors.navy} />
                          <Text style={[s.fileText, mine && { color: colors.white }]} numberOfLines={1}>{m.entity_label}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </>
                  )}
                  <Text style={[s.time, mine && { color: colors.goldTint }]}>
                    {m.failed ? 'Not sent · tap to retry' : m.pending ? 'Sending…' : new Date(m.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </ScrollView>

        <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          {error ? (
            <TouchableOpacity onPress={() => setError(null)}>
              <Text style={s.error}>{error}</Text>
            </TouchableOpacity>
          ) : null}
          {keyboardMic && !voice.listening ? (
            <View style={s.listening}>
              <Ionicons name="mic" size={15} color={colors.goldDeep} />
              <Text style={s.listenText} numberOfLines={2}>Tap the 🎤 on your keyboard and speak, then send.</Text>
            </View>
          ) : null}
          {voice.listening || voice.error ? (
            <View style={s.listening}>
              {voice.listening ? <View style={s.liveDot} /> : <Ionicons name="alert-circle" size={15} color={colors.flagged} />}
              <Text style={[s.listenText, !voice.listening && { color: colors.flagged }]} numberOfLines={2}>
                {voice.listening ? voice.transcript || 'Listening… tap the mic again when you’re done.' : voice.error}
              </Text>
            </View>
          ) : null}
          {files.length || uploading ? (
            <View style={s.pendingRow}>
              {files.map((f) => (
                <TouchableOpacity key={f.id} style={s.chip} onPress={() => setFiles((all) => all.filter((x) => x.id !== f.id))}>
                  <Text style={s.chipText} numberOfLines={1}>📎 {f.name}  ✕</Text>
                </TouchableOpacity>
              ))}
              {uploading ? <Text style={s.chipText}>Uploading {uploading}…</Text> : null}
            </View>
          ) : null}
          <View style={s.row}>
            <TouchableOpacity style={s.icon} onPress={async () => attach(await pickFiles())} hitSlop={6} accessibilityLabel="Attach files">
              <Ionicons name="attach" size={22} color={colors.ink2} />
            </TouchableOpacity>
            {Platform.OS !== 'web' ? (
              <TouchableOpacity style={s.icon} onPress={async () => attach(await takePhoto())} hitSlop={6} accessibilityLabel="Take a photo">
                <Ionicons name="camera-outline" size={21} color={colors.ink2} />
              </TouchableOpacity>
            ) : null}
            <TextInput ref={box} style={s.input} value={input} onChangeText={(v) => (setInput(v), setKeyboardMic(false))} placeholder="Message" placeholderTextColor={colors.muted} multiline />
            {!canSend ? (
              <TouchableOpacity
                style={[s.send, voice.listening && { backgroundColor: colors.flagged }]}
                onPress={voice.listening ? voice.stop : voice.available ? voice.start : () => (setKeyboardMic(true), box.current?.focus())} accessibilityLabel={voice.listening ? 'Stop dictating' : 'Dictate'}>
                <Ionicons name={voice.listening ? 'stop' : 'mic'} size={voice.listening ? 16 : 20} color={colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[s.send, !canSend && { opacity: 0.4 }]} disabled={!canSend} onPress={send} accessibilityLabel="Send">
                <Ionicons name="arrow-up" size={19} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={s.modal} onPress={() => setPreview(null)}>
          {preview ? <Image source={{ uri: preview.url }} style={s.modalImg} resizeMode="contain" /> : null}
          <Text style={s.modalName}>{preview?.name}</Text>
          <TouchableOpacity style={s.modalBtn} onPress={() => preview && Linking.openURL(preview.url)}>
            <Ionicons name="open-outline" size={16} color={colors.white} />
            <Text style={s.modalBtnText}>Open full size</Text>
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </Screen>
  )
}

const s = StyleSheet.create({
  empty: { fontSize: text.sm, color: colors.muted, textAlign: 'center', marginTop: 40, paddingHorizontal: space.lg, lineHeight: 20 },
  day: { alignSelf: 'center', fontSize: text.xs, fontWeight: '700', color: colors.muted, backgroundColor: colors.white, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3, marginVertical: 10, overflow: 'hidden' },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 12, paddingTop: 7, paddingBottom: 5, marginVertical: 2, gap: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.navy, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.line },
  author: { fontSize: text.xs, fontWeight: '800', color: colors.goldDeep },
  body: { fontSize: text.base, lineHeight: 21, color: colors.ink },
  deleted: { fontSize: text.sm, fontStyle: 'italic', color: colors.muted },
  time: { alignSelf: 'flex-end', fontSize: 10, color: colors.muted },
  file: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.navyTint, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 },
  fileMine: { backgroundColor: 'rgba(255,255,255,0.14)' },
  fileText: { flexShrink: 1, fontSize: text.sm, fontWeight: '600', color: colors.navy },
  composer: { borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 10, paddingTop: 8 },
  error: { fontSize: text.xs, color: colors.flagged, fontWeight: '600', paddingHorizontal: 6, paddingBottom: 6 },
  listening: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, paddingBottom: 8 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.flagged },
  listenText: { flex: 1, fontSize: text.sm, color: colors.ink2 },
  pendingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  chip: { backgroundColor: colors.navyTint, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, maxWidth: 220 },
  chipText: { fontSize: text.xs, fontWeight: '700', color: colors.navy },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  icon: { width: 38, height: 40, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 40, maxHeight: 140, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, fontSize: text.base, color: colors.ink, borderRadius: 20, backgroundColor: colors.bg },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: space.lg, gap: 12 },
  modalImg: { width: '100%', height: '75%' },
  modalName: { color: colors.white, fontSize: text.sm, fontWeight: '600' },
  modalBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.base, paddingHorizontal: 14, paddingVertical: 9 },
  modalBtnText: { color: colors.white, fontWeight: '700' },
})
