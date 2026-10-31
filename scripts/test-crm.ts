/* Checks the Sales CRM API (/api/crm/*) against a running dev server:
   signed-out requests are refused, a prospect's next date becomes a task,
   a prospect converts to a lead and then to a real deal (one contact, links
   both ways), a CSV import lands, and the parcel matcher puts the Hoskote
   parcel in front of the Hoskote plotted builder. Creates throwaway rows and
   deletes them (the contact card it makes is left: delete it in Contacts).

     npx tsx --env-file=.env.local scripts/test-crm.ts        (ORIGIN=… to override) */
import { listUsers } from '../lib/users'
import { createSessionToken } from '../lib/session'
import { matchParcels, type Prospect } from '../lib/crm'

const ORIGIN = process.env.ORIGIN || 'http://localhost:3000'
const fails: string[] = []
const check = (label: string, ok: boolean, detail?: string) => {
  console.log(`${ok ? '  ok ' : 'FAIL'}  ${label}${!ok && detail ? ` — ${detail}` : ''}`)
  if (!ok) fails.push(label)
}

async function main() {
  const admin = (await listUsers()).find((u) => u.active)!
  const bearer = await createSessionToken(admin.id, 10 * 60)
  const H = { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' }
  const call = (method: string, path: string, body?: unknown, headers: Record<string, string> = H) =>
    fetch(`${ORIGIN}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }).then(async (r) => ({ status: r.status, json: (await r.json().catch(() => ({}))) as Record<string, unknown> }))

  check('signed-out prospects request is refused', (await call('GET', '/api/crm/prospects', undefined, {})).status === 401)
  check('signed-out convert is refused', (await call('POST', '/api/crm/prospects/x/convert', { to: 'lead' }, {})).status === 401)

  const next = new Date(Date.now() + 3 * 86400e3).toISOString().slice(0, 10)
  const made = await call('POST', '/api/crm/prospects', { name: 'TEST funnel — delete me', list: 'B', phone: '9000000001', next_date: next, requirement: 'test' })
  check('a prospect can be created', made.status === 201, JSON.stringify(made.json))
  const pid = String(made.json.id)
  const tasks = async () => ((await call('GET', '/api/tasks')).json.data ?? []) as { entity_type: string; entity_id: string; status: string; due_at: string }[]
  check('its next date is an open task', (await tasks()).some((t) => t.entity_type === 'prospect' && t.entity_id === pid && t.status === 'Open'))

  const lead = await call('POST', `/api/crm/prospects/${pid}/convert`, { to: 'lead' })
  check('a prospect converts to a lead', lead.status === 201 && !!lead.json.lead_id, JSON.stringify(lead.json))
  check('converting twice is refused', (await call('POST', `/api/crm/prospects/${pid}/convert`, { to: 'lead' })).status === 409)

  const deal = await call('POST', `/api/crm/prospects/${pid}/convert`, { to: 'deal', deal_value_cr: 4.5 })
  check('a prospect opens a real deal', deal.status === 201 && !!deal.json.id, JSON.stringify(deal.json))
  const txns = ((await call('GET', '/api/transactions')).json.data ?? []) as { id: string; prospect_id?: string; deal_value_cr?: number }[]
  const t = txns.find((x) => x.id === deal.json.id)
  check('the deal points back at the prospect and carries its value', t?.prospect_id === pid && Number(t?.deal_value_cr) === 4.5, JSON.stringify(t))
  const leads = ((await call('GET', '/api/leads')).json.data ?? []) as { id: string; stage: string; transaction_id?: string }[]
  check('the lead is marked converted to that deal', leads.find((l) => l.id === lead.json.lead_id)?.transaction_id === deal.json.id)
  await call('DELETE', `/api/transactions/${deal.json.id}`)
  await call('DELETE', `/api/leads/${lead.json.lead_id}`)
  await call('DELETE', `/api/crm/prospects?id=${pid}`)

  const imp = await call('POST', '/api/crm/prospects', { rows: [{ name: 'TEST import A', list: 'B', score: '90' }, { name: 'TEST import B', list: 'X' }, { list: 'B' }] })
  check('CSV import keeps valid rows and drops invalid ones', imp.status === 201 && imp.json.imported === 1, JSON.stringify(imp.json))
  const prospects = (await call('GET', '/api/crm/prospects')).json.data as Prospect[]
  for (const p of prospects.filter((x) => x.name.startsWith('TEST import'))) await call('DELETE', `/api/crm/prospects?id=${p.id}`)

  const abhee = prospects.find((p) => p.name === 'Abhee Ventures')
  const listings = ((await call('GET', '/api/properties?admin=1')).json.data ?? []) as Parameters<typeof matchParcels>[1]
  const hits = abhee ? matchParcels(abhee, listings).map((m) => m.l.code) : []
  check('Abhee Ventures (Hoskote plotted builder) is matched to the Hoskote 30-acre parcel P009', hits.includes('P009'), hits.join(','))

  console.log(fails.length ? `\nFAILED: ${fails.length}` : '\nPASS: the Sales CRM works end to end.')
  process.exit(fails.length ? 1 : 0)
}

main().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
