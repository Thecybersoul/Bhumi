import { NextRequest, NextResponse, after } from 'next/server'
import { currentUser } from '@/lib/auth'
import { ChatError, chatReady, conversationsFor, inboxSince, preview, recipients, resolveConversation, sendMessage } from '@/lib/messages'

export const dynamic = 'force-dynamic'

/* Team messages (lib/messages.ts).
     GET                    { conversations, unread }  the team room and each teammate
     GET  ?since=ISO        { messages }  new messages to me since then (background check)
     POST { to, body, attachments?, entity_type?, entity_id?, entity_label? }
                            send; `to` is 'team', 'user:<id>' or a conversation id */

async function guard() {
  const me = await currentUser()
  if (!me) return { error: NextResponse.json({ error: 'Not authorised' }, { status: 401 }) }
  if (me.id === 'env') return { error: NextResponse.json({ error: 'Messages need a named account.' }, { status: 400 }) }
  if (!(await chatReady())) return { error: NextResponse.json({ error: 'Messages need a database update: open Setup and apply pending updates.', code: 'migration' }, { status: 503 }) }
  return { me }
}

const fail = (e: unknown) =>
  NextResponse.json({ error: (e as Error).message }, { status: e instanceof ChatError ? e.status : 500 })

export async function GET(req: NextRequest) {
  const g = await guard()
  if (g.error) return g.error
  try {
    const since = req.nextUrl.searchParams.get('since')
    if (since) return NextResponse.json({ messages: await inboxSince(g.me, since) })
    return NextResponse.json(await conversationsFor(g.me))
  } catch (e) {
    return fail(e)
  }
}

export async function POST(req: NextRequest) {
  const g = await guard()
  if (g.error) return g.error
  const body = await req.json().catch(() => null)
  if (!body?.to) return NextResponse.json({ error: 'Say who the message is for.' }, { status: 400 })
  try {
    const conv = await resolveConversation(g.me, String(body.to))
    const msg = await sendMessage(g.me, conv, body)
    after(async () => {
      const to = await recipients(conv, g.me.id)
      const { pushMessage } = await import('@/lib/webpush')
      await pushMessage(
        to.map((u) => u.id),
        {
          title: conv.kind === 'team' ? `${g.me.name} · ${conv.title || 'Bhumi team'}` : g.me.name,
          body: preview(msg) || 'New message',
          path: `/chat/${conv.id}`,
          tag: `chat-${conv.id}`,
        },
      )
    })
    return NextResponse.json({ ok: true, conversation_id: conv.id, message: msg })
  } catch (e) {
    return fail(e)
  }
}
