import type Anthropic from '@anthropic-ai/sdk'

/* ═══════════════════════════════════════════════════════════
   The assistant's hands.

   Every tool goes through the ERP's own /api routes, called as the
   signed-in person (their cookie or bearer token is forwarded). So
   the assistant can do exactly what that person can do in the admin,
   with the same validation, Drive folders, Calendar events, activity
   trail and attribution. There is no second write path to drift.
   ═══════════════════════════════════════════════════════════ */

type Tool = Anthropic.Beta.Messages.BetaTool
type Block = Anthropic.Beta.Messages.BetaToolResultBlockParam['content']

export interface ToolContext {
  call: (method: string, path: string, body?: unknown) => Promise<{ status: number; json: Record<string, unknown> }>
  /** Uploads a stored ERP document to the Files API so Claude can read it. */
  readDocument: (id: string) => Promise<{ blocks: NonNullable<Exclude<Block, string>>; note: string } | { error: string }>
  /** Copies an image document to the public media library and returns its URL. */
  publishImage: (id: string) => Promise<{ url: string } | { error: string }>
}

/** What the chat shows for a step: a label, and a link to the record touched. */
export interface StepInfo {
  label: string
  href?: string
  ok: boolean
}

export interface ToolOutcome {
  content: Block
  step: StepInfo
  isError?: boolean
}

/* ─── Shapes ───────────────────────────────────────────────── */

const ENTITY = ['property', 'transaction', 'lead', 'contact', 'task', 'note', 'meeting', 'verification'] as const
const LINKABLE = ['lead', 'transaction', 'property', 'verification', 'meeting', 'contact', 'general'] as const

const str = { type: 'string' } as const
const num = { type: 'number' } as const
const bool = { type: 'boolean' } as const
const strArr = { type: 'array', items: { type: 'string' } } as const
const en = (values: readonly string[], description?: string) => ({ type: 'string', enum: [...values], ...(description ? { description } : {}) })

/* Listing columns the assistant may write. PUT /api/properties passes
   the body to the table, so anything outside this list is dropped
   here rather than failing in PostgREST. */
const LISTING_FIELDS = {
  code: { ...str, description: 'Unique listing code, e.g. BLR-DV-07. Required on create.' },
  title: str,
  property_type: en(['land-parcels', 'large-land-parcels', 'commercial', 'residential', 'villas', 'warehouses']),
  status: en(['Draft', 'Live', 'Reserved', 'Sold'], 'Draft keeps it off the public marketplace. Default Draft.'),
  location: { ...str, description: 'Village/area and taluk, e.g. "Budigere, Hoskote"' },
  corridor: { ...str, description: 'Belt or corridor, e.g. "Airport belt", "STRR corridor"' },
  zone: en(['North', 'East', 'South', 'West'], 'Bengaluru zone'),
  price_type: en(['Fixed', 'Negotiable', 'On Request']),
  extent_acres: { ...num, description: 'Land extent in acres (1 acre = 40 guntas = 43,560 sq ft)' },
  price_per_acre_cr: { ...num, description: '₹ crore per acre' },
  price_total_cr: { ...num, description: 'Whole asking price in ₹ crore' },
  price_per_sqft: { ...num, description: '₹ per sq ft' },
  plot_area_sqft: num,
  built_up_sqft: num,
  carpet_sqft: num,
  land_use: str,
  zoning: str,
  conversion: { ...str, description: 'e.g. "Not converted", "Converted (DC order 2019)"' },
  survey_number: str,
  khata: str,
  authority: { ...str, description: 'BBMP, BDA, BIAAPA, BMRDA…' },
  facing: str,
  dimensions: str,
  road_type: { ...str, description: 'Access road, e.g. "40 ft tar road", "STRR (NH-948A)"' },
  use_cases: strArr,
  ownership: str,
  title_clear: bool,
  risk: en(['Low', 'Moderate', 'High']),
  risk_notes: str,
  description: str,
  amenities: str,
  engagement: { ...str, description: 'What Bhumi does on it: e.g. "Sole mandate", "Sourcing", "Development mandate"' },
  plots_total: num,
  plots_available: num,
  plot_size: str,
  rera_number: str,
  unit_mix: str,
  dist_airport_km: num,
  dist_city_km: num,
  water: str,
  soil: str,
  topo: str,
  featured: bool,
} as const

const DEAL_FIELDS = {
  property_id: { ...str, description: 'Listing id; omit for an off-market deal' },
  property_label: { ...str, description: 'What is being sold, e.g. "BLR-DV-07 · 2 acres, Budigere". Required on create.' },
  stage: en(['Enquiry', 'Negotiation', 'Agreement', 'Registration', 'Closed']),
  buyer_name: str,
  buyer_phone: str,
  buyer_email: str,
  seller_name: str,
  seller_phone: str,
  seller_email: str,
  buyer_contact_id: str,
  seller_contact_id: str,
  representing: en(['Buyer', 'Seller', 'Both']),
  deal_value_cr: { ...num, description: '₹ crore' },
  commission_type: en(['Percentage', 'Flat']),
  commission_value: { ...num, description: 'Percent of deal value, or flat ₹ lakh' },
  commission_collected: bool,
  advisor: str,
  notes: str,
} as const

const LEAD_FIELDS = {
  name: str,
  phone: str,
  email: str,
  company: str,
  contact_id: { ...str, description: 'Existing contact to hang the lead on' },
  intent: en(['Buy', 'Sell', 'Lease', 'Rent out', 'Invest', 'Other']),
  kind: en(['Enquiry', 'Site visit', 'Listing request', 'Advisor call', 'Verification review', 'Data room']),
  stage: en(['New', 'Contacted', 'Qualified', 'Visit', 'Negotiation', 'Converted', 'Lost', 'Nurture']),
  priority: en(['Hot', 'Warm', 'Cold']),
  channel: en(['WhatsApp', 'Form', 'Call', 'Landing page', 'Walk-in', 'Referral', 'Broker', 'Portal', 'Social media', 'Email', 'Other']),
  property_type: str,
  budget_min_cr: num,
  budget_max_cr: num,
  size_requirement: { ...str, description: 'e.g. "2–5 acres"' },
  locations: { ...str, description: 'Comma-separated places they want' },
  timeline: str,
  assigned_to: str,
  next_follow_up_at: { ...str, description: 'ISO 8601 date-time (IST offset +05:30)' },
  lost_reason: str,
  notes: str,
  source: str,
} as const

const CONTACT_FIELDS = {
  name: str,
  phone: str,
  alt_phone: str,
  email: str,
  company: str,
  roles: { type: 'array', items: en(['Buyer', 'Seller', 'Landowner', 'Investor', 'Developer', 'Tenant', 'Agent', 'Lawyer', 'Surveyor', 'Other']) },
  city: str,
  address: str,
  notes: str,
  agency: { ...str, description: 'Agent only: their firm' },
  rera_number: { ...str, description: 'Agent only' },
  operating_areas: { ...str, description: 'Agent only: comma-separated areas they cover' },
  specialties: { ...strArr, description: 'Agent only: property types they handle' },
  default_share_pct: { ...num, description: 'Agent only: their usual % of our commission' },
  agent_status: en(['Preferred', 'Active', 'Inactive', 'Do not engage']),
  rating: { ...num, description: '1–5' },
  gstin: str,
  pan: str,
} as const

const obj = (properties: Record<string, unknown>, required: string[] = []) => ({ type: 'object' as const, properties, required, additionalProperties: false })

export const TOOLS: Tool[] = [
  {
    name: 'search',
    description:
      'Find anything in the ERP by words: people and agents (name, phone, agency, RERA), listings (code, title, place, survey no.), deals (reference, parties), leads, meetings, tasks, notes, documents. Use this first to resolve names to ids and to avoid creating duplicates.',
    input_schema: obj({ query: str }, ['query']),
  },
  {
    name: 'list_records',
    description:
      'List records of one type, newest first, optionally filtered by a word. Types: listings, deals, leads, contacts, agents, tasks, notes, meetings, documents. Use for questions like "open deals", "hot leads", "tasks due this week".',
    input_schema: obj(
      {
        type: en(['listings', 'deals', 'leads', 'contacts', 'agents', 'tasks', 'notes', 'meetings', 'documents']),
        filter: { ...str, description: 'Optional words every returned record must contain' },
        limit: { ...num, description: 'Default 25, max 100' },
      },
      ['type']
    ),
  },
  {
    name: 'get_record',
    description:
      'Everything about one record: its fields, the people and agents linked to it (with commission terms), its documents, and for a lead the listings shown to them; for a contact their leads, deals and commissions.',
    input_schema: obj({ type: en(['listing', 'deal', 'lead', 'contact']), id: str }, ['type', 'id']),
  },
  {
    name: 'dashboard',
    description: 'Today at a glance: pipeline value, follow-ups due, open tasks, upcoming meetings, recent activity.',
    input_schema: obj({}),
  },
  {
    name: 'create_listing',
    description: 'Add a property to Listings. Creates its Drive folder. New listings default to Draft (not on the public site).',
    input_schema: obj(LISTING_FIELDS, ['code', 'title', 'location']),
  },
  {
    name: 'update_listing',
    description: 'Change fields on a listing. Send only what changes.',
    input_schema: obj({ id: str, changes: obj(LISTING_FIELDS) }, ['id', 'changes']),
  },
  {
    name: 'set_listing_photo',
    description:
      "Make an attached photo (an image document id) the listing's main photo on the website and in the app. Use the best exterior or site photo. Also file the photo on the listing with attach_document so it stays with its documents.",
    input_schema: obj({ listing_id: str, document_id: str }, ['listing_id', 'document_id']),
  },
  {
    name: 'property_register',
    description:
      "The team's Property Register (P001–P006, owner-stated particulars). 'preview' lists them and whether each is already a listing; 'import' creates Draft listings for the ones not yet listed (all, or just `ids`). Never overwrites.",
    input_schema: obj({ action: en(['preview', 'import']), ids: { ...strArr, description: "Register ids like 'P004'" } }, ['action']),
  },
  {
    name: 'create_lead',
    description: 'Add a lead (a buyer, seller, tenant or investor enquiry). Needs a name and a phone or email, or an existing contact_id. Files the person as a contact automatically.',
    input_schema: obj(LEAD_FIELDS, ['name']),
  },
  {
    name: 'update_lead',
    description: 'Change a lead: stage, priority, requirements, follow-up date, notes… Send only what changes.',
    input_schema: obj({ id: str, changes: obj(LEAD_FIELDS) }, ['id', 'changes']),
  },
  {
    name: 'shortlist_listing',
    description: 'Record that a listing was shortlisted for, shared with, or shown to a lead, or update how it went (status and feedback).',
    input_schema: obj(
      {
        lead_id: str,
        property_id: str,
        status: en(['Shortlisted', 'Shared', 'Visit planned', 'Visited', 'Interested', 'Not interested', 'Offer made']),
        feedback: str,
      },
      ['lead_id', 'property_id']
    ),
  },
  {
    name: 'convert_lead',
    description:
      'Turn a lead into a deal once a counterpart is found. Optionally on a listing, and with the other side as a lead or contact. Agents on the lead carry over.',
    input_schema: obj(
      {
        lead_id: str,
        property_id: str,
        property_label: str,
        counterpart_lead_id: str,
        counterpart_contact_id: str,
        representing: en(['Buyer', 'Seller', 'Both']),
        deal_value_cr: num,
        advisor: str,
      },
      ['lead_id']
    ),
  },
  {
    name: 'find_matches',
    description: 'Best-fitting listings and counterpart leads for a lead, or best-fitting buyers for a listing, with reasons.',
    input_schema: obj({ lead_id: str, property_id: str }),
  },
  {
    name: 'create_deal',
    description: 'Open a deal (transaction) directly. Needs property_label and a buyer or seller name.',
    input_schema: obj(DEAL_FIELDS, ['property_label']),
  },
  {
    name: 'update_deal',
    description:
      'Change a deal: stage (Closed marks it won and makes agent payouts Due), value, commission, parties, notes. Use mark_lost with lost_reason to lose it, reopen to reopen.',
    input_schema: obj(
      { id: str, changes: obj({ ...DEAL_FIELDS, mark_lost: bool, lost_reason: str, reopen: bool }) },
      ['id', 'changes']
    ),
  },
  {
    name: 'create_contact',
    description:
      "Save a person to Contacts: a client, landowner, lawyer or surveyor. For an outside agent/broker, include role 'Agent' and their agency, areas and usual share. Refuses a duplicate phone or email and names who has it.",
    input_schema: obj(CONTACT_FIELDS, ['name']),
  },
  {
    name: 'update_contact',
    description: 'Change a contact or agent profile. Send only what changes.',
    input_schema: obj({ id: str, changes: obj(CONTACT_FIELDS) }, ['id', 'changes']),
  },
  {
    name: 'link_person',
    description:
      "Put a contact or agent on a record (listing, deal, lead, task, note, meeting, verification) with their role. For an agent, also record what they get: share_type and share_value (percent, or ₹ lakh for Flat). Agent roles: Listing agent, Buyer's agent, Seller's agent, Co-broker, Referral, Mandate holder. Other roles: Buyer, Seller, Landowner, Lawyer, Surveyor, Investor, Developer, Other.",
    input_schema: obj(
      {
        contact_id: str,
        entity_type: en(ENTITY),
        entity_id: str,
        entity_label: { ...str, description: 'Human label for the record, e.g. the listing code and title' },
        role: str,
        share_type: en(['Percent of our commission', 'Percent of deal value', 'Flat', 'Paid by their client']),
        share_value: num,
        notes: str,
      },
      ['contact_id', 'entity_type', 'entity_id', 'role']
    ),
  },
  {
    name: 'update_involvement',
    description: "Change an agent's terms or payout on a record (the link id from get_record): payout status, amount paid in ₹ lakh, payment reference.",
    input_schema: obj(
      {
        link_id: str,
        role: str,
        share_type: en(['Percent of our commission', 'Percent of deal value', 'Flat', 'Paid by their client']),
        share_value: num,
        payout_status: en(['Not due', 'Due', 'Invoiced', 'Paid', 'Waived']),
        payout_amount_lakh: num,
        payout_ref: str,
        notes: str,
      },
      ['link_id']
    ),
  },
  {
    name: 'suggest_agents',
    description: 'Agents who work the area and property type of a listing or lead, best first.',
    input_schema: obj({ entity_type: en(['property', 'lead', 'transaction']), entity_id: str }, ['entity_type', 'entity_id']),
  },
  {
    name: 'create_task',
    description: 'Add a follow-up task, optionally about a record and with a due time and assignee (Chethan, Sanjog or Ranjith).',
    input_schema: obj(
      {
        title: str,
        due_at: { ...str, description: 'ISO 8601 with +05:30' },
        priority: en(['Low', 'Normal', 'High']),
        assignee: str,
        entity_type: en(LINKABLE),
        entity_id: str,
        entity_label: str,
      },
      ['title']
    ),
  },
  {
    name: 'update_task',
    description: 'Mark a task done or open again, or change its title, due time, priority or assignee.',
    input_schema: obj({ id: str, status: en(['Open', 'Done']), title: str, due_at: str, priority: en(['Low', 'Normal', 'High']), assignee: str }, ['id']),
  },
  {
    name: 'add_note',
    description: 'Write down what was said or decided, optionally on a record.',
    input_schema: obj({ body: str, entity_type: en(LINKABLE), entity_id: str, entity_label: str }, ['body']),
  },
  {
    name: 'schedule_meeting',
    description:
      'Book a meeting, site visit, call or video call, optionally about a record. Goes on the shared Google Calendar when connected (video calls get a Meet link). Use status Completed with an outcome to log one that already happened.',
    input_schema: obj(
      {
        title: str,
        kind: en(['In person', 'Site visit', 'Call', 'Video call', 'Discussion']),
        scheduled_at: { ...str, description: 'ISO 8601 with +05:30' },
        duration_min: num,
        location: str,
        attendees: { ...str, description: 'Names, comma-separated' },
        agenda: str,
        status: en(['Scheduled', 'Completed']),
        outcome: str,
        entity_type: en(['property', 'transaction', 'task', 'lead', 'verification', 'contact', 'general']),
        entity_id: str,
        entity_label: str,
      },
      ['title', 'scheduled_at']
    ),
  },
  {
    name: 'read_document',
    description: 'Open a stored document (an uploaded file in this chat, or any ERP document id) to read it: PDFs, scans and photos, e.g. to pull particulars from a title deed, RTC or brochure.',
    input_schema: obj({ document_id: str }, ['document_id']),
  },
  {
    name: 'attach_document',
    description:
      'File a document on a record (listing, deal, lead, contact, task, note, meeting, verification): moves it into that record (and its Drive folder) with a category such as Title deed, EC, RTC, Khata, Survey sketch, Conversion order, Sale agreement, Sale deed, KYC, Photos, Brochure, Other.',
    input_schema: obj(
      {
        document_id: str,
        entity_type: en(['property', 'transaction', 'lead', 'contact', 'task', 'note', 'meeting', 'verification']),
        entity_id: str,
        entity_label: str,
        category: str,
        name: { ...str, description: 'Optional new file name' },
      },
      ['document_id', 'entity_type', 'entity_id']
    ),
  },
  {
    name: 'delete_record',
    description:
      'Permanently delete a listing, deal, lead, contact, task, note, meeting, document, or a person-link. Only when the user has explicitly asked to delete this specific record in their latest message. Set confirmed true only then.',
    input_schema: obj(
      {
        type: en(['listing', 'deal', 'lead', 'contact', 'task', 'note', 'meeting', 'document', 'link']),
        id: str,
        confirmed: bool,
      },
      ['type', 'id', 'confirmed']
    ),
  },
].map((t) => ({ ...t, eager_input_streaming: true }) as Tool)

/* ─── Validation ─────────────────────────────────────────────
   Tool inputs stream eagerly, and a tolerant parser can hand back a
   truncated object rather than failing. Every input is checked
   against its schema before anything runs. */

type Schema = { type?: string; enum?: string[]; properties?: Record<string, Schema>; required?: string[]; items?: Schema }

function check(schema: Schema, v: unknown, path: string): string | null {
  if (v === undefined || v === null) return null
  switch (schema.type) {
    case 'string':
      if (typeof v !== 'string') return `${path} must be a string`
      if (schema.enum && !schema.enum.includes(v)) return `${path} must be one of: ${schema.enum.join(', ')}`
      return null
    case 'number':
      return typeof v === 'number' && Number.isFinite(v) ? null : `${path} must be a number`
    case 'boolean':
      return typeof v === 'boolean' ? null : `${path} must be true or false`
    case 'array':
      if (!Array.isArray(v)) return `${path} must be an array`
      for (let i = 0; i < v.length; i++) {
        const e = check(schema.items ?? {}, v[i], `${path}[${i}]`)
        if (e) return e
      }
      return null
    case 'object': {
      if (typeof v !== 'object' || Array.isArray(v)) return `${path || 'input'} must be an object`
      const o = v as Record<string, unknown>
      for (const r of schema.required ?? []) if (o[r] === undefined || o[r] === '') return `${path ? path + '.' : ''}${r} is required`
      for (const [k, val] of Object.entries(o)) {
        const sub = schema.properties?.[k]
        if (!sub) return `${path ? path + '.' : ''}${k} is not a known field`
        const e = check(sub, val, path ? `${path}.${k}` : k)
        if (e) return e
      }
      return null
    }
  }
  return null
}

export function validateInput(name: string, input: unknown): string | null {
  const tool = TOOLS.find((t) => t.name === name)
  if (!tool) return `Unknown tool ${name}`
  return check(tool.input_schema as Schema, input, '')
}

/* ─── Helpers ──────────────────────────────────────────────── */

const HREF: Record<string, (id: string) => string> = {
  property: (id) => `/admin/properties/${id}`,
  listing: (id) => `/admin/properties/${id}`,
  transaction: (id) => `/admin/deals/${id}`,
  deal: (id) => `/admin/deals/${id}`,
  lead: (id) => `/admin/deals/leads/${id}`,
  contact: (id) => `/admin/deals/contacts/${id}`,
  meeting: (id) => `/admin/meetings/${id}`,
}
export const hrefFor = (type: string | null | undefined, id: string | null | undefined) => (type && id && HREF[type] ? HREF[type](id) : undefined)

/** Drops empty values and bulky columns so results stay small. */
function slim<T extends Record<string, unknown>>(row: T, drop: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (drop.includes(k)) continue
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) continue
    if (['created_by', 'updated_by', 'updated_at', 'phone_norm', 'img_url', 'payload', 'meetings', 'documents'].includes(k)) continue
    out[k] = v
  }
  return out
}

const LIST_DROP: Record<string, string[]> = {
  listings: ['description', 'amenities', 'risk_notes', 'use_cases', 'soil', 'water', 'topo', 'conn_score', 'featured', 'dist_city_km', 'ownership'],
  deals: ['notes'],
  leads: ['notes'],
  contacts: ['notes', 'address'],
  agents: ['notes', 'address'],
}

const pick = (o: Record<string, unknown>, keys: readonly string[]) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]))

function json(v: unknown): string {
  const s = JSON.stringify(v)
  return s.length > 60_000 ? s.slice(0, 60_000) + '…(truncated; narrow the request)' : s
}

const fail = (label: string, error: unknown): ToolOutcome => ({
  content: `Error: ${typeof error === 'string' ? error : JSON.stringify(error)}`,
  step: { label, ok: false },
  isError: true,
})

function errorOf(r: { status: number; json: Record<string, unknown> }): string | null {
  if (r.status >= 400) return String(r.json.error ?? `HTTP ${r.status}`)
  if (r.json.persisted === false) return 'The database is not attached, so nothing was saved.'
  return null
}

const LIST_PATH: Record<string, string> = {
  listings: '/api/properties?admin=1',
  deals: '/api/transactions',
  leads: '/api/leads',
  contacts: '/api/contacts',
  agents: '/api/agents',
  tasks: '/api/tasks',
  notes: '/api/notes',
  meetings: '/api/meetings',
  documents: '/api/documents',
}

async function findIn(ctx: ToolContext, list: string, id: string): Promise<Record<string, unknown> | null> {
  const r = await ctx.call('GET', LIST_PATH[list])
  const rows = (r.json.data as Record<string, unknown>[] | undefined) ?? []
  return rows.find((x) => x.id === id) ?? null
}

async function peopleAndDocs(ctx: ToolContext, entity: string, id: string) {
  const [links, docs] = await Promise.all([
    ctx.call('GET', `/api/contact-links?entity_type=${entity}&entity_id=${id}`),
    ctx.call('GET', `/api/documents?entity_type=${entity}&entity_id=${id}`),
  ])
  return {
    people: ((links.json.data as Record<string, unknown>[]) ?? []).map((l) => slim(l, ['entity_type', 'entity_id', 'entity_label', 'created_at'])),
    documents: ((docs.json.data as Record<string, unknown>[]) ?? []).map((d) => pick(d, ['id', 'name', 'category', 'storage', 'created_at'])),
  }
}

/* ─── Execution ────────────────────────────────────────────── */

export async function runTool(name: string, input: Record<string, unknown>, ctx: ToolContext): Promise<ToolOutcome> {
  const i = input
  const id = String(i.id ?? '')
  switch (name) {
    case 'search': {
      const r = await ctx.call('GET', `/api/search?q=${encodeURIComponent(String(i.query))}`)
      const hits = (r.json.data as Record<string, unknown>[]) ?? []
      return { content: json({ results: hits }), step: { label: `Searched “${i.query}” · ${hits.length} found`, ok: true } }
    }

    case 'list_records': {
      const type = String(i.type)
      const r = await ctx.call('GET', LIST_PATH[type])
      if (r.status >= 400) return fail(`Couldn’t list ${type}`, r.json.error)
      if (r.json.source === 'fallback') {
        return {
          content: json({ records: [], note: 'No live records: the database is not attached or has none, so the ERP is showing built-in sample data.' }),
          step: { label: `No ${type} in the database`, ok: true },
        }
      }
      let rows = (r.json.data as Record<string, unknown>[]) ?? []
      const words = String(i.filter ?? '').toLowerCase().split(/\s+/).filter(Boolean)
      if (words.length) rows = rows.filter((x) => words.every((w) => JSON.stringify(x).toLowerCase().includes(w)))
      const limit = Math.min(100, Math.max(1, Number(i.limit) || 25))
      return {
        content: json({ total: rows.length, records: rows.slice(0, limit).map((x) => slim(x, LIST_DROP[type] ?? [])) }),
        step: { label: `Listed ${type}${words.length ? ` matching “${i.filter}”` : ''} · ${rows.length}`, ok: true },
      }
    }

    case 'get_record': {
      const type = String(i.type)
      let record: Record<string, unknown> | null = null
      const extra: Record<string, unknown> = {}
      if (type === 'listing') {
        record = await findIn(ctx, 'listings', id)
        if (record) Object.assign(extra, await peopleAndDocs(ctx, 'property', id))
        const shown = await ctx.call('GET', `/api/lead-listings?property_id=${id}`)
        extra.shown_to = shown.json.data ?? []
      } else if (type === 'deal') {
        record = await findIn(ctx, 'deals', id)
        if (record) Object.assign(extra, await peopleAndDocs(ctx, 'transaction', id))
      } else if (type === 'lead') {
        const r = await ctx.call('GET', `/api/leads/${id}`)
        record = (r.json.data as Record<string, unknown>) ?? (r.status < 400 ? r.json : null)
        if (record) {
          Object.assign(extra, await peopleAndDocs(ctx, 'lead', id))
          const shown = await ctx.call('GET', `/api/lead-listings?lead_id=${id}`)
          extra.listings_shown = shown.json.data ?? []
        }
      } else if (type === 'contact') {
        const r = await ctx.call('GET', `/api/contacts/${id}`)
        if (r.status < 400) {
          record = r.json
          const docs = await ctx.call('GET', `/api/documents?entity_type=contact&entity_id=${id}`)
          extra.documents = ((docs.json.data as Record<string, unknown>[]) ?? []).map((d) => pick(d, ['id', 'name', 'category']))
        }
      }
      if (!record) return fail(`No ${type} ${id}`, `No ${type} with id ${id}. Search for it first.`)
      const title = String(record.title ?? record.reference ?? record.name ?? (record.contact as Record<string, unknown> | undefined)?.name ?? type)
      return {
        content: json({ [type]: slim(record), ...extra }),
        step: { label: `Opened ${title}`, href: hrefFor(type, id), ok: true },
      }
    }

    case 'dashboard': {
      const r = await ctx.call('GET', '/api/dashboard')
      return { content: json(r.json), step: { label: 'Read the dashboard', href: '/admin/dashboard', ok: r.status < 400 } }
    }

    case 'create_listing': {
      const body = { status: 'Draft', zone: 'North', extent_acres: 0, price_per_acre_cr: 0, ...i }
      const r = await ctx.call('POST', '/api/properties', body)
      const err = errorOf(r)
      if (err) return fail(`Couldn’t add listing ${i.code}`, /status_check/.test(err) ? 'Draft needs database migration 016 (Setup → Apply pending updates); use Live or retry after.' : err)
      const newId = String(r.json.id)
      return { content: json({ ok: true, id: newId, code: i.code }), step: { label: `Added listing ${i.code} · ${i.title}`, href: hrefFor('property', newId), ok: true } }
    }

    case 'update_listing': {
      const r = await ctx.call('PUT', `/api/properties/${id}`, i.changes)
      const err = errorOf(r)
      if (err) return fail('Couldn’t update the listing', err)
      return { content: json({ ok: true }), step: { label: `Updated listing (${Object.keys(i.changes as object).join(', ')})`, href: hrefFor('property', id), ok: true } }
    }

    case 'set_listing_photo': {
      const pub = await ctx.publishImage(String(i.document_id))
      if ('error' in pub) return fail('Couldn’t use that photo', pub.error)
      const r = await ctx.call('PUT', `/api/properties/${i.listing_id}`, { img_url: pub.url })
      const err = errorOf(r)
      if (err) return fail('Couldn’t set the listing photo', err)
      return { content: json({ ok: true, img_url: pub.url }), step: { label: 'Set the listing photo', href: hrefFor('property', String(i.listing_id)), ok: true } }
    }

    case 'property_register': {
      if (i.action === 'preview') {
        const r = await ctx.call('GET', '/api/properties/register')
        return { content: json(r.json), step: { label: 'Read the Property Register', ok: r.status < 400 } }
      }
      const r = await ctx.call('POST', '/api/properties/register', { ids: i.ids })
      if (r.status >= 500 && !(r.json.created as unknown[])?.length) return fail('Register import failed', r.json.failed ?? r.json.error)
      const created = (r.json.created as { code: string; id: string }[]) ?? []
      return {
        content: json(r.json),
        step: {
          label: `Imported ${created.length} from the Property Register${(r.json.skipped as unknown[])?.length ? ` · ${(r.json.skipped as unknown[]).length} already listed` : ''}`,
          href: '/admin/properties',
          ok: true,
        },
      }
    }

    case 'create_lead': {
      const r = await ctx.call('POST', '/api/leads', i)
      const err = errorOf(r)
      if (err) return fail(`Couldn’t add lead ${i.name}`, err)
      const newId = String(r.json.id ?? '')
      return { content: json(r.json), step: { label: `Added lead ${i.name}`, href: hrefFor('lead', newId), ok: true } }
    }

    case 'update_lead': {
      const r = await ctx.call('PUT', `/api/leads/${id}`, i.changes)
      const err = errorOf(r)
      if (err) return fail('Couldn’t update the lead', err)
      return { content: json({ ok: true }), step: { label: `Updated lead (${Object.keys(i.changes as object).join(', ')})`, href: hrefFor('lead', id), ok: true } }
    }

    case 'shortlist_listing': {
      const existing = await ctx.call('GET', `/api/lead-listings?lead_id=${i.lead_id}`)
      const row = ((existing.json.data as Record<string, unknown>[]) ?? []).find((x) => x.property_id === i.property_id)
      let r
      if (row) {
        r = await ctx.call('PATCH', `/api/lead-listings?id=${row.id}`, pick(i, ['status', 'feedback']))
      } else {
        r = await ctx.call('POST', '/api/lead-listings', { lead_id: i.lead_id, property_id: i.property_id })
        const created = r.json.data as Record<string, unknown> | undefined
        if (r.status < 400 && created?.id && (i.status || i.feedback)) {
          r = await ctx.call('PATCH', `/api/lead-listings?id=${created.id}`, pick(i, ['status', 'feedback']))
        }
      }
      const err = errorOf(r)
      if (err) return fail('Couldn’t record the listing on the lead', err)
      return {
        content: json({ ok: true }),
        step: { label: `${row ? 'Updated' : 'Shortlisted'} listing for the lead${i.status ? ` · ${i.status}` : ''}`, href: hrefFor('lead', String(i.lead_id)), ok: true },
      }
    }

    case 'convert_lead': {
      const { lead_id, ...rest } = i
      const r = await ctx.call('POST', `/api/leads/${lead_id}/convert`, rest)
      const err = errorOf(r)
      if (err) return fail('Couldn’t convert the lead', err)
      const dealId = String(r.json.id ?? r.json.transaction_id ?? '')
      return { content: json(r.json), step: { label: `Converted to deal ${r.json.reference ?? ''}`, href: hrefFor('transaction', dealId), ok: true } }
    }

    case 'find_matches': {
      const q = i.lead_id ? `lead_id=${i.lead_id}` : i.property_id ? `property_id=${i.property_id}` : ''
      if (!q) return fail('Matches', 'Give a lead_id or a property_id')
      const r = await ctx.call('GET', `/api/matches?${q}`)
      if (r.status >= 400) return fail('Couldn’t find matches', r.json.error)
      const brief = (list: unknown) =>
        ((list as Record<string, unknown>[]) ?? []).slice(0, 8).map((m) => {
          const item = (m.item as Record<string, unknown>) ?? {}
          return { ...pick(item, ['id', 'code', 'title', 'name', 'location', 'locations', 'price_total_cr', 'price_per_acre_cr', 'extent_acres', 'budget_min_cr', 'budget_max_cr', 'intent']), score: m.score, reasons: m.reasons, concerns: m.concerns, shown: m.shown }
        })
      return { content: json({ listings: brief(r.json.listings), leads: brief(r.json.leads) }), step: { label: 'Found matches', ok: true } }
    }

    case 'create_deal': {
      const r = await ctx.call('POST', '/api/transactions', i)
      const err = errorOf(r)
      if (err) return fail('Couldn’t open the deal', err)
      const newId = String(r.json.id ?? '')
      return { content: json(r.json), step: { label: `Opened deal ${r.json.reference} · ${i.property_label}`, href: hrefFor('transaction', newId), ok: true } }
    }

    case 'update_deal': {
      const r = await ctx.call('PUT', `/api/transactions/${id}`, i.changes)
      const err = errorOf(r)
      if (err) return fail('Couldn’t update the deal', err)
      return { content: json({ ok: true }), step: { label: `Updated deal (${Object.keys(i.changes as object).join(', ')})`, href: hrefFor('transaction', id), ok: true } }
    }

    case 'create_contact': {
      const r = await ctx.call('POST', '/api/contacts', i)
      if (r.status === 409 && r.json.duplicate) {
        const d = r.json.duplicate as Record<string, unknown>
        return {
          content: json({ error: r.json.error, existing_contact: d }),
          step: { label: `${d.name} already on file`, href: hrefFor('contact', String(d.id)), ok: false },
          isError: true,
        }
      }
      const err = errorOf(r)
      if (err) return fail(`Couldn’t save ${i.name}`, err)
      const newId = String(r.json.id ?? '')
      const agent = (i.roles as string[] | undefined)?.includes('Agent')
      return { content: json(r.json), step: { label: `Saved ${agent ? 'agent' : 'contact'} ${i.name}`, href: hrefFor('contact', newId), ok: true } }
    }

    case 'update_contact': {
      const r = await ctx.call('PUT', `/api/contacts/${id}`, i.changes)
      const err = errorOf(r)
      if (err) return fail('Couldn’t update the contact', err)
      return { content: json({ ok: true }), step: { label: `Updated contact (${Object.keys(i.changes as object).join(', ')})`, href: hrefFor('contact', id), ok: true } }
    }

    case 'link_person': {
      const r = await ctx.call('POST', '/api/contact-links', i)
      const err = errorOf(r)
      if (err) return fail('Couldn’t link them', err)
      return {
        content: json(r.json),
        step: { label: `Linked as ${i.role}${i.entity_label ? ` on ${i.entity_label}` : ''}`, href: hrefFor(String(i.entity_type), String(i.entity_id)), ok: true },
      }
    }

    case 'update_involvement': {
      const { link_id, ...rest } = i
      const r = await ctx.call('PATCH', `/api/contact-links?id=${link_id}`, rest)
      const err = errorOf(r)
      if (err) return fail('Couldn’t update the terms', err)
      return { content: json(r.json), step: { label: `Updated terms${i.payout_status ? ` · payout ${i.payout_status}` : ''}`, ok: true } }
    }

    case 'suggest_agents': {
      const r = await ctx.call('GET', `/api/agents/suggest?entity_type=${i.entity_type}&entity_id=${i.entity_id}`)
      return { content: json(r.json), step: { label: `Suggested ${((r.json.data as unknown[]) ?? []).length} agents`, ok: r.status < 400 } }
    }

    case 'create_task': {
      const r = await ctx.call('POST', '/api/tasks', i)
      const err = errorOf(r)
      if (err) return fail('Couldn’t add the task', err)
      return {
        content: json(r.json),
        step: { label: `Task: ${i.title}${i.due_at ? ` · due ${new Date(String(i.due_at)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}` : ''}`, href: hrefFor(String(i.entity_type), String(i.entity_id ?? '')) ?? '/admin/notes-tasks', ok: true },
      }
    }

    case 'update_task': {
      const { id: _id, ...rest } = i
      void _id
      const r = await ctx.call('PATCH', `/api/tasks/${id}`, rest)
      const err = errorOf(r)
      if (err) return fail('Couldn’t update the task', err)
      return { content: json({ ok: true }), step: { label: i.status === 'Done' ? 'Marked task done' : 'Updated task', href: '/admin/notes-tasks', ok: true } }
    }

    case 'add_note': {
      const r = await ctx.call('POST', '/api/notes', i)
      const err = errorOf(r)
      if (err) return fail('Couldn’t save the note', err)
      return {
        content: json(r.json),
        step: { label: `Note${i.entity_label ? ` on ${i.entity_label}` : ''}`, href: hrefFor(String(i.entity_type), String(i.entity_id ?? '')) ?? '/admin/notes-tasks?view=notes', ok: true },
      }
    }

    case 'schedule_meeting': {
      const r = await ctx.call('POST', '/api/meetings', i)
      const err = errorOf(r)
      if (err) return fail('Couldn’t book the meeting', err)
      const newId = String(r.json.id ?? '')
      const when = new Date(String(i.scheduled_at)).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
      return { content: json(r.json), step: { label: `${String(i.title).toLowerCase().startsWith(String(i.kind ?? 'meeting').toLowerCase()) ? '' : `${i.kind ?? 'Meeting'}: `}${i.title} · ${when}`, href: hrefFor('meeting', newId), ok: true } }
    }

    case 'read_document': {
      const r = await ctx.readDocument(String(i.document_id))
      if ('error' in r) return fail('Couldn’t open the document', r.error)
      return { content: [{ type: 'text', text: r.note }, ...r.blocks], step: { label: `Read ${r.note.replace(/^Document: /, '').split(' (')[0]}`, ok: true } }
    }

    case 'attach_document': {
      const { document_id, ...rest } = i
      const r = await ctx.call('PATCH', `/api/documents/${document_id}`, rest)
      const err = errorOf(r)
      if (err) return fail('Couldn’t file the document', err)
      const d = (r.json.data as Record<string, unknown>) ?? {}
      return {
        content: json({ ok: true, document: pick(d, ['id', 'name', 'category', 'entity_type', 'entity_label', 'storage']) }),
        step: { label: `Filed ${d.name ?? 'document'}${i.entity_label ? ` on ${i.entity_label}` : ''}${i.category ? ` · ${i.category}` : ''}`, href: hrefFor(String(i.entity_type), String(i.entity_id)), ok: true },
      }
    }

    case 'delete_record': {
      if (i.confirmed !== true) return fail('Delete needs confirmation', 'Ask the user to confirm this deletion first.')
      const path: Record<string, string> = {
        listing: `/api/properties/${id}`,
        deal: `/api/transactions/${id}`,
        lead: `/api/leads/${id}`,
        contact: `/api/contacts/${id}`,
        task: `/api/tasks/${id}`,
        note: `/api/notes/${id}`,
        meeting: `/api/meetings/${id}`,
        document: `/api/documents/${id}`,
        link: `/api/contact-links?id=${id}`,
      }
      const r = await ctx.call('DELETE', path[String(i.type)])
      const err = errorOf(r)
      if (err) return fail(`Couldn’t delete the ${i.type}`, err)
      return { content: json({ ok: true }), step: { label: `Deleted ${i.type}`, ok: true } }
    }
  }
  return fail(name, `Unknown tool ${name}`)
}
