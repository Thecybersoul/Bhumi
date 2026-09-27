import { NextRequest, NextResponse } from 'next/server'
import { userForConnector } from '@/lib/connector'
import { createSessionToken } from '@/lib/session'
import { erpCaller } from '@/lib/erp-call'
import { documentBytes, publishImage } from '@/lib/document-files'
import { SYSTEM_PROMPT, contextBlock } from '@/lib/assistant/prompt'
import { TOOLS, runTool, validateInput, type ToolContext } from '@/lib/assistant/tools'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/* ═══════════════════════════════════════════════════════════
   The Claude connector: a Model Context Protocol server, so a person's
   own Claude (claude.ai, the Claude mobile and desktop apps, on their own
   subscription) can work in the ERP. Added in Claude as a custom
   connector with the URL from Profile → Claude connector.

   Streamable HTTP, stateless: every request is a JSON-RPC message (or a
   batch) POSTed here and answered with JSON. The tools are the in-app
   assistant's own (lib/assistant/tools.ts), run the same way: each one
   calls the ERP's /api routes as the person the link belongs to, so
   validation, Drive folders and the activity trail are identical.
   ═══════════════════════════════════════════════════════════ */

const SUPPORTED = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']
const READ_ONLY = new Set(['search', 'list_records', 'get_record', 'dashboard', 'read_document', 'find_matches', 'suggest_agents'])

type Rpc = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: Record<string, unknown> }
type McpContent = { type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string } | { type: 'resource'; resource: { uri: string; mimeType: string; blob: string } }

const ok = (id: Rpc['id'], result: unknown) => ({ jsonrpc: '2.0' as const, id: id ?? null, result })
const fail = (id: Rpc['id'], code: number, message: string) => ({ jsonrpc: '2.0' as const, id: id ?? null, error: { code, message } })

/** Anthropic-style tool result blocks → MCP content. */
function toMcp(content: unknown): McpContent[] {
  if (typeof content === 'string') return [{ type: 'text', text: content }]
  const out: McpContent[] = []
  for (const b of (content as Record<string, unknown>[]) ?? []) {
    const src = b.source as Record<string, string> | undefined
    if (b.type === 'text') out.push({ type: 'text', text: String(b.text ?? '') })
    else if (b.type === 'image' && src?.type === 'base64') out.push({ type: 'image', data: src.data, mimeType: src.media_type })
    else if (b.type === 'document' && src?.type === 'base64') out.push({ type: 'resource', resource: { uri: `bhumi://document/${String(b.title ?? 'file')}`, mimeType: src.media_type, blob: src.data } })
  }
  return out.length ? out : [{ type: 'text', text: 'Done.' }]
}

/** read_document for Claude apps: the file itself, inline (no Files API). */
const readInline: ToolContext['readDocument'] = async (id) => {
  const got = await documentBytes(id)
  if ('error' in got) return got
  const { doc, bytes } = got
  const mime = (doc.mime || '').toLowerCase()
  const note = `Document: ${doc.name} (id ${doc.id}, category ${doc.category || 'Other'}, filed on ${doc.entity_label || doc.entity_type})`
  if (bytes.length > 15 * 1024 * 1024) return { error: `${doc.name} is over 15 MB, too large to open here.` }
  if (mime.startsWith('text/')) return { note, blocks: [{ type: 'text', text: bytes.toString('utf8').slice(0, 100_000) }] }
  if (/^image\/(jpeg|png|gif|webp)$/.test(mime)) return { note, blocks: [{ type: 'image', source: { type: 'base64', media_type: mime as 'image/jpeg', data: bytes.toString('base64') } }] }
  if (mime === 'application/pdf' || /\.pdf$/i.test(doc.name)) {
    return { note, blocks: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: bytes.toString('base64') }, title: doc.name }] as never }
  }
  return { error: `${doc.name} is ${mime || 'an unknown type'}; only PDFs, images and text can be read.` }
}

type Ctx = { params: Promise<{ token: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  const { token } = await params
  const user = await userForConnector(token)
  if (!user) return NextResponse.json(fail(null, -32001, 'This connector link is not valid or has been revoked. Make a new one in Bhumi → Profile → Claude connector.'), { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json(fail(null, -32700, 'Parse error'), { status: 400 })
  const batch = Array.isArray(body) ? (body as Rpc[]) : [body as Rpc]

  // The ERP's routes, called as this person with a short-lived session.
  const bearer = await createSessionToken(user.id, 15 * 60)
  const ctx: ToolContext = {
    call: erpCaller(req.nextUrl.origin, { authorization: bearer ? `Bearer ${bearer}` : null }),
    readDocument: readInline,
    publishImage,
  }

  const answers = []
  for (const m of batch) {
    const isNotification = m.id === undefined || m.id === null
    try {
      switch (m.method) {
        case 'initialize': {
          const asked = String(m.params?.protocolVersion ?? '')
          answers.push(
            ok(m.id, {
              protocolVersion: SUPPORTED.includes(asked) ? asked : SUPPORTED[1],
              capabilities: { tools: { listChanged: false } },
              serverInfo: { name: 'bhumi-erp', title: 'Bhumi Estates ERP', version: '1.0.0' },
              instructions: `${SYSTEM_PROMPT}\n\nYou are working through the Bhumi ERP connector inside the person's own Claude app. ${contextBlock(user)} Everything you do through these tools is recorded under ${user.name}'s name. When they paste or forward a WhatsApp property post, treat it as described under "Forwarded WhatsApp messages". Photos they attach in this chat can't be passed to the ERP; ask them to add photos from the Bhumi app.`,
            })
          )
          break
        }
        case 'notifications/initialized':
        case 'notifications/cancelled':
          break
        case 'ping':
          answers.push(ok(m.id, {}))
          break
        case 'tools/list':
          answers.push(
            ok(m.id, {
              tools: TOOLS.map((t) => ({
                name: t.name,
                title: t.name.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
                description: t.description,
                inputSchema: t.input_schema,
                annotations: { readOnlyHint: READ_ONLY.has(t.name), destructiveHint: t.name === 'delete_record', openWorldHint: false },
              })),
            })
          )
          break
        case 'tools/call': {
          const name = String(m.params?.name ?? '')
          const input = (m.params?.arguments ?? {}) as Record<string, unknown>
          const invalid = validateInput(name, input)
          if (invalid) {
            answers.push(ok(m.id, { content: [{ type: 'text', text: invalid }], isError: true }))
            break
          }
          const outcome = await runTool(name, input, ctx)
          const content = toMcp(outcome.content)
          if (outcome.step?.label) content.unshift({ type: 'text', text: `${outcome.step.ok ? '✓' : '✗'} ${outcome.step.label}` })
          answers.push(ok(m.id, { content, isError: Boolean(outcome.isError || outcome.step?.ok === false) }))
          break
        }
        default:
          if (!isNotification) answers.push(fail(m.id, -32601, `Method not found: ${m.method}`))
      }
    } catch (e) {
      if (!isNotification) answers.push(fail(m.id, -32603, (e as Error).message))
    }
  }

  // Only notifications: acknowledged without a body.
  if (!answers.length) return new NextResponse(null, { status: 202 })
  return NextResponse.json(Array.isArray(body) ? answers : answers[0])
}

/* No server-initiated stream: a stateless server answers every request
   in its POST response. */
export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } })
}

export function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } })
}
