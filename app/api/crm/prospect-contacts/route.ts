import { crmRoutes } from '@/lib/crm-server'

export const dynamic = 'force-dynamic'

/* The people and lines at a prospect (migration 023): one row each, with its
   own phone. GET returns every row; the Prospects screens group them by
   prospect_id. */
const h = crmRoutes(
  'prospect_contacts',
  {
    prospect_id: 'uuid',
    name: 'text',
    role: 'text',
    role_type: ['Leadership', 'Land', 'Marketing', 'IR', 'Sales', 'Generic'],
    phone: 'phone',
    email: 'text',
    source_url: 'text',
    verified_on: 'date',
  },
  { followUps: false, migration: '023 (prospect contacts)', entity: 'prospect_contact', required: ['prospect_id'] }
)

export const GET = h.GET
export const POST = h.POST
export const PATCH = h.PATCH
export const DELETE = h.DELETE
