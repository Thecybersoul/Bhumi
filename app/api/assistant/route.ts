import { NextRequest, NextResponse } from 'next/server'
import Anthropic, { toFile } from '@anthropic-ai/sdk'
import { currentUser } from '@/lib/auth'
import { documentBytes, publishImage } from '@/lib/document-files'
import { SYSTEM_PROMPT, contextBlock } from '@/lib/assistant/prompt'
import { TOOLS, runTool, validateInput, type ToolContext } from '@/lib/assistant/tools'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

type Msg = Anthropic.Beta.Messages.BetaMessageParam
type ToolResult = Anthropic.Beta.Messages.BetaToolResultBlockParam

const MODEL = 'claude-opus-5'
/** Tool rounds per request; a long job resumes on the next message. */
const MAX_ROUNDS = 24

/* POST /api/assistant  { messages }  →  text/event-stream

   The browser keeps the conversation and sends it whole each turn
   (the Messages API is stateless). Events, one JSON object per
   `data:` line:
     { type: 'text', text }                    streamed reply text
     { type: 'tool', id, name }                a tool call started
     { type: 'step', id, label, href?, ok }    what it did
     { type: 'done', messages }                the updated conversation
     { type: 'error', message }                                       */
/* GET /api/assistant → { configured }. The app and the web use it to
   choose between the AI assistant and the free quick-capture mode
   (WhatsApp posts and dictation read by lib/whatsapp/parse.ts). */
export async function GET() {
  const me = await currentUser()
  if (!me) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  return NextResponse.json({ configured: Boolean(process.env.ANTHROPIC_API_KEY) })
}

export async function POST(req: NextRequest) {
  const me = await currentUser()
  if (!me) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'not_configured', message: 'The assistant needs ANTHROPIC_API_KEY set on the server (Vercel → Settings → Environment Variables).' },
      { status: 503 }
    )
  }

  const body = (await req.json().catch(() => null)) as { messages?: Msg[] } | null
  const messages = Array.isArray(body?.messages) ? [...body.messages] : []
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Send the conversation ending with a user message.' }, { status: 400 })
  }

  const client = new Anthropic()

  /* Tools call the ERP's own routes as this person. */
  const origin = req.nextUrl.origin
  const auth: Record<string, string> = {}
  const cookie = req.headers.get('cookie')
  const bearer = req.headers.get('authorization')
  if (cookie) auth.cookie = cookie
  if (bearer) auth.authorization = bearer

  const fileIds = new Map<string, string>()
  const ctx: ToolContext = {
    async call(method, path, payload) {
      const res = await fetch(`${origin}${path}`, {
        method,
        headers: { ...auth, ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        body: payload !== undefined ? JSON.stringify(payload) : undefined,
        cache: 'no-store',
      })
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
      return { status: res.status, json }
    },
    readDocument: (id) => readDocument(client, id, fileIds),
    publishImage: (id) => publishImage(id),
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: Record<string, unknown>) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`))
      try {
        for (let round = 0; round < MAX_ROUNDS; round++) {
          const s = client.beta.messages.stream({
            model: MODEL,
            max_tokens: 16000,
            thinking: { type: 'adaptive' },
            system: [
              { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
              { type: 'text', text: contextBlock(me) },
            ],
            tools: TOOLS,
            messages,
            // A declined request is retried on Anthropic's recommended
            // fallback model inside the same call.
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
          })

          for await (const event of s) {
            if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
              send({ type: 'tool', id: event.content_block.id, name: event.content_block.name })
            } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              send({ type: 'text', text: event.delta.text })
            }
          }
          const msg = await s.finalMessage()
          // Checked before the content is used or kept: a declined turn
          // (after the fallback model also declined) stays out of the
          // history so the next message starts clean.
          if (msg.stop_reason === 'refusal') {
            send({ type: 'text', text: '\n\nI can’t help with that request.' })
            break
          }
          messages.push({ role: 'assistant', content: msg.content as Msg['content'] })
          if (msg.stop_reason === 'pause_turn') continue

          const uses = msg.content.filter((b): b is Anthropic.Beta.Messages.BetaToolUseBlock => b.type === 'tool_use')
          if (msg.stop_reason === 'max_tokens') {
            // A tool call cut off mid-input must not run; answer it so
            // the conversation stays valid, and let the model retry.
            if (!uses.length) break
            messages.push({
              role: 'user',
              content: uses.map((u) => ({
                type: 'tool_result' as const,
                tool_use_id: u.id,
                is_error: true,
                content: 'The input was cut off before it finished. Retry with a shorter input.',
              })),
            })
            continue
          }
          if (msg.stop_reason !== 'tool_use' || !uses.length) break

          const results: ToolResult[] = await Promise.all(
            uses.map(async (u): Promise<ToolResult> => {
              const input = (u.input ?? {}) as Record<string, unknown>
              const invalid = validateInput(u.name, input)
              if (invalid) {
                send({ type: 'step', id: u.id, label: `${u.name}: ${invalid}`, ok: false })
                return { type: 'tool_result', tool_use_id: u.id, is_error: true, content: `INVALID_INPUT: ${invalid}` }
              }
              try {
                const out = await runTool(u.name, input, ctx)
                send({ type: 'step', id: u.id, ...out.step })
                return { type: 'tool_result', tool_use_id: u.id, content: out.content, ...(out.isError ? { is_error: true } : {}) }
              } catch (e) {
                send({ type: 'step', id: u.id, label: `${u.name} failed`, ok: false })
                return { type: 'tool_result', tool_use_id: u.id, is_error: true, content: `Error: ${(e as Error).message}` }
              }
            })
          )
          messages.push({ role: 'user', content: results })
        }
        send({ type: 'done', messages })
      } catch (e) {
        const err = e as Error & { status?: number }
        const message =
          err instanceof Anthropic.AuthenticationError
            ? 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.'
            : err instanceof Anthropic.RateLimitError
              ? 'The assistant is busy right now (rate limited). Try again in a minute.'
              : err.message
        send({ type: 'error', message, messages })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' },
  })
}

/* A stored document handed to Claude: uploaded once to the Files API
   (kept seven days) so the conversation carries a file id, not the
   bytes. PDFs and images are read natively; plain text inline. */
async function readDocument(
  client: Anthropic,
  id: string,
  cache: Map<string, string>
): ReturnType<ToolContext['readDocument']> {
  const got = await documentBytes(id)
  if ('error' in got) return got
  const { doc, bytes } = got

  const mime = (doc.mime || '').toLowerCase()
  const kind = mime === 'application/pdf' || /\.pdf$/i.test(doc.name) ? 'pdf' : /^image\/(jpeg|png|gif|webp)$/.test(mime) ? 'image' : mime.startsWith('text/') ? 'text' : null
  if (!kind) return { error: `${doc.name} is ${mime || 'an unknown type'}; only PDFs, images (JPEG, PNG, GIF, WebP) and text can be read. Ask for a PDF or photo.` }

  const note = `Document: ${doc.name} (id ${doc.id}, category ${doc.category || 'Other'}, filed on ${doc.entity_label || doc.entity_type})`
  if (kind === 'text') return { note, blocks: [{ type: 'text', text: bytes.toString('utf8').slice(0, 100_000) }] }

  let fileId = cache.get(id)
  if (!fileId) {
    const up = await client.files.upload({
      file: await toFile(bytes, doc.name, { type: kind === 'pdf' ? 'application/pdf' : mime }),
      expires_in_seconds: 7 * 24 * 3600,
    })
    fileId = up.id
    cache.set(id, fileId)
  }
  return {
    note,
    blocks:
      kind === 'pdf'
        ? [{ type: 'document', source: { type: 'file', file_id: fileId }, title: doc.name }]
        : [{ type: 'image', source: { type: 'file', file_id: fileId } }],
  }
}
