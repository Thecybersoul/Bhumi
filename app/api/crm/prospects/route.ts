import { crmRoutes } from '@/lib/crm-server'

export const dynamic = 'force-dynamic'

const h = crmRoutes('prospects', {
  list: ['P', 'D', 'I', 'B'],
  name: 'text',
  kind: 'text',
  sector: 'text',
  prio: ['A', 'B', 'C'],
  email: 'text',
  alt_emails: 'text',
  phone: 'text',
  area: 'text',
  requirement: 'text',
  trigger_why: 'text',
  history: 'text',
  stage: 'int',
  next_date: 'date',
  value: 'num',
  owner: 'text',
  note: 'text',
  contact_person: 'text',
  website: 'text',
  source: 'text',
  source_url: 'text',
  deal_band: 'text',
  score: 'pct',
  last_contacted: 'date',
})

export const GET = h.GET
export const POST = h.POST
export const PATCH = h.PATCH
export const DELETE = h.DELETE
