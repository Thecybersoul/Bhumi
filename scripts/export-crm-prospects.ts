/* Exports the Sales CRM's prospects to a CSV in the import format
   (scripts/crm-seed/bhumi-prospects.csv), followed by the CRM's working
   columns. The importer ignores columns it doesn't know, so the file can be
   edited and re-imported. Read-only.

     npx tsx --env-file=.env.local scripts/export-crm-prospects.ts [out.csv]

   Defaults to docs/bhumi_prospects.csv (docs/ is not committed: the file can
   hold business phone numbers and emails). */
import { writeFileSync } from 'node:fs'
import { createServiceClient } from '../lib/supabase'
import { LISTS, STAGES } from '../lib/crm'

const IMPORT_COLS = ['list', 'name', 'kind', 'sector', 'score', 'area', 'requirement', 'deal_band', 'trigger_why', 'website', 'source', 'source_url', 'note']
const WORK_COLS = ['prio', 'stage', 'owner', 'next_date', 'last_contacted', 'contact_person', 'email', 'alt_emails', 'phone', 'value', 'history', 'created_at', 'updated_at']

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : Array.isArray(v) ? v.join('; ') : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

async function main() {
  const out = process.argv[2] || 'docs/bhumi_prospects.csv'
  const db = createServiceClient()
  const { data, error } = await db.from('prospects').select('*').order('score', { ascending: false }).order('name')
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as Record<string, unknown>[]
  const stageName = (n: unknown) => STAGES[Number(n)] ?? ''
  const lines = [
    [...IMPORT_COLS, ...WORK_COLS].join(','),
    ...rows.map((r) => [...IMPORT_COLS, ...WORK_COLS].map((c) => cell(c === 'stage' ? stageName(r.stage) : r[c])).join(',')),
  ]
  // BOM so Excel opens the rupee sign and dashes correctly.
  writeFileSync(out, '﻿' + lines.join('\r\n') + '\r\n')
  const byList = Object.keys(LISTS).map((k) => `${k} ${rows.filter((r) => r.list === k).length}`).join(', ')
  console.log(`Exported ${rows.length} prospects (${byList}) to ${out}`)
}

main().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
