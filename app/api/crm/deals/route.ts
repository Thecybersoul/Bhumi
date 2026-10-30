import { crmRoutes } from '@/lib/crm-server'

export const dynamic = 'force-dynamic'

const h = crmRoutes(
  'crm_deals',
  {
    name: 'text',
    value: 'num',
    stage: 'int',
    parcel: 'text',
    property_code: 'text',
    deal_type: ['', 'Outright', 'JD', 'JV', 'Mandate'],
    prospect_id: 'text',
    expected_close: 'date',
    note: 'text',
    next_date: 'date',
  },
  { deal: true }
)

export const GET = h.GET
export const POST = h.POST
export const PATCH = h.PATCH
export const DELETE = h.DELETE
