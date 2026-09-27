'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowUp, CircleAlert, CircleCheck, ClipboardPaste, FileText, Loader2, Mic, MicOff, Paperclip, RotateCcw, Square, X, Zap } from 'lucide-react'
import { uploadDocument } from './documents'
import { WhatsAppImport } from './WhatsAppImport'

/* The ERP assistant. Type (or say) what happened or what you need:
   "Add a lead: Priya, 98450 12345, wants 2–4 acres near Devanahalli
   under 5 Cr", "Put Ramesh from Sobha Realty on the Budigere deal as
   buyer's agent at 25%", "Import the property register". It acts
   through the same /api routes as every screen, so what it does
   shows up everywhere, in the activity trail under your name.

   The browser keeps the conversation (the API is stateless) in
   localStorage, so a refresh doesn't lose it. */

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
  mime: string
}
interface Turn {
  role: 'user' | 'assistant'
  text: string
  steps?: Step[]
  files?: Attachment[]
  error?: string
  /** Free mode: a post read without AI, shown as a review card. */
  capture?: { source: string; photos: Attachment[] }
}

const STORE = 'bhumi.assistant.v1'
const SUGGESTIONS = [
  'What needs my attention today?',
  'Import the property register as draft listings',
  'Add a buyer lead: Priya Menon, 98450 12345, wants 2–4 acres near Devanahalli, budget 3–5 Cr, hot',
  'Save Ramesh Gowda of Sobha Realty (98860 11223) as an agent covering Devanahalli and Hoskote, usual share 25%',
  'Which agent commissions are due or unpaid?',
  'Show the hot leads with no follow-up booked',
]

function load(): { turns: Turn[]; messages: ApiMessage[] } {
  try {
    const raw = localStorage.getItem(STORE)
    if (raw) return JSON.parse(raw)
  } catch {
    /* private mode or cleared storage: start fresh */
  }
  return { turns: [], messages: [] }
}
function save(turns: Turn[], messages: ApiMessage[]) {
  try {
    localStorage.setItem(STORE, JSON.stringify({ turns, messages }))
  } catch {
    /* storage full or blocked: the chat still works for this visit */
  }
}

/** **bold**, `code`, bullet and numbered lists, paragraphs. */
function Rich({ text }: { text: string }) {
  const inline = (s: string, k: string) =>
    s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={k + i}>{part.slice(2, -2)}</strong>
      ) : part.startsWith('`') && part.endsWith('`') ? (
        <code key={k + i}>{part.slice(1, -1)}</code>
      ) : (
        part
      )
    )
  /* Group lines into paragraphs, headings and lists; a list can
     start straight under a sentence without a blank line. */
  const LI = /^\s*([-•*]|\d+[.)])\s+/
  const out: React.ReactNode[] = []
  let para: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  const flush = () => {
    const k = `b${out.length}`
    if (para.length) {
      out.push(
        <p key={k}>
          {para.map((l, li) => (
            <span key={li}>
              {li > 0 && <br />}
              {inline(l, `${k}-${li}-`)}
            </span>
          ))}
        </p>
      )
      para = []
    }
    if (list) {
      const items = list.items.map((l, li) => <li key={li}>{inline(l, `${k}l${li}-`)}</li>)
      out.push(list.ordered ? <ol key={k + 'l'}>{items}</ol> : <ul key={k + 'l'}>{items}</ul>)
      list = null
    }
  }
  for (const line of text.trim().split('\n')) {
    if (!line.trim()) {
      flush()
    } else if (LI.test(line)) {
      if (para.length) flush()
      const ordered = /^\s*\d/.test(line)
      if (list && list.ordered !== ordered) flush()
      list = list ?? { ordered, items: [] }
      list.items.push(line.replace(LI, ''))
    } else if (/^#{1,4}\s/.test(line)) {
      flush()
      out.push(<h4 key={`h${out.length}`}>{inline(line.replace(/^#{1,4}\s/, ''), `h${out.length}-`)}</h4>)
    } else {
      if (list) flush()
      para.push(line)
    }
  }
  flush()
  return <>{out}</>
}

type SpeechRec = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start(): void
  stop(): void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

export default function AssistantView() {
  const params = useSearchParams()
  const [turns, setTurns] = useState<Turn[]>([])
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(0)
  const [busy, setBusy] = useState(false)
  const [notConfigured, setNotConfigured] = useState<string | null>(null)
  /* Without an Anthropic key on the server this page is a free quick-capture
     tool: pasted or typed posts are read by the WhatsApp reader and shown
     as a review card (WhatsAppImport). null while checking. */
  const [ai, setAi] = useState<boolean | null>(null)
  useEffect(() => {
    fetch('/api/assistant')
      .then((r) => r.json())
      .then((j: { configured?: boolean }) => setAi(Boolean(j.configured)))
      .catch(() => setAi(false))
  }, [])
  const [listening, setListening] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const rec = useRef<SpeechRec | null>(null)
  /** The box holds dictated words, so the assistant is told to expect transcription slips. */
  const dictated = useRef(false)
  const end = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const s = load()
    setTurns(s.turns)
    setMessages(s.messages)
  }, [])

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns])

  const send = useCallback(
    async (text: string, attached: Attachment[] = [], opts: { shown?: string; source?: string } = {}) => {
      const words = text.trim()
      if ((!words && !attached.length) || busy) return
      const voice = dictated.current && !opts.shown
      dictated.current = false
      if (ai === false) {
        setTurns((all) => [...all, { role: 'user', text: opts.shown ?? words, files: attached }, { role: 'assistant', text: '', capture: { source: opts.source ?? words, photos: attached } }])
        setInput('')
        setFiles([])
        return
      }
      const note = attached.length
        ? `\n\n[Attached files — document ids for read_document / attach_document]\n${attached.map((f) => `- ${f.name} (${f.mime || 'file'}): ${f.id}`).join('\n')}`
        : ''
      const userMsg: ApiMessage = { role: 'user', content: (voice ? `[Voice] ${words}` : words || 'Here are some files.') + note }
      const history = [...messages, userMsg]
      const base: Turn[] = [...turns, { role: 'user', text: opts.shown ?? words, files: attached }, { role: 'assistant', text: '', steps: [] }]
      setTurns(base)
      setInput('')
      setFiles([])
      setBusy(true)

      const update = (fn: (t: Turn) => Turn) =>
        setTurns((all) => {
          const copy = [...all]
          copy[copy.length - 1] = fn(copy[copy.length - 1])
          return copy
        })

      const ctl = new AbortController()
      abort.current = ctl
      let finalMessages: ApiMessage[] | null = null
      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: ctl.signal,
        })
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}))
          if (j.error === 'not_configured') setNotConfigured(j.message)
          update((t) => ({ ...t, error: j.message ?? j.error ?? `The assistant is unavailable (${res.status}).` }))
          setTurns((all) => {
            save(all, messages)
            return all
          })
          return
        }
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let buf = ''
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          let cut
          while ((cut = buf.indexOf('\n\n')) >= 0) {
            const line = buf.slice(0, cut).replace(/^data: /, '')
            buf = buf.slice(cut + 2)
            if (!line) continue
            const e = JSON.parse(line)
            if (e.type === 'text') update((t) => ({ ...t, text: t.text + e.text }))
            else if (e.type === 'tool') update((t) => ({ ...t, steps: [...(t.steps ?? []), { id: e.id, label: 'Working…', running: true }] }))
            else if (e.type === 'step')
              update((t) => {
                const steps = [...(t.steps ?? [])]
                const at = steps.findIndex((s) => s.id === e.id)
                const s = { id: e.id, label: e.label, href: e.href, ok: e.ok }
                if (at >= 0) steps[at] = s
                else steps.push(s)
                return { ...t, steps }
              })
            else if (e.type === 'done') finalMessages = e.messages
            else if (e.type === 'error') {
              finalMessages = e.messages ?? null
              update((t) => ({ ...t, error: e.message }))
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') update((t) => ({ ...t, error: 'Stopped.' }))
        else update((t) => ({ ...t, error: (err as Error).message }))
      } finally {
        abort.current = null
        setBusy(false)
        update((t) => ({ ...t, steps: (t.steps ?? []).filter((s) => !s.running) }))
        /* A conversation must alternate cleanly; if the turn broke off
           mid-tool, keep the history as it was before this message. */
        const next = finalMessages ?? messages
        setMessages(next)
        setTurns((all) => {
          save(all, next)
          return all
        })
      }
    },
    [busy, messages, turns, ai]
  )

  // ⌘K → "Ask the assistant" arrives as ?q=
  useEffect(() => {
    const q = params.get('q')
    if (q && !started.current) {
      started.current = true
      setTimeout(() => send(q), 50)
    }
  }, [params, send])

  async function attach(list: FileList | null) {
    if (!list?.length) return
    const picked = Array.from(list)
    setUploading((n) => n + picked.length)
    for (const f of picked) {
      try {
        const d = await uploadDocument(f, { entity_type: 'general', entity_id: '', entity_label: 'Assistant upload', category: 'Other' })
        setFiles((all) => [...all, { id: d.id, name: d.name, mime: d.mime }])
      } catch (e) {
        setTurns((all) => [...all, { role: 'assistant', text: '', error: `${f.name}: ${(e as Error).message}` }])
      } finally {
        setUploading((n) => n - 1)
      }
    }
  }

  /** A WhatsApp message copied to the clipboard, filed as a listing or lead. */
  async function pasteWhatsApp() {
    let text = ''
    try {
      text = (await navigator.clipboard.readText()).trim()
    } catch {
      setTurns((all) => [...all, { role: 'assistant', text: '', error: 'The browser didn’t allow reading the clipboard. Paste the message into the box with Ctrl+V instead, then send.' }])
      return
    }
    if (!text) {
      setTurns((all) => [...all, { role: 'assistant', text: '', error: 'Nothing copied. Copy the WhatsApp message first (on WhatsApp Web: select it, then Ctrl+C).' }])
      return
    }
    const ask = files.length
      ? `File this in the ERP. The ${files.length === 1 ? 'file attached came' : `${files.length} files attached came`} with the message.`
      : 'File this in the ERP.'
    const shown = `📲 Forwarded from WhatsApp\n${text.length > 600 ? `${text.slice(0, 600)}…` : text}`
    send(['[Forwarded from WhatsApp]', text, '', ask].join('\n'), files, { shown, source: text })
  }

  function toggleMic() {
    if (listening) return rec.current?.stop()
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition
    if (!Ctor) {
      setTurns((all) => [...all, { role: 'assistant', text: '', error: 'Voice input isn’t supported in this browser. Try Chrome or Safari.' }])
      return
    }
    const r = new Ctor()
    r.lang = 'en-IN'
    r.interimResults = true
    r.continuous = false
    const before = input ? input.trimEnd() + ' ' : ''
    r.onresult = (e) => {
      const said = Array.from(e.results)
        .map((x) => x[0].transcript)
        .join('')
      dictated.current = true
      setInput(before + said)
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    rec.current = r
    setListening(true)
    r.start()
  }

  function reset() {
    abort.current?.abort()
    setTurns([])
    setMessages([])
    save([], [])
    box.current?.focus()
  }

  const empty = turns.length === 0
  return (
    <div className="erpPage erpChat">
      <div className="erpHead">
        <div>
          <h1>Assistant</h1>
          <p>Tell it what happened or what you need. It adds, links, files and updates records across the ERP, as you.</p>
        </div>
        {!empty && (
          <button type="button" className="erpBtn ghost" onClick={reset} disabled={busy}>
            <RotateCcw size={15} /> New chat
          </button>
        )}
      </div>

      {notConfigured && (
        <div className="erpBanner warn" role="status">
          <CircleAlert size={16} /> {notConfigured}
        </div>
      )}

      <div className="erpChat__log" aria-live="polite">
        {empty ? (
          <div className="erpChat__welcome">
            {ai === false ? (
              <div className="erpChat__free">
                <Zap size={16} /> Quick capture. Paste a WhatsApp property post, or type or dictate the details (“2 acres at Budigere, 3 crore an acre, owner Ravi 98450
                12345”). It fills in a draft listing or a lead for you to check and save. Attach photos first and they go on the listing.
              </div>
            ) : ai === true ? (
              <p>Try one of these, or type your own. You can attach deeds, RTCs, brochures or photos, and it will read them, fill in the listing and file each document.</p>
            ) : null}
            <div className="erpChat__suggest">
              <button type="button" className="is-wa" onClick={pasteWhatsApp}>
                <ClipboardPaste size={15} /> <b>Paste a WhatsApp message.</b> Copy a property post, then click here to file it as a draft listing or a lead.
              </button>
              {(ai === true ? SUGGESTIONS : []).map((s) => (
                <button key={s} type="button" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          turns.map((t, i) => (
            <div key={i} className={`erpChat__turn is-${t.role}`}>
              {t.role === 'user' ? (
                <div className="erpChat__bubble">
                  {t.text && <Rich text={t.text} />}
                  {t.files?.length ? (
                    <div className="erpChat__files">
                      {t.files.map((f) => (
                        <span key={f.id}>
                          <FileText size={13} /> {f.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="erpChat__reply">
                  {t.capture && <WhatsAppImport source={t.capture.source} photos={t.capture.photos} />}
                  {t.steps?.length ? (
                    <div className="erpChat__steps">
                      {t.steps.map((s) => {
                        const icon = s.running ? <Loader2 size={13} className="spin" /> : s.ok === false ? <CircleAlert size={13} /> : <CircleCheck size={13} />
                        const cls = `erpChat__step ${s.running ? 'is-running' : s.ok === false ? 'is-fail' : 'is-ok'}`
                        return s.href ? (
                          <Link key={s.id} href={s.href} className={cls}>
                            {icon} {s.label}
                          </Link>
                        ) : (
                          <span key={s.id} className={cls}>
                            {icon} {s.label}
                          </span>
                        )
                      })}
                    </div>
                  ) : null}
                  {t.text ? (
                    <div className="erpChat__text">
                      <Rich text={t.text} />
                    </div>
                  ) : busy && i === turns.length - 1 && !t.error && !t.capture ? (
                    <div className="erpChat__thinking">
                      <Loader2 size={14} className="spin" /> Thinking…
                    </div>
                  ) : null}
                  {t.error && (
                    <div className="erpChat__error">
                      <CircleAlert size={14} /> {t.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={end} />
      </div>

      <form
        className="erpChat__composer"
        onSubmit={(e) => {
          e.preventDefault()
          send(input, files)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          attach(e.dataTransfer.files)
        }}
      >
        {(files.length > 0 || uploading > 0) && (
          <div className="erpChat__pending">
            {files.map((f) => (
              <span key={f.id}>
                <FileText size={13} /> {f.name}
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((all) => all.filter((x) => x.id !== f.id))}>
                  <X size={12} />
                </button>
              </span>
            ))}
            {uploading > 0 && (
              <span>
                <Loader2 size={13} className="spin" /> Uploading {uploading}…
              </span>
            )}
          </div>
        )}
        <div className="erpChat__row">
          <input ref={fileInput} type="file" multiple hidden onChange={(e) => (attach(e.target.files), (e.target.value = ''))} />
          <button type="button" className="erpChat__icon" onClick={() => fileInput.current?.click()} aria-label="Attach files" title="Attach files">
            <Paperclip size={18} />
          </button>
          <textarea
            ref={box}
            rows={1}
            value={input}
            placeholder={listening ? 'Listening…' : 'Tell it what to do, or ask…'}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send(input, files)
              }
            }}
          />
          <button type="button" className="erpChat__icon" onClick={pasteWhatsApp} disabled={busy} aria-label="Paste a WhatsApp message" title="Paste a WhatsApp message">
            <ClipboardPaste size={18} />
          </button>
          <button type="button" className={`erpChat__icon ${listening ? 'is-on' : ''}`} onClick={toggleMic} aria-label={listening ? 'Stop listening' : 'Speak'} title="Speak">
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          {busy ? (
            <button type="button" className="erpChat__send" onClick={() => abort.current?.abort()} aria-label="Stop">
              <Square size={15} />
            </button>
          ) : (
            <button type="submit" className="erpChat__send" disabled={(!input.trim() && !files.length) || uploading > 0} aria-label="Send">
              <ArrowUp size={18} />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
