/* Files the team playbook PDF into the ERP (Documents → General, category
   Playbook, stored in the company Drive), so everyone opens it from the
   same place as every other document.

     npx tsx --env-file=.env.local scripts/file-playbook.ts [path-to.pdf]

   Needs the dev server (or ORIGIN=…). Re-running adds another copy, so check
   Documents first. */
import { readFileSync } from 'node:fs'
import { listUsers } from '../lib/users'
import { createSessionToken } from '../lib/session'
import { erpCaller } from '../lib/erp-call'
import { uploadInline } from '../lib/assistant/tools'

async function main() {
  const file = process.argv[2] || 'docs/Bhumi_Sales_Funnel_and_ERP_Playbook.pdf'
  const admin = (await listUsers()).find((u) => u.active)
  if (!admin) throw new Error('No active admin account.')
  const bearer = await createSessionToken(admin.id, 10 * 60)
  const call = erpCaller(process.env.ORIGIN || 'http://localhost:3000', { authorization: `Bearer ${bearer}` })
  const got = await uploadInline(
    { call },
    {
      name: 'Bhumi Estates — Sales Funnel & ERP Playbook.pdf',
      mime: 'application/pdf',
      bytes: readFileSync(file),
      maxBytes: 20 * 1024 * 1024,
      entity_type: 'general',
      entity_label: 'Sales CRM',
      category: 'Playbook',
    }
  )
  if ('error' in got) throw new Error(got.error)
  console.log('Filed as document', got.doc.id)
}

main().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
