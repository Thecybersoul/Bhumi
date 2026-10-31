/* Exports the Sales CRM's prospects to a CSV in the import format
   (scripts/crm-seed/bhumi-prospects.csv), followed by the CRM's working
   columns and three columns of the people and lines at each prospect
   (contacts, land_contacts, marketing_contacts). A second file, next to it
   with -contacts before the extension, has one row per person or line. The importer ignores columns it doesn't know, so the file can be
   edited and re-imported. Read-only.

     npx tsx --env-file=.env.local scripts/export-crm-prospects.ts [out.csv]

   Defaults to docs/bhumi_prospects.csv (docs/ is not committed: the file can
   hold business phone numbers and emails). */
import { writeFileSync } from 'node:fs'
import { createServiceClient } from '../lib/supabase'
import { LISTS, STAGES, type ProspectContact } from '../lib/crm'

const IMPORT_COLS = ['list', 'name', 'kind', 'sector', 'score', 'area', 'requirement', 'deal_band', 'trigger_why', 'website', 'source', 'source_url', 'note']
const WORK_COLS = ['prio', 'stage', 'next_date', 'last_contacted', 'contact_person', 'email', 'alt_emails', 'phone', 'value', 'history', 'contacts', 'land_contacts', 'marketing_contacts', 'created_at', 'updated_at']

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
  // Before migration 023 there is no contacts table: export the prospects without it.
  const pcRes = await db.from('prospect_contacts').select('*').order('created_at')
  const contacts = (pcRes.error ? [] : pcRes.data ?? []) as ProspectContact[]
  const line = (c: ProspectContact) => [c.name, c.role && `(${c.role})`, c.phone, c.email].filter(Boolean).join(' ')
  const joined = (id: string, type?: string) =>
    contacts.filter((c) => c.prospect_id === id && (!type || c.role_type === type)).map(line).join('; ')
  for (const r of rows) {
    r.contacts = joined(String(r.id))
    r.land_contacts = joined(String(r.id), 'Land')
    r.marketing_contacts = joined(String(r.id), 'Marketing')
  }
  const stageName = (n: unknown) => STAGES[Number(n)] ?? ''
  const lines = [
    [...IMPORT_COLS, ...WORK_COLS].join(','),
    ...rows.map((r) => [...IMPORT_COLS, ...WORK_COLS].map((c) => cell(c === 'stage' ? stageName(r.stage) : r[c])).join(',')),
  ]
  // BOM so Excel opens the rupee sign and dashes correctly.
  writeFileSync(out, '﻿' + lines.join('\r\n') + '\r\n')
  const byList = Object.keys(LISTS).map((k) => `${k} ${rows.filter((r) => r.list === k).length}`).join(', ')
  const flat = out.replace(/\.csv$/i, '') + '-contacts.csv'
  const names = new Map(rows.map((r) => [String(r.id), String(r.name)]))
  const CCOLS = ['prospect', 'name', 'role', 'role_type', 'phone', 'email', 'source_url', 'verified_on']
  writeFileSync(
    flat,
    '﻿' + [CCOLS.join(','), ...contacts.map((c) => [names.get(c.prospect_id) ?? '', c.name, c.role, c.role_type, c.phone, c.email, c.source_url, c.verified_on ?? ''].map(cell).join(','))].join('\r\n') + '\r\n'
  )
  console.log(`${contacts.length} people and lines to ${flat}`)
  console.log(`Exported ${rows.length} prospects (${byList}) to ${out}`)
}

main().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
