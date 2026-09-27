import { NextResponse } from 'next/server'
import { getContacts, getTransactions } from '@/lib/db'
import { assertAdmin } from '@/lib/auth'
import { contactsReady } from '@/lib/contacts'
import { agentShareLakh, agentsReady } from '@/lib/agents'
import { createServiceClient } from '@/lib/supabase'
import type { ContactLink } from '@/lib/types'

export const dynamic = 'force-dynamic'

/* GET /api/agents — every contact with the Agent role, each with
   what they're working on and what they're owed:
     listings, open_deals, closed_deals, leads   counts of their tags
     owed_lakh    Due + Invoiced, from their terms and the deal value
     paid_lakh    what has been paid out
   Adding an agent is POST /api/contacts with roles: ['Agent'] and the
   profile fields; an agent is a contact. */
export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const [ready, agents] = await Promise.all([contactsReady(), agentsReady()])
  if (!ready) return NextResponse.json({ data: [], ready: false, agents: false })

  const [c, t, l] = await Promise.all([
    getContacts(),
    getTransactions(),
    createServiceClient().from('contact_links').select('*'),
  ])
  const deals = new Map((t.source === 'live' ? t.data : []).map((d) => [d.id, d]))
  const links = ((l.data ?? []) as ContactLink[]).reduce<Record<string, ContactLink[]>>((acc, x) => ((acc[x.contact_id] ??= []).push(x), acc), {})

  const data = (c.source === 'live' ? c.data : [])
    .filter((x) => x.roles?.includes('Agent'))
    .map((a) => {
      const mine = links[a.id] ?? []
      let owed = 0
      let paid = 0
      let open = 0
      let closed = 0
      for (const x of mine) {
        if (x.entity_type !== 'transaction') continue
        const d = deals.get(x.entity_id)
        if (d?.outcome === 'In progress') open++
        else if (d?.outcome === 'Closed') closed++
        if (x.payout_status === 'Paid') paid += x.payout_amount_lakh ?? (d ? agentShareLakh(x, d) ?? 0 : 0)
        else if ((x.payout_status === 'Due' || x.payout_status === 'Invoiced') && d) owed += x.payout_amount_lakh ?? agentShareLakh(x, d) ?? 0
      }
      return {
        ...a,
        listings: mine.filter((x) => x.entity_type === 'property').length,
        leads: mine.filter((x) => x.entity_type === 'lead').length,
        open_deals: open,
        closed_deals: closed,
        owed_lakh: Math.round(owed * 100) / 100,
        paid_lakh: Math.round(paid * 100) / 100,
      }
    })
  return NextResponse.json({ data, ready: true, agents })
}
