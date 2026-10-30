/* Checks the Sales CRM API (/api/crm/*) against a running dev server:
   signed-out requests are refused, a deal's commission is whatever was
   agreed for it (never a fixed rate), bad input is rejected, a CSV import lands, and the parcel
   matcher puts the Hoskote parcel in front of the Hoskote plotted builder.
   Creates throwaway rows and deletes them.

     npx tsx --env-file=.env.local scripts/test-crm.ts        (ORIGIN=… to override) */
import { listUsers } from '../lib/users'
import { createSessionToken } from '../lib/session'
import { matchParcels, type Prospect, type CrmDeal } from '../lib/crm'

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
  check('signed-out deals request is refused', (await call('GET', '/api/crm/deals', undefined, {})).status === 401)

  const deals = (await call('GET', '/api/crm/deals')).json.data as CrmDeal[]
  check('the two seeded deals are in the pipeline', ['Devanahalli 10-gunta Parcel', 'Sarjapura 50-acre JD'].every((n) => deals.some((d) => d.name === n)))

  const created = await call('POST', '/api/crm/deals', { name: 'TEST deal — delete me', value: 123456789, commission: 2000000, stage: 3 })
  check('a deal can be created', created.status === 201, JSON.stringify(created.json))
  const id = String(created.json.id)
  let row = ((await call('GET', '/api/crm/deals')).json.data as CrmDeal[]).find((d) => d.id === id)
  check('commission is stored exactly as agreed, not worked out from a rate', row?.commission === 2000000, String(row?.commission))
  await call('PATCH', `/api/crm/deals?id=${id}`, { value: 50000000 })
  row = ((await call('GET', '/api/crm/deals')).json.data as CrmDeal[]).find((d) => d.id === id)
  check('changing the value leaves the agreed commission alone', row?.commission === 2000000, String(row?.commission))
  await call('PATCH', `/api/crm/deals?id=${id}`, { commission: '' })
  row = ((await call('GET', '/api/crm/deals')).json.data as CrmDeal[]).find((d) => d.id === id)
  check('an emptied commission box saves as 0 rather than failing', row?.commission === 0, String(row?.commission))
  check('a stage outside 0–5 is rejected', (await call('PATCH', `/api/crm/deals?id=${id}`, { stage: 9 })).status === 400)
  check('a deal without a name is rejected', (await call('POST', '/api/crm/deals', { value: 1 })).status === 400)
  check('an unknown structure is rejected', (await call('PATCH', `/api/crm/deals?id=${id}`, { deal_type: 'Barter' })).status === 400)
  await call('DELETE', `/api/crm/deals?id=${id}`)

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
