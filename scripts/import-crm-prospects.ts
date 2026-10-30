/* Loads the researched prospect list into the Sales CRM (/admin/crm).

     npx tsx --env-file=.env.local scripts/import-crm-prospects.ts          # show what would be added
     npx tsx --env-file=.env.local scripts/import-crm-prospects.ts --apply  # add it

   Reads scripts/crm-seed/bhumi-prospects.csv. Companies only, each with a
   dated reason to buy land and a source link; phone numbers and emails are
   deliberately blank, because a promoter's contact details come from their
   RERA Karnataka project page and must be checked before use. Priority is
   worked out from the score (A 85+, B 70–84, C below). Safe to re-run: a
   prospect already on the same list with the same name is skipped. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServiceClient } from '../lib/supabase'
import { prioFromScore, addDays } from '../lib/crm'

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some((x) => x.trim())) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some((x) => x.trim())) rows.push(row)
  return rows
}

async function main() {
  const apply = process.argv.includes('--apply')
  const [head, ...body] = parseCsv(readFileSync(join(process.cwd(), 'scripts/crm-seed/bhumi-prospects.csv'), 'utf8'))
  const records = body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))

  const sb = createServiceClient()
  const { data: existing, error } = await sb.from('prospects').select('list,name')
  if (error) throw new Error(error.message)
  const have = new Set((existing ?? []).map((p) => `${p.list}|${String(p.name).toLowerCase()}`))

  const rows = records
    .filter((r) => !have.has(`${r.list}|${r.name.toLowerCase()}`))
    .map((r) => {
      const score = Number(r.score)
      const prio = prioFromScore(score)
      return {
        list: r.list,
        name: r.name,
        kind: r.kind,
        sector: r.sector,
        prio,
        score,
        area: r.area,
        requirement: r.requirement,
        deal_band: r.deal_band,
        trigger_why: r.trigger_why,
        website: r.website ? (r.website.startsWith('http') ? r.website : `https://${r.website}`) : '',
        source: r.source,
        source_url: r.source_url,
        note: r.note,
        stage: 0,
        // Nobody sits in the funnel without a next date: A today+2, B +5, C +10.
        next_date: addDays(prio === 'A' ? 2 : prio === 'B' ? 5 : 10),
        created_by: 'Research import',
        updated_by: 'Research import',
      }
    })

  console.log(`${records.length} in the file, ${records.length - rows.length} already in the CRM, ${rows.length} to add.`)
  for (const r of rows) console.log(`  ${r.prio} ${String(r.score).padStart(3)}  ${r.list}  ${r.name}`)
  if (!apply) return console.log('\nDry run. Re-run with --apply to add them.')
  if (!rows.length) return
  const { error: err } = await sb.from('prospects').insert(rows)
  if (err) throw new Error(err.message)
  console.log(`\nAdded ${rows.length} prospects.`)
}

main().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
