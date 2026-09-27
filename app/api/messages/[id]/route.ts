import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { listUsers } from '@/lib/users'
import { ChatError, chatReady, deleteMessage, markRead, messagesIn, resolveConversation } from '@/lib/messages'

export const dynamic = 'force-dynamic'

/* One conversation. `id` is a conversation id, 'team', or 'user:<id>'.
     GET    ?after=ISO | ?before=ISO   { conversation, members, messages }
                                       (no after/before: the latest page)
     POST   { read: true }             mark everything up to now read
     DELETE ?message_id=               delete one of your own messages   */

type Ctx = { params: Promise<{ id: string }> }

async function guard() {
  const me = await currentUser()
  if (!me) return { error: NextResponse.json({ error: 'Not authorised' }, { status: 401 }) }
  if (me.id === 'env') return { error: NextResponse.json({ error: 'Messages need a named account.' }, { status: 400 }) }
  if (!(await chatReady())) return { error: NextResponse.json({ error: 'Messages need a database update: open Setup and apply pending updates.', code: 'migration' }, { status: 503 }) }
  return { me }
}

const fail = (e: unknown) =>
  NextResponse.json({ error: (e as Error).message }, { status: e instanceof ChatError ? e.status : 500 })

export async function GET(req: NextRequest, { params }: Ctx) {
  const g = await guard()
  if (g.error) return g.error
  const { id } = await params
  const p = req.nextUrl.searchParams
  try {
    const ref = decodeURIComponent(id)
    // Opening a direct conversation nobody has written in yet shouldn't create it.
    const conv = await resolveConversation(g.me, ref, false).catch((e) => {
      if (e instanceof ChatError && e.status === 404 && ref.startsWith('user:')) return null
      throw e
    })
    const users = (await listUsers()).filter((u) => u.active)
    if (!conv) {
      const other = users.find((u) => u.id === ref.slice(5))
      if (!other) throw new ChatError('That person isn’t on the team.', 404)
      return NextResponse.json({ conversation: { id: null, ref, kind: 'direct', title: other.name }, members: [g.me, other].map((u) => ({ id: u.id, name: u.name })), messages: [] })
    }
    const members = conv.kind === 'team' ? users : users.filter((u) => conv.key.includes(u.id))
    const messages = await messagesIn(conv, { after: p.get('after'), before: p.get('before'), limit: Number(p.get('limit')) || undefined })
    const other = conv.kind === 'direct' ? members.find((u) => u.id !== g.me.id) : null
    return NextResponse.json({
      conversation: { id: conv.id, ref: conv.id, kind: conv.kind, title: conv.kind === 'team' ? conv.title || 'Bhumi team' : other?.name ?? 'Conversation' },
      members: members.map((u) => ({ id: u.id, name: u.name })),
      messages,
    })
  } catch (e) {
    return fail(e)
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const g = await guard()
  if (g.error) return g.error
  const { id } = await params
  try {
    const conv = await resolveConversation(g.me, decodeURIComponent(id), false)
    await markRead(conv, g.me.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    // Nothing to mark in a conversation that doesn't exist yet.
    if (e instanceof ChatError && e.status === 404) return NextResponse.json({ ok: true })
    return fail(e)
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const g = await guard()
  if (g.error) return g.error
  const { id } = await params
  const messageId = req.nextUrl.searchParams.get('message_id')
  if (!messageId) return NextResponse.json({ error: 'message_id is required' }, { status: 400 })
  try {
    const conv = await resolveConversation(g.me, decodeURIComponent(id), false)
    await deleteMessage(g.me, conv, messageId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return fail(e)
  }
}
