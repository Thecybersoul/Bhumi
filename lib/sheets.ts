import { google, type sheets_v4 } from 'googleapis'
import { createServiceClient, hasSupabase } from './supabase'
import { erpRootFolderId, getClient, hasService } from './google'

/* ═══════════════════════════════════════════════════════════
   Google Sheets — the live register.

   One spreadsheet, "Bhumi Estates ERP — Register", in the company
   Drive's Bhumi Estates ERP folder, with a tab each for Listings,
   Deals, Leads, Meetings, Tasks and the Activity trail. Anyone who
   can open the Drive gets a filterable, shareable view of the
   business without the app: for a partner, an accountant or a
   Monday review.

   It is a mirror, one-way. The ERP is the source of truth and each
   sync rewrites the tabs, so edits made in the sheet are overwritten.
   It syncs:
     - on demand (Profile → Sync now),
     - on its own after changes, at most every ten minutes
       (syncIfStale, called from the activity logger), and
     - daily from Vercel Cron (/api/cron/sheets).

   Values are written RAW, never parsed as formulas, because some
   cells hold text typed on the public website, e.g. a lead's name.
   ═══════════════════════════════════════════════════════════ */

const KEY = 'sheets_register'
const TITLE = 'Bhumi Estates ERP — Register'

interface State {
  id?: string
  url?: string
  last_synced_at?: string
  synced_by?: string
  error?: string
}

async function getState(): Promise<State> {
  if (!hasSupabase()) return {}
  const { data } = await createServiceClient().from('app_settings').select('value').eq('key', KEY).maybeSingle()
  return (data?.value as State) ?? {}
}

async function setState(patch: State) {
  const next = { ...(await getState()), ...patch }
  await createServiceClient().from('app_settings').upsert({ key: KEY, value: next, updated_at: new Date().toISOString() })
  return next
}

export async function registerStatus() {
  const state = await getState().catch(() => ({}) as State)
  return { enabled: await hasService('sheets'), ...state }
}

/* ─── What goes in each tab ─────────────────────────────── */

type Cell = string | number | boolean | null
type Row = Record<string, unknown>

const ist = (v: unknown) =>
  v ? new Date(String(v)).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
const str = (v: unknown): Cell => (v == null ? '' : typeof v === 'number' || typeof v === 'boolean' ? v : String(v))

interface Tab {
  title: string
  table: string
  order: string
  columns: [string, (r: Row) => Cell][]
  /** PostgREST select, when a tab needs a joined record (default '*'). */
  select?: string
  /** Keep only some rows of the table. */
  keep?: (r: Row) => boolean
}

const TABS: Tab[] = [
  {
    title: 'Listings',
    table: 'properties',
    order: 'created_at',
    columns: [
      ['Code', (r) => str(r.code)],
      ['Title', (r) => str(r.title)],
      ['Status', (r) => str(r.status)],
      ['Type', (r) => str(r.property_type)],
      ['Location', (r) => str(r.location)],
      ['Corridor', (r) => str(r.corridor)],
      ['Extent (acres)', (r) => str(r.extent_acres)],
      ['Built-up (sq ft)', (r) => str(r.built_up_sqft)],
      ['Price / acre (₹ Cr)', (r) => str(r.price_per_acre_cr)],
      ['Headline price (₹ Cr)', (r) => str(r.price_total_cr)],
      ['Price / sq ft (₹)', (r) => str(r.price_per_sqft)],
      ['Price type', (r) => str(r.price_type)],
      ['Khata', (r) => str(r.khata)],
      ['Conversion', (r) => str(r.conversion)],
      ['Featured', (r) => (r.featured ? 'Yes' : 'No')],
      ['Added by', (r) => str(r.created_by)],
      ['Added', (r) => ist(r.created_at)],
      ['Last edited by', (r) => str(r.updated_by)],
      ['Last edited', (r) => ist(r.updated_at)],
    ],
  },
  {
    title: 'Deals',
    table: 'transactions',
    order: 'opened_at',
    columns: [
      ['Reference', (r) => str(r.reference)],
      ['Deal', (r) => str(r.property_label)],
      ['Stage', (r) => str(r.stage)],
      ['Outcome', (r) => str(r.outcome)],
      ['Buyer', (r) => str(r.buyer_name)],
      ['Buyer phone', (r) => str(r.buyer_phone)],
      ['Seller', (r) => str(r.seller_name)],
      ['Seller phone', (r) => str(r.seller_phone)],
      ['Representing', (r) => str(r.representing)],
      ['Deal value (₹ Cr)', (r) => str(r.deal_value_cr)],
      ['Commission', (r) => (r.commission_value == null ? '' : `${r.commission_value}${r.commission_type === 'Percentage' ? '%' : ' L flat'}`)],
      ['Commission collected', (r) => (r.commission_collected ? 'Yes' : 'No')],
      ['Advisor', (r) => str(r.advisor)],
      ['Lost reason', (r) => str(r.lost_reason)],
      ['Opened', (r) => ist(r.opened_at)],
      ['Closed', (r) => ist(r.closed_at)],
      ['Added by', (r) => str(r.created_by)],
      ['Last edited by', (r) => str(r.updated_by)],
      ['Last edited', (r) => ist(r.updated_at)],
    ],
  },
  {
    title: 'Leads',
    table: 'leads',
    order: 'created_at',
    columns: [
      ['Received', (r) => ist(r.created_at)],
      ['Name', (r) => str(r.name)],
      ['Phone', (r) => str(r.phone)],
      ['Email', (r) => str(r.email)],
      ['Company', (r) => str(r.company)],
      ['Kind', (r) => str(r.kind)],
      ['Channel', (r) => str(r.channel)],
      ['Stage', (r) => str(r.stage)],
      ['Intent', (r) => str(r.intent)],
      ['Priority', (r) => str(r.priority)],
      ['Type wanted', (r) => str(r.property_type)],
      ['Areas', (r) => str(r.locations || r.corridor)],
      ['Budget from (₹ Cr)', (r) => str(r.budget_min_cr)],
      ['Budget to (₹ Cr)', (r) => str(r.budget_max_cr)],
      ['Size', (r) => str(r.size_requirement)],
      ['Owner', (r) => str(r.assigned_to)],
      ['Next follow-up', (r) => ist(r.next_follow_up_at)],
      ['Listing', (r) => str(r.property_code)],
      ['Source', (r) => str(r.source)],
      ['Notes', (r) => str(r.notes)],
      ['Lost reason', (r) => str(r.lost_reason)],
      ['Last handled by', (r) => str(r.updated_by)],
    ],
  },
  {
    title: 'Contacts',
    table: 'contacts',
    order: 'created_at',
    columns: [
      ['Name', (r) => str(r.name)],
      ['Roles', (r) => (Array.isArray(r.roles) ? (r.roles as string[]).join(', ') : '')],
      ['Phone', (r) => str(r.phone)],
      ['Other phone', (r) => str(r.alt_phone)],
      ['Email', (r) => str(r.email)],
      ['Company', (r) => str(r.company)],
      ['City', (r) => str(r.city)],
      ['Source', (r) => str(r.source)],
      ['Notes', (r) => str(r.notes)],
      ['Added', (r) => ist(r.created_at)],
      ['Added by', (r) => str(r.created_by)],
    ],
  },
  {
    title: 'Agents',
    table: 'contacts',
    order: 'created_at',
    keep: (r) => Array.isArray(r.roles) && (r.roles as string[]).includes('Agent'),
    columns: [
      ['Name', (r) => str(r.name)],
      ['Agency', (r) => str(r.agency)],
      ['RERA no.', (r) => str(r.rera_number)],
      ['Status', (r) => str(r.agent_status)],
      ['Rating', (r) => str(r.rating)],
      ['Phone', (r) => str(r.phone)],
      ['Email', (r) => str(r.email)],
      ['Works in', (r) => str(r.operating_areas)],
      ['Handles', (r) => (Array.isArray(r.specialties) ? (r.specialties as string[]).join(', ') : '')],
      ['Usual share %', (r) => str(r.default_share_pct)],
      ['GSTIN', (r) => str(r.gstin)],
      ['Added', (r) => ist(r.created_at)],
    ],
  },
  {
    title: 'Agent commissions',
    table: 'contact_links',
    order: 'created_at',
    select: '*, contact:contacts(name, agency, roles)',
    keep: (r) => Boolean(r.share_type) || Boolean((r.contact as Row | null)?.roles && ((r.contact as Row).roles as string[]).includes('Agent')),
    columns: [
      ['Agent', (r) => str((r.contact as Row | null)?.name)],
      ['Agency', (r) => str((r.contact as Row | null)?.agency)],
      ['On', (r) => ({ transaction: 'Deal', property: 'Listing', lead: 'Lead', task: 'Task', note: 'Note', meeting: 'Meeting', verification: 'Verification' })[String(r.entity_type ?? '')] ?? String(r.entity_type ?? '')],
      ['Record', (r) => str(r.entity_label)],
      ['Role', (r) => str(r.role)],
      ['Share', (r) => str(r.share_type)],
      ['Share value', (r) => str(r.share_value)],
      ['Payout', (r) => str(r.payout_status)],
      ['Paid (₹ lakh)', (r) => str(r.payout_amount_lakh)],
      ['Paid on', (r) => ist(r.paid_at)],
      ['Payment ref', (r) => str(r.payout_ref)],
    ],
  },
  {
    title: 'Shown to clients',
    table: 'lead_properties',
    order: 'created_at',
    columns: [
      ['Listing', (r) => str(r.property_label)],
      ['Status', (r) => str(r.status)],
      ['Feedback', (r) => str(r.feedback)],
      ['Shared', (r) => ist(r.shared_at)],
      ['Visited', (r) => ist(r.visited_at)],
      ['Added', (r) => ist(r.created_at)],
      ['By', (r) => str(r.updated_by || r.created_by)],
      ['Lead id', (r) => str(r.lead_id)],
    ],
  },
  {
    title: 'Meetings',
    table: 'meetings',
    order: 'scheduled_at',
    columns: [
      ['When', (r) => ist(r.scheduled_at)],
      ['Kind', (r) => str(r.kind)],
      ['Title', (r) => str(r.title)],
      ['Related to', (r) => str(r.entity_label)],
      ['With', (r) => str(r.attendees)],
      ['Where', (r) => str(r.location)],
      ['Minutes', (r) => str(r.duration_min)],
      ['Status', (r) => str(r.status)],
      ['Outcome', (r) => str(r.outcome)],
      ['Meet link', (r) => str(r.google_meet_url)],
      ['Logged by', (r) => str(r.created_by)],
    ],
  },
  {
    title: 'Tasks',
    table: 'tasks',
    order: 'created_at',
    columns: [
      ['Task', (r) => str(r.title)],
      ['Status', (r) => str(r.status)],
      ['Priority', (r) => str(r.priority)],
      ['Due', (r) => ist(r.due_at)],
      ['Related to', (r) => str(r.entity_label)],
      ['Created by', (r) => str(r.created_by)],
      ['Created', (r) => ist(r.created_at)],
      ['Completed', (r) => ist(r.completed_at)],
      ['Last edited by', (r) => str(r.updated_by)],
    ],
  },
  {
    title: 'Activity',
    table: 'activity_log',
    order: 'created_at',
    columns: [
      ['When', (r) => ist(r.created_at)],
      ['Who', (r) => str(r.actor_name)],
      ['Action', (r) => str(r.action)],
      ['Record type', (r) => str(r.entity_type)],
      ['Record', (r) => str(r.entity_label)],
      ['Detail', (r) => str(r.summary)],
    ],
  },
]

async function fetchRows(tab: Tab): Promise<Row[]> {
  let q = createServiceClient().from(tab.table).select(tab.select ?? '*').order(tab.order, { ascending: false }).limit(tab.table === 'activity_log' ? 2000 : 5000)
  if (tab.table === 'activity_log') q = q.neq('action', 'login')
  const { data } = await q
  const rows = (data ?? []) as unknown as Row[]
  return tab.keep ? rows.filter(tab.keep) : rows
}

/* ─── The spreadsheet itself ────────────────────────────── */

const NAVY = { red: 14 / 255, green: 59 / 255, blue: 46 / 255 }
const WHITE = { red: 1, green: 1, blue: 1 }

async function ensureSpreadsheet(sheets: sheets_v4.Sheets, drive: ReturnType<typeof google.drive>, state: State) {
  if (state.id) {
    const ok = await drive.files
      .get({ fileId: state.id, fields: 'id,trashed' })
      .then((r) => !r.data.trashed)
      .catch(() => false)
    if (ok) return { id: state.id, url: state.url ?? `https://docs.google.com/spreadsheets/d/${state.id}` }
  }
  const { data } = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: TITLE, locale: 'en_GB', timeZone: 'Asia/Kolkata' },
      sheets: [{ properties: { title: 'Summary', index: 0 } }, ...TABS.map((t, i) => ({ properties: { title: t.title, index: i + 1, gridProperties: { frozenRowCount: 1 } } }))],
    },
  })
  const id = data.spreadsheetId!
  const root = await erpRootFolderId()
  if (root) await drive.files.update({ fileId: id, addParents: root, removeParents: 'root', fields: 'id' }).catch(() => {})

  // House style once, at creation: brand-green bold header row.
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: id,
    requestBody: {
      requests: (data.sheets ?? []).map((s) => ({
        repeatCell: {
          range: { sheetId: s.properties!.sheetId!, startRowIndex: 0, endRowIndex: 1 },
          cell: { userEnteredFormat: { backgroundColor: NAVY, textFormat: { bold: true, foregroundColor: WHITE } } },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      })),
    },
  })
  return { id, url: data.spreadsheetUrl ?? `https://docs.google.com/spreadsheets/d/${id}` }
}

/** A register created before a tab was added to TABS gets that tab
    (header styled like the rest) instead of failing the whole sync. */
async function ensureTabs(sheets: sheets_v4.Sheets, id: string) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: id, fields: 'sheets(properties(title))' })
  const have = new Set((meta.data.sheets ?? []).map((s) => s.properties?.title))
  const missing = TABS.filter((t) => !have.has(t.title))
  if (!missing.length) return
  const added = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: id,
    requestBody: { requests: missing.map((t) => ({ addSheet: { properties: { title: t.title, gridProperties: { frozenRowCount: 1 } } } })) },
  })
  const ids = (added.data.replies ?? []).map((r) => r.addSheet?.properties?.sheetId).filter((x): x is number => x != null)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: id,
    requestBody: {
      requests: ids.map((sheetId) => ({
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
          cell: { userEnteredFormat: { backgroundColor: NAVY, textFormat: { bold: true, foregroundColor: WHITE } } },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      })),
    },
  })
}

/** Rewrite every tab from the database. Returns the sheet's URL. */
export async function syncRegister(syncedBy: string): Promise<State> {
  if (!(await hasService('sheets'))) throw new Error('Google Drive/Sheets is not connected')
  const auth = await getClient()
  if (!auth) throw new Error('Google is not connected')
  const sheets = google.sheets({ version: 'v4', auth })
  const drive = google.drive({ version: 'v3', auth })

  try {
    const state = await getState()
    const { id, url } = await ensureSpreadsheet(sheets, drive, state)
    await ensureTabs(sheets, id)

    const tabs = await Promise.all(
      TABS.map(async (t) => {
        const rows = await fetchRows(t)
        return { t, values: [t.columns.map(([h]) => h), ...rows.map((r) => t.columns.map(([, f]) => f(r)))] as Cell[][] }
      })
    )
    const now = new Date()
    const summary: Cell[][] = [
      ['Bhumi Estates ERP — Register', ''],
      ['Last synced', ist(now.toISOString())],
      ['Synced by', syncedBy],
      ['', ''],
      ['Tab', 'Rows'],
      ...tabs.map(({ t, values }) => [t.title, values.length - 1] as Cell[]),
      ['', ''],
      ['Note', 'This sheet mirrors the ERP and is rewritten on every sync. Make changes in the app, not here.'],
    ]

    await sheets.spreadsheets.values.batchClear({
      spreadsheetId: id,
      requestBody: { ranges: ['Summary', ...TABS.map((t) => t.title)] },
    })
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: id,
      requestBody: {
        valueInputOption: 'RAW',
        data: [{ range: 'Summary!A1', values: summary }, ...tabs.map(({ t, values }) => ({ range: `'${t.title}'!A1`, values }))],
      },
    })

    // Fit columns to content and put a filter on every data tab.
    const meta = await sheets.spreadsheets.get({ spreadsheetId: id, fields: 'sheets(properties(sheetId,title),basicFilter)' })
    const requests: sheets_v4.Schema$Request[] = []
    for (const s of meta.data.sheets ?? []) {
      const sheetId = s.properties!.sheetId!
      const tab = tabs.find((x) => x.t.title === s.properties!.title)
      requests.push({ autoResizeDimensions: { dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: tab ? tab.t.columns.length : 2 } } })
      if (tab) {
        if (s.basicFilter) requests.push({ clearBasicFilter: { sheetId } })
        requests.push({ setBasicFilter: { filter: { range: { sheetId, startRowIndex: 0, endRowIndex: tab.values.length, startColumnIndex: 0, endColumnIndex: tab.t.columns.length } } } })
      }
    }
    if (requests.length) await sheets.spreadsheets.batchUpdate({ spreadsheetId: id, requestBody: { requests } }).catch(() => {})

    return setState({ id, url, last_synced_at: now.toISOString(), synced_by: syncedBy, error: '' })
  } catch (e) {
    await setState({ error: (e as Error).message }).catch(() => {})
    throw e
  }
}

let inFlight = false
/** Sync unless the register was synced in the last `minutes`. Never throws. */
export async function syncIfStale(syncedBy: string, minutes = 10) {
  if (inFlight) return
  try {
    if (!(await hasService('sheets'))) return
    const state = await getState()
    if (state.last_synced_at && Date.now() - new Date(state.last_synced_at).getTime() < minutes * 60_000) return
    inFlight = true
    await syncRegister(syncedBy)
  } catch (e) {
    console.error('[bhumi] sheets sync failed', e)
  } finally {
    inFlight = false
  }
}
