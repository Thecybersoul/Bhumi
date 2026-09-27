import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApi } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { API_URL } from '@/lib/config'
import { uploadDocument, type PickedFile } from '@/lib/documents'
import { colors, radius, space, text } from '@/lib/theme'
import { Screen } from '@/components/ui'
import { pickFiles, takePhoto } from '@/components/documents'
import { useVoice } from '@/lib/voice'
import { canPaste, readClipboard } from '@/lib/clipboard'
import { forwardedPrompt, takeShared } from '@/lib/shared'

/* The ERP assistant in the app — the twin of /admin/assistant on the
   web, over the same /api/assistant. Say what happened or what you
   need; it adds, links, files and updates records as you.

   The conversation is sent whole each turn (the API is stateless). On
   the iPhone web app it's kept in localStorage; in the native app it
   lives for as long as the app is open. Replies stream through XHR's
   progress events, which React Native delivers incrementally (its
   fetch can't stream a body).

   Three ways in besides typing: the mic (speak, and it sends when you
   stop), "Paste a WhatsApp message", and sharing a WhatsApp message or
   its photos to Bhumi from WhatsApp itself (Android). A forwarded
   message is marked for the assistant, which files it as a listing or
   a lead. */

type ApiMessage = { role: 'user' | 'assistant'; content: unknown }
interface Step {
  id: string
  label: string
  href?: string
  ok?: boolean
  running?: boolean
}
interface Attachment {
  id: string
  name: string
}
interface Turn {
  role: 'user' | 'assistant'
  text: string
  steps?: Step[]
  files?: Attachment[]
  error?: string
}

const STORE = 'bhumi.assistant.v1'
const PASTE = 'Paste a WhatsApp message'
const SUGGESTIONS = [
  'What needs my attention today?',
  'Which agent commissions are due or unpaid?',
  'Log a site visit tomorrow 11 am with Priya at P002',
  'Import the property register as draft listings',
]

let memory: { turns: Turn[]; messages: ApiMessage[] } = { turns: [], messages: [] }
function load() {
  if (Platform.OS === 'web') {
    try {
      const raw = globalThis.localStorage?.getItem(STORE)
      if (raw) return JSON.parse(raw) as typeof memory
    } catch {
      /* fresh start */
    }
  }
  return memory
}
function save(turns: Turn[], messages: ApiMessage[]) {
  memory = { turns, messages }
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(STORE, JSON.stringify(memory))
    } catch {
      /* storage full or blocked */
    }
  }
}

/** Web hrefs the server returns → app routes. */
function openHref(href?: string) {
  if (!href) return
  const m = href.match(/^\/admin\/(properties|deals\/leads|deals\/contacts|deals|meetings)\/([\w-]+)/)
  if (m) {
    const path = { properties: '/property/[id]', 'deals/leads': '/lead/[id]', 'deals/contacts': '/contact/[id]', deals: '/transaction/[id]', meetings: '/meeting/[id]' }[m[1]]
    if (path) return router.push({ pathname: path as never, params: { id: m[2] } } as never)
  }
  if (href.startsWith('/admin/properties')) return router.push('/properties')
  if (href.startsWith('/admin/notes-tasks')) return router.push('/notes-tasks')
  if (href.startsWith('/admin/dashboard')) return router.push('/')
}

/** **bold** and simple lists, as the web page renders them. */
function Rich({ value, color = colors.ink }: { value: string; color?: string }) {
  const lines = value.trim().split('\n')
  return (
    <View style={{ gap: 4 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <View key={i} style={{ height: 4 }} />
        const li = line.match(/^\s*([-•*]|\d+[.)])\s+(.*)$/)
        const body = (li ? li[2] : line.replace(/^#{1,4}\s/, '')).split(/(\*\*[^*]+\*\*)/g)
        return (
          <View key={i} style={{ flexDirection: 'row', gap: 6, paddingLeft: li ? 4 : 0 }}>
            {li ? <Text style={[s.text, { color }]}>{/\d/.test(li[1]) ? li[1] : '•'}</Text> : null}
            {/* flexShrink, not flex: 1 — inside the user's auto-width bubble,
                flex: 1 gave the text no width at all on Android. */}
            <Text style={[s.text, { color, flexShrink: 1 }, /^#{1,4}\s/.test(line) && { fontWeight: '800' }]}>
              {body.map((part, j) =>
                part.startsWith('**') && part.endsWith('**') ? (
                  <Text key={j} style={{ fontWeight: '800' }}>
                    {part.slice(2, -2)}
                  </Text>
                ) : (
                  part
                )
              )}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

export default function AssistantScreen() {
  const api = useApi()
  const { token } = useSession()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ q?: string; shared?: string }>()
  const [turns, setTurns] = useState<Turn[]>(() => load().turns)
  const [messages, setMessages] = useState<ApiMessage[]>(() => load().messages)
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(0)
  const [busy, setBusy] = useState(false)
  const scroller = useRef<ScrollView>(null)
  const box = useRef<TextInput>(null)
  /* Builds without the clipboard or speech module (APKs from before they
     were added) still get both: 'paste' waits for a long-press Paste into
     the box, 'dictate' for the keyboard's own mic. The next send is then
     marked as forwarded or spoken. */
  const [mode, setMode] = useState<null | 'paste' | 'dictate'>(null)
  const xhr = useRef<XMLHttpRequest | null>(null)
  const started = useRef(false)

  const update = (fn: (t: Turn) => Turn) =>
    setTurns((all) => {
      const copy = [...all]
      copy[copy.length - 1] = fn(copy[copy.length - 1])
      return copy
    })

  const send = useCallback(
    (words: string, attached: Attachment[] = [], opts: { voice?: boolean; shown?: string } = {}) => {
      const said = words.trim()
      if ((!said && !attached.length) || busy) return
      const note = attached.length
        ? `\n\n[Attached files — document ids for read_document / attach_document]\n${attached.map((f) => `- ${f.name}: ${f.id}`).join('\n')}`
        : ''
      const content = (opts.voice ? `[Voice] ${said}` : said || 'Here are some files.') + note
      const history = [...messages, { role: 'user' as const, content }]
      setTurns((all) => [...all, { role: 'user', text: opts.shown ?? (opts.voice ? `🎙 ${said}` : said), files: attached }, { role: 'assistant', text: '', steps: [] }])
      setInput('')
      setFiles([])
      setBusy(true)

      let seen = 0
      let final: ApiMessage[] | null = null
      const handle = (chunk: string) => {
        const e = JSON.parse(chunk)
        if (e.type === 'text') update((t) => ({ ...t, text: t.text + e.text }))
        else if (e.type === 'tool') update((t) => ({ ...t, steps: [...(t.steps ?? []), { id: e.id, label: 'Working…', running: true }] }))
        else if (e.type === 'step')
          update((t) => {
            const steps = [...(t.steps ?? [])]
            const at = steps.findIndex((x) => x.id === e.id)
            const step = { id: e.id, label: e.label, href: e.href, ok: e.ok }
            if (at >= 0) steps[at] = step
            else steps.push(step)
            return { ...t, steps }
          })
        else if (e.type === 'done') final = e.messages
        else if (e.type === 'error') {
          final = e.messages ?? null
          update((t) => ({ ...t, error: e.message }))
        }
      }
      const drain = (all: string) => {
        let cut
        while ((cut = all.indexOf('\n\n', seen)) >= 0) {
          const line = all.slice(seen, cut).replace(/^data: /, '')
          seen = cut + 2
          if (line) {
            try {
              handle(line)
            } catch {
              /* partial line; the next progress event completes it */
            }
          }
        }
      }
      const finish = () => {
        xhr.current = null
        setBusy(false)
        const next = final ?? messages
        setMessages(next)
        setTurns((all) => {
          const copy = [...all]
          const last = copy[copy.length - 1]
          copy[copy.length - 1] = { ...last, steps: (last.steps ?? []).filter((x) => !x.running) }
          save(copy, next)
          return copy
        })
      }

      const r = new XMLHttpRequest()
      xhr.current = r
      r.open('POST', `${API_URL}/api/assistant`)
      r.setRequestHeader('Content-Type', 'application/json')
      if (token) r.setRequestHeader('Authorization', `Bearer ${token}`)
      r.onprogress = () => drain(r.responseText)
      r.onload = () => {
        if (r.status >= 400) {
          let msg = `The assistant is unavailable (${r.status}).`
          try {
            const j = JSON.parse(r.responseText)
            msg = j.message ?? j.error ?? msg
          } catch {
            /* keep the generic message */
          }
          update((t) => ({ ...t, error: msg }))
        } else drain(r.responseText + '\n\n')
        finish()
      }
      r.onerror = () => {
        update((t) => ({ ...t, error: 'Network error. Check your connection and try again.' }))
        finish()
      }
      r.onabort = () => {
        update((t) => ({ ...t, error: 'Stopped.' }))
        finish()
      }
      r.send(JSON.stringify({ messages: history }))
    },
    [busy, messages, token]
  )

  const voice = useVoice((heard) => send(heard, files, { voice: true }))

  async function uploadAll(picked: PickedFile[]): Promise<Attachment[]> {
    const out: Attachment[] = []
    setUploading((n) => n + picked.length)
    for (const f of picked) {
      try {
        const d = await uploadDocument(api, f, { entity_type: 'general', entity_id: '', entity_label: 'Assistant upload', category: 'Other' })
        out.push({ id: d.id, name: d.name })
      } catch (e) {
        setTurns((all) => [...all, { role: 'assistant', text: '', error: `${f.name}: ${(e as Error).message}` }])
      } finally {
        setUploading((n) => n - 1)
      }
    }
    return out
  }

  /** A WhatsApp message (and its photos) handed to the assistant to file. */
  async function forward(textIn: string, photos: PickedFile[] = []) {
    const text = textIn.trim()
    if (!text && !photos.length) return
    const attached = photos.length ? await uploadAll(photos) : []
    const shown = `📲 Forwarded from WhatsApp${text ? `\n${text.length > 600 ? `${text.slice(0, 600)}…` : text}` : ''}`
    send(forwardedPrompt(text, attached.length), attached, { shown })
  }

  function pasteByHand() {
    setMode('paste')
    setTimeout(() => box.current?.focus(), 50)
  }

  function startVoice() {
    if (voice.available) return voice.start()
    setMode('dictate')
    setTimeout(() => box.current?.focus(), 50)
  }

  /** Send the box, as a forwarded message or a spoken one when in that mode. */
  function submit() {
    const was = mode
    setMode(null)
    if (was === 'paste') {
      const text = input
      setInput('')
      return forward(text, [])
    }
    send(input, files, was === 'dictate' ? { voice: true } : {})
  }

  async function paste() {
    if (!canPaste()) return pasteByHand()
    try {
      const text = await readClipboard()
      if (!text.trim()) {
        setTurns((all) => [...all, { role: 'assistant', text: '', error: 'Nothing copied. In WhatsApp, long-press the message, tap Copy, then come back and tap Paste.' }])
        return
      }
      forward(text)
    } catch {
      pasteByHand()
    }
  }

  // Shared from WhatsApp (Android): the root layout parks it, we take it once.
  useEffect(() => {
    if (!params.shared) return
    const got = takeShared()
    if (got) forward(got.text, got.files.filter((f) => f.mime.startsWith('image/') || f.mime === 'application/pdf'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.shared])

  // Search's "Ask the assistant" arrives as ?q=
  useEffect(() => {
    if (params.q && !started.current) {
      started.current = true
      send(params.q)
    }
  }, [params.q, send])

  useEffect(() => {
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50)
  }, [turns])

  async function attach(picked: PickedFile[]) {
    if (!picked.length) return
    const done = await uploadAll(picked)
    setFiles((all) => [...all, ...done])
  }

  function reset() {
    xhr.current?.abort()
    setTurns([])
    setMessages([])
    save([], [])
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: 'Assistant',
          headerRight: () =>
            turns.length ? (
              <TouchableOpacity onPress={reset} hitSlop={10} style={{ marginRight: 12 }} disabled={busy}>
                <Text style={{ color: colors.white, fontWeight: '700' }}>New chat</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView ref={scroller} contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl, gap: 14 }} keyboardShouldPersistTaps="handled">
          {turns.length === 0 ? (
            <View>
              <Text style={s.intro}>
                Tell it what happened or what you need. It adds listings, leads, deals, contacts and agents, links people with their share, books visits, and files
                documents — as you, in the activity trail.
              </Text>
              <TouchableOpacity style={[s.suggest, s.suggestWa]} onPress={paste}>
                <Ionicons name="logo-whatsapp" size={17} color={colors.verified} />
                <View style={{ flex: 1 }}>
                  <Text style={s.suggestText}>{PASTE}</Text>
                  <Text style={s.suggestSub}>Copy a property post in WhatsApp, then tap here. It becomes a draft listing or a lead.</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={s.suggest} onPress={startVoice}>
                <Ionicons name="mic-outline" size={16} color={colors.goldDeep} />
                <View style={{ flex: 1 }}>
                  <Text style={s.suggestText}>Speak instead of typing</Text>
                  <Text style={s.suggestSub}>Tap the mic, say what happened, then send.</Text>
                </View>
              </TouchableOpacity>
              {SUGGESTIONS.map((x) => (
                <TouchableOpacity key={x} style={s.suggest} onPress={() => send(x)}>
                  <Ionicons name="sparkles-outline" size={15} color={colors.goldDeep} />
                  <Text style={s.suggestText}>{x}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            turns.map((t, i) =>
              t.role === 'user' ? (
                <View key={i} style={s.bubble}>
                  {t.text ? <Rich value={t.text} color={colors.white} /> : null}
                  {t.files?.length ? <Text style={s.fileNote}>📎 {t.files.map((f) => f.name).join(', ')}</Text> : null}
                </View>
              ) : (
                <View key={i} style={{ gap: 8 }}>
                  {t.steps?.length ? (
                    <View style={s.steps}>
                      {t.steps.map((st) => (
                        <TouchableOpacity
                          key={st.id}
                          disabled={!st.href}
                          onPress={() => openHref(st.href)}
                          style={[s.step, st.running ? null : st.ok === false ? s.stepFail : s.stepOk]}
                        >
                          {st.running ? (
                            <ActivityIndicator size="small" color={colors.muted} />
                          ) : (
                            <Ionicons name={st.ok === false ? 'alert-circle' : 'checkmark-circle'} size={13} color={st.ok === false ? colors.flagged : colors.verified} />
                          )}
                          <Text style={[s.stepText, { color: st.running ? colors.muted : st.ok === false ? colors.flagged : colors.verified }]}>{st.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                  {t.text ? <Rich value={t.text} /> : busy && i === turns.length - 1 && !t.error ? <Text style={s.thinking}>Thinking…</Text> : null}
                  {t.error ? <Text style={s.error}>{t.error}</Text> : null}
                </View>
              )
            )
          )}
        </ScrollView>

        <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          {files.length || uploading ? (
            <View style={s.pending}>
              {files.map((f) => (
                <TouchableOpacity key={f.id} style={s.pendingChip} onPress={() => setFiles((all) => all.filter((x) => x.id !== f.id))}>
                  <Text style={s.pendingText} numberOfLines={1}>📎 {f.name}  ✕</Text>
                </TouchableOpacity>
              ))}
              {uploading ? <Text style={s.pendingText}>Uploading {uploading}…</Text> : null}
            </View>
          ) : null}
          {mode ? (
            <View style={s.listening}>
              <Ionicons name={mode === 'paste' ? 'logo-whatsapp' : 'mic'} size={16} color={mode === 'paste' ? colors.verified : colors.goldDeep} />
              <Text style={s.listenText}>
                {mode === 'paste'
                  ? 'Long-press the box below and tap Paste, then send. It will be filed as a WhatsApp message.'
                  : 'Tap the 🎤 on your keyboard and speak, then send.'}
              </Text>
              <TouchableOpacity onPress={() => setMode(null)} hitSlop={8}>
                <Text style={s.listenCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {voice.listening || voice.error ? (
            <View style={s.listening}>
              {voice.listening ? <View style={s.liveDot} /> : <Ionicons name="alert-circle" size={15} color={colors.flagged} />}
              <Text style={[s.listenText, voice.error && !voice.listening ? { color: colors.flagged } : null]} numberOfLines={3}>
                {voice.listening ? voice.transcript || 'Listening… say what happened, then tap the arrow to send.' : voice.error}
              </Text>
              {voice.listening ? (
                <TouchableOpacity onPress={voice.cancel} hitSlop={8}>
                  <Text style={s.listenCancel}>Cancel</Text>
                </TouchableOpacity>
              ) : null}
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
            <TouchableOpacity style={s.icon} onPress={paste} hitSlop={6} accessibilityLabel="Paste a WhatsApp message" disabled={busy}>
              <Ionicons name="logo-whatsapp" size={20} color={colors.verified} />
            </TouchableOpacity>
            <TextInput
              ref={box}
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder={mode === 'paste' ? 'Paste the WhatsApp message here' : mode === 'dictate' ? 'Speak with your keyboard’s mic…' : 'Tell it what to do, or ask…'}
              placeholderTextColor={colors.muted}
              multiline
            />
            {busy ? (
              <TouchableOpacity style={s.send} onPress={() => xhr.current?.abort()} accessibilityLabel="Stop">
                <Ionicons name="stop" size={16} color={colors.white} />
              </TouchableOpacity>
            ) : !input.trim() && !files.length && !uploading && mode !== 'dictate' ? (
              <TouchableOpacity
                style={[s.send, voice.listening && s.sendLive]}
                onPress={voice.listening ? voice.stop : startVoice}
                accessibilityLabel={voice.listening ? 'Stop and send' : 'Speak'}
              >
                <Ionicons name={voice.listening ? 'arrow-up' : 'mic'} size={voice.listening ? 19 : 20} color={colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[s.send, (!input.trim() && !files.length) || uploading ? { opacity: 0.4 } : null]} disabled={(!input.trim() && !files.length) || uploading > 0} onPress={submit} accessibilityLabel="Send">
                <Ionicons name="arrow-up" size={19} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const s = StyleSheet.create({
  intro: { fontSize: text.base, color: colors.ink2, lineHeight: 22, marginBottom: space.md },
  suggest: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: radius.base, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, marginBottom: 8 },
  suggestText: { flex: 1, fontSize: text.sm, color: colors.navy, fontWeight: '600' },
  suggestSub: { fontSize: text.xs, color: colors.muted, marginTop: 2, lineHeight: 16 },
  suggestWa: { borderColor: colors.verifiedBg, backgroundColor: colors.verifiedBg },
  listening: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, paddingBottom: 8 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.flagged },
  listenText: { flex: 1, fontSize: text.sm, color: colors.ink2 },
  listenCancel: { fontSize: text.sm, fontWeight: '700', color: colors.muted },
  sendLive: { backgroundColor: colors.flagged },
  bubble: { alignSelf: 'flex-end', maxWidth: '86%', backgroundColor: colors.navy, borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 13, paddingVertical: 9 },
  fileNote: { fontSize: text.xs, color: colors.goldTint, marginTop: 4 },
  text: { fontSize: text.base, lineHeight: 22, color: colors.ink },
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, maxWidth: '100%' },
  stepOk: { backgroundColor: colors.verifiedBg, borderColor: colors.verifiedBg },
  stepFail: { backgroundColor: colors.flaggedBg, borderColor: colors.flaggedBg },
  stepText: { fontSize: text.xs, fontWeight: '700', flexShrink: 1 },
  thinking: { fontSize: text.sm, color: colors.muted },
  error: { fontSize: text.sm, color: colors.flagged, fontWeight: '600' },
  composer: { borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 10, paddingTop: 8 },
  pending: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  pendingChip: { backgroundColor: colors.navyTint, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, maxWidth: 220 },
  pendingText: { fontSize: text.xs, fontWeight: '700', color: colors.navy },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  icon: { width: 38, height: 40, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 40, maxHeight: 140, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, fontSize: text.base, color: colors.ink, borderRadius: 20, backgroundColor: colors.bg },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
})
