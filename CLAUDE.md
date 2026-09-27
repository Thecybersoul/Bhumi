# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # localhost:3000 — fully functional with no env vars at all
npm run build          # production build; also the only type check (see below)
npm start              # serve the production build
npm run migrate:check  # report which database tables exist, change nothing
npm run migrate        # apply schema.sql then every migration, oldest first
```

**There is no test suite, no linter and no separate typecheck script.** `next build` runs TypeScript, and
that is the whole automated safety net. `npx tsc --noEmit -p tsconfig.json` is faster than a full build when
you only need types.

Turbopack's dev server writes generated types into `.next/dev`. If `npm run dev` is running while you build,
the build can fail inside `.next/dev/types/validator.ts` with a syntax error that has nothing to do with your
change. Stop the dev server and `rm -rf .next/dev` before building.

### Regenerating brand assets

Both scripts read the SVGs in `public/img/logos/` and rewrite committed binaries. Re-run after any change to
the logo artwork, in this order:

```bash
node scripts/gen-share-assets.js   # the icon tile + the 1200x630 share card
node scripts/gen-icons.js          # rasterises the tile into every favicon and app icon
```

`gen-share-assets.js` builds `bhumi-estates-favicon.svg` (the monogram on a rounded green tile) from
`bhumi-estates-icon-dark.svg`. `gen-icons.js` consumes that file, so running it alone after a logo change
will rasterise a stale tile. `scripts/gen-wordmark.js` exists but its hard-coded crop no longer matches the
current artwork — treat it as stale.

## Architecture

### Everything degrades to the codebase, in two independent layers

This is the single most important property of the app and it is why pages never throw when Supabase is down
or unconfigured. Two separate mechanisms implement it and they are easy to confuse:

- **`lib/db.ts` — records.** Properties, verification cases, leads, transparency stats, data-room requests.
  Every read goes through one `read()` helper that returns `{ data, source: 'live' | 'fallback' }`, falling
  back to `lib/data/seed.ts` on a missing table, an error, *or an empty result*. The `source` is surfaced in
  the admin as a `Seeded data` / `Live database` pill.
- **`lib/cms.ts` — page copy.** Values are deep-merged *over* the default compiled into
  `lib/content/schema.ts`, field by field, with a 15s in-process cache. A partial or bad write therefore
  cannot blank a section, and a block that gains a field in code still resolves that field from the default.

Both modules read the service-role key and are server-only. `lib/cms.ts` and `lib/auth.ts` are the enforced
boundary — importing them from a client component is a build error.

### `lib/content/schema.ts` is the contract for editability

Every editable block is declared once: its key, its field list and types, and the default value. The public
site reads the default; the admin reads the field list and *generates the form*. Adding an editable field is
an edit to this one file, not a new admin screen. `app/api/content/route.ts` also validates against it and
silently drops any field the schema does not declare, so a caller cannot invent blocks or write arbitrary
rows.

### Middleware is `proxy.ts`, not `middleware.ts`

Next.js 16 renamed the file convention. `proxy.ts` at the repo root **is** the live middleware — it guards
everything under `/admin` except `/admin/login`, verifying the HMAC signature of the session cookie rather
than merely checking that a cookie exists. Do not "fix" this by renaming it to `middleware.ts`. You can
confirm it is running: the dev server logs `proxy.ts: NNNms` on matched requests.

Auth is deliberately checked twice — in `proxy.ts` and again server-side in the admin layout — so a matcher
mistake cannot leak a page on its own. Sessions are signed and expire after 8 hours (`lib/session.ts`).

### Database setup is the usual reason things look broken

The app runs correctly with no database, which means a half-migrated database looks like working software
with mysteriously unsaveable forms. `/admin/setup` is the diagnostic: it probes each expected table with a
real `select` (a head-only count returns a false "exists, empty" for tables PostgREST has never heard of) and
offers each migration's SQL to copy.

Migrations live in `supabase/`, applied in order: `schema.sql`, then `migrations/004`–`016`.
**006 creates `site_content` and `media`** — without it the content editor and media library cannot save
anything and uploads fail outright. **007 creates `transactions`** — the deal pipeline, separate from
`properties` (inventory on offer). **008 creates `notes` and `tasks`** — the ERP's follow-up memory; both
have optional `entity_type`/`entity_id`/`entity_label` columns so a note or task can point at a specific
lead, transaction, property or verification case, but the shipped UI (`/admin/notes-tasks`) only writes
`entity_type: 'general'` for now — per-record linking is future work, not yet built. **009** adds Google
Calendar sync, **010** the extra listing fields, and **011 creates `documents`**, the files attached to a
listing, note, transaction, lead or verification case. **014** adds notification prefs, and **015 creates
`contacts`, `contact_links` and `lead_properties`** and gives leads their pipeline fields (see below). `schema.sql` itself
carries no seed data by design — a listing represents real land, so demo rows belong only in
`lib/data/seed.ts`, the in-code fallback. The service-role key reaches PostgREST and Storage but *cannot*
execute DDL, so migrations need a real Postgres connection string: `SUPABASE_DB_URL`, or the
`POSTGRES_URL*`/`DATABASE_URL` the Supabase ↔ Vercel integration injects. `lib/migrator.js` applies each file
once and records it in `schema_migrations`. A database migrated by hand is baselined from per-file markers, so
it is never re-run: 015's intent flip would undo later edits. `npm run build` runs `scripts/migrate.js --deploy`
first. It migrates only when `VERCEL_ENV=production`, because previews share the database, and it never fails
the build. Setup's **Apply pending updates** (`/api/admin/migrate`) does the same on demand. `/api/health`
reports `schema.current` (is 016 in?) and `schema.auto_migrate` (is a connection string present?).

### The web admin and the app are one ERP with one structure

The web admin (`/admin`) mirrors the mobile app screen for screen:
- **Workspace:** Home (`/admin/dashboard`), Deals (`/admin/deals`, with a `/admin/deals/[id]` editor),
  Listings (`/admin/properties` plus `[id]`), Meetings (`/admin/meetings` plus `[id]`), and Tasks & notes.
- **Records:** Notifications, Documents, Team activity.
- **Website:** the content editors and Media.
- **Profile** sits at the sidebar foot and covers the account, team, Google Workspace, Sheets and email
  digest.

The pages are client components in `components/erp/` (`HomeView`, `DealsView`, `DealEditor`,
`ListingsView`, `ListingEditor`, `MeetingsView`, `MeetingEditor`, `TasksView`, `ProfileView`,
`RecordsViews`). They call the same `/api/*` routes as the app, with the session cookie instead of the
bearer token, so both surfaces always agree and write the same activity trail. When you change a screen in
one, change it in the other. Styles are the `.erp*` block at the end of `app/components.css`, and icons come
from `lucide-react`, the same Ionicons-like set the app uses. `/admin/deals` keeps Pipeline, Leads and
Document requests as tabs of one page, and `/admin/properties` keeps Listings and Verification together
(`?tab=` preselects). That consolidation is deliberate.

Metrics and Business plan (`/admin/metrics`, `/admin/plan`) are static reference material tied to the
original business-plan document. They're intentionally **not in the sidebar nav** (routes still work,
reachable by URL) — day-to-day ERP use doesn't need them front and center. Setup lives in the sidebar
footer, not the main nav, for the same reason: it's a utility you check when something looks wrong, not
part of the daily flow.

### Named accounts and the activity trail (migration 012)

The admin runs on named accounts (`admin_users`: Chethan, Sanjog, Ranjith), and they all have the same access.
Passwords are stored as scrypt hashes, created by `node scripts/create-admin-users.js <file-outside-repo>`
(add `--reset` to issue new ones). The script writes plaintext only to that file, never into the repo. A
session token is `<expiry>.<userId>.<hmac>`, and `currentUser()` in `lib/auth.ts` resolves it to an active
account. Once any named account exists, the old shared `ADMIN_EMAIL`/`ADMIN_PASSWORD` login is refused,
along with every token issued under it.

**Attribution is automatic.** `insert`/`update`/`remove` in `lib/db.ts` stamp `created_by`/`updated_by`/
`updated_at` and write `activity_log` (who, what, and for updates the changed fields old → new) for every
table in `AUDITED` (`lib/activity.ts`). A new ERP table gets this for free if it's added there and written
through those helpers. Writes that bypass them (documents, site content, media, the Google connection) call
`logActivity()` themselves. Public writes (website enquiries) are attributed to "Website".

**Meetings** (`meetings` table, `/api/meetings`) record in-person meetings, site visits, calls, video calls
and discussions, each optionally linked to a listing, deal, task or lead. When Google is connected, new
meetings go on the shared calendar, and video calls get a Meet link. Edits and cancellations update the
event. The old `transactions.meetings` JSON array was copied into this table by 012 and is no longer written.

**Google is one company account.** `info@bhumiestates.in` (override with `GOOGLE_WORKSPACE_EMAIL`), shared
by everyone. The OAuth callback refuses and revokes any other Google account. `google_auth` records who
connected it. In Drive, listings, deals and verification cases each get their own folder, found by an
`appProperties` tag rather than by name, so renaming a listing renames its folder. Each folder has category
subfolders (Title deed, EC, …). Notes, meetings and tasks are filed in month folders. A folder is created
as soon as a listing or deal is created (`after()` in the POST routes).

**Gmail, Meet and Sheets (migration 013)** use the same connection, and the scopes are listed in
`SERVICE_SCOPES` (`lib/google.ts`). `/api/admin/google/status` reports each service and flags any missing
ones. A connection made before a scope was added needs a reconnect. What each service does:
- **Gmail** (`lib/gmail.ts`, `/api/email`) — send only (`gmail.send`). It sends from info@ with the sender's
  name in the display name, attaches ERP documents up to 18 MB, and logs each email in `emails`
  against its record.
- **Meet** (`lib/meet.ts`) — `/api/meet/instant` opens a room for a call happening now and logs it as a
  video-call meeting. `/api/meetings/:id/attendance` reads participants, recordings and transcripts.
- **Sheets** (`lib/sheets.ts`) — keeps a one-way mirror spreadsheet, "Bhumi Estates ERP — Register", with
  one tab per record type, written RAW. It re-syncs after a change if it's more than 10 minutes stale
  (via `after()` in `logActivity`), on demand (`POST /api/sheets`), and daily from Vercel Cron
  (`/api/cron/sheets`, which needs `CRON_SECRET`). It needs no scope beyond `drive.file`.

### Leads, contacts and matching (migration 015)

**A lead is a person's requirement; a contact is the person.** `contacts` holds everyone (buyers, sellers,
landowners, brokers, lawyers), deduplicated by `phone_norm`: digits with the 91 prefix, computed by
`normPhone()` in `lib/contacts.ts` and by the `bhumi_phone_norm()` SQL function, which must agree.
`ensureContact()` finds or creates a person by phone, then email, then an exact name when neither is given.
Website enquiries, advisor-added leads and deal parties (`partyContacts()` in `lib/transactions.ts`) all go
through it, so one person keeps one card. `leads.contact_id` is the lead's person, and
`transactions.buyer_/seller_contact_id` are a deal's. `contact_links` tags a contact on any other record
with a role. Editing a contact's name, phone or email mirrors onto their leads and open deals.

**Lead stages:** New → Contacted → Qualified → Visit (shown as "Site visit") → Negotiation, then Converted /
Lost / Nurture. `Closed` is a pre-015 value that is read but never written. `PATCH /api/leads?id&stage` is
kept in that exact shape because installed app builds call it. `POST /api/leads/:id/convert` opens a deal
through `createTransaction()`, the same function `POST /api/transactions` uses. It can take a second lead
(e.g. the seller lead for a buyer) and marks both Converted. `lead_properties` records which listings were
shown to which lead, with status and feedback. Every change to it is logged on the lead.

**Matching** (`lib/matching.ts`, `GET /api/matches`) is a transparent score over three things: type, place
words and price vs budget. Each point carries a reason string the UI shows, so keep it explainable rather
than clever. Only live rows are matched, never the seed fallback.

Before 015 is applied the app still works. Pre-015 features are unaffected, and new writes fail with
`schemaHint()`'s "apply migration 015" message. `contactsReady()` probes once per process and retries until
the table appears. The web lead and contact pages are `/admin/deals/leads/[id]` and
`/admin/deals/contacts/[id]`, and the app has `lead/[id]` and `contact/[id]`. The shared panels are in
`components/erp/leadPanels.tsx` and `contacts.tsx`, and in `mobile/src/components/` under the same names.
New records can take files before they have an id (`PendingDocs` on web, `PendingFiles` in the app). The
files upload straight after the save.

### The ERP assistant (`/admin/assistant`)

A chat that runs the ERP from plain language: add listings, leads, deals, contacts and agents, link people with
commission terms, log tasks, notes and meetings, read and file documents, and answer questions from the data.
`app/api/assistant/route.ts` is a manual, streaming tool loop on `claude-opus-5` with adaptive thinking and
`fallbacks: 'default'` (beta `server-side-fallback-2026-07-01`), sending server-sent events to the page. The
tools (`lib/assistant/tools.ts`) **only call the ERP's own `/api/*` routes**, with the signed-in person's cookie
or bearer token forwarded. So the assistant can't do anything that person couldn't, and every write gets the
same validation, Drive folders, Calendar events and activity trail. Add a capability by adding a route first,
then a tool that calls it. Tool inputs stream eagerly, so `validateInput()` checks each one against its schema
before it runs. Deletes need `confirmed: true`, which the prompt reserves for an explicit request.

The browser keeps the conversation (localStorage) and sends it whole each turn. Files the user attaches are
uploaded through the normal two-step document upload as `general`. `read_document` uploads a copy to
Anthropic's Files API (seven-day expiry), so the history carries a `file_id`, not bytes (Vercel caps request
bodies at 4.5 MB). `attach_document` refiles the document with `PATCH /api/documents/:id`, and a Drive file
moves to the record's folder. It needs `ANTHROPIC_API_KEY`; without it the page reports that and nothing else
breaks. The system prompt is `lib/assistant/prompt.ts`. It is cached, and the date and user go in a second,
uncached block.

**Property Register.** `lib/data/property-register.ts` holds the team's six owner-stated properties
(P001–P006). `lib/register.ts` maps each one to a listing, and `/api/properties/register` previews them or
imports them. Imports are always `Draft` and never overwrite an existing code. They can be run from the
Listings page button or from the assistant.

### Team messages, voice and WhatsApp (migrations 017–018)

**Messages** (`lib/messages.ts`, `/api/messages`, app `chat/`, web `/admin/messages`): one team room
(`conversations.key = 'team'`) plus a direct conversation per pair (`dm:<id>:<id>`, created on first send).
Addressed as `'team'`, `'user:<id>'` or a conversation id. Not in the activity trail. Threads poll every 4 s
while open. Alerts: iPhone gets Web Push instantly; Android picks new messages up in the background check
(`checkMessages` in `mobile/src/lib/notify.ts`, via `GET /api/messages?since=`), which Android runs roughly
every 15 minutes. There is no FCM, so Android can't get instant pushes.

**iPhone push** (`lib/webpush.ts`, 017): the home-screen web app subscribes through `mobile/public/sw.js`.
Team updates push from `logActivity`; timed reminders come from `/api/cron/reminders`, which pg_cron calls
every 5 minutes with a key kept in `app_secrets`. VAPID keys are generated on first use and stored there too.

**Voice and sharing need native modules** (`expo-speech-recognition`, `expo-share-intent`, `expo-clipboard`),
so they only work in APKs built after they were added. The JS loads them only after checking with
`requireOptionalNativeModule` (`lib/voice.ts`, `lib/clipboard.ts`), so OTA updates stay safe on older APKs,
which just don't show the mic or paste buttons. Keep the app `version` at 1.0.0 unless you mean to cut old
APKs off from updates: the runtime version follows it. On the web export, voice uses the Web Speech API.
A WhatsApp message shared into the app, pasted, or dictated reaches the assistant marked `[Forwarded from
WhatsApp]` or `[Voice]`; `lib/assistant/prompt.ts` tells it how to handle each.

### Free mode and the Claude connector (migration 019)

The in-app AI assistant needs `ANTHROPIC_API_KEY` on Vercel (API billing, separate from any Claude
subscription). `GET /api/assistant` reports `{ configured }` and `/api/health` reports `assistant.configured`.
Without the key, the assistant screen on the app and the web **becomes quick capture**. Pasted, shared, typed
or dictated text goes to `lib/whatsapp/parse.ts`, a dependency-free reader of Bengaluru broker shorthand
(acres/guntas, rates per acre/gunta/sq ft, crore/lakh/full rupees, khata, conversion, approvals, facing, road,
survey no., localities → zone/corridor, sender and phone, buyer requirements → leads, multi-property posts).
`/api/whatsapp` parses (with suggested `BLR-<P|R|V|C|W>-<yy><nn>` codes, look-alike listings and any existing
contact) and saves through the ERP's own routes via `lib/erp-call.ts`. The review cards are
`mobile/src/components/whatsappImport.tsx` and `components/erp/WhatsAppImport.tsx`. **Run
`npx tsx scripts/test-whatsapp-parser.ts` after touching the parser, and add a case for any post it misreads.**

**Claude connector** (`app/api/mcp/[token]`, `lib/connector.ts`): a stateless Streamable-HTTP MCP server, so each
person's own Claude app (their subscription) can use the ERP as a custom connector. Profile → Claude connector
issues a per-person secret link (only its SHA-256 is stored; revocable). It exposes the assistant's own tools
(`lib/assistant/tools.ts`) and runs them as that person through the ERP routes, with a 15-minute session.
`read_document` returns file bytes inline (no Files API). Hand-rolled JSON-RPC (initialize, tools/list,
tools/call, ping), deliberately with no MCP SDK dependency.

### Documents never pass through the server

`/api/documents` is a two-step upload. `action: 'start'` returns a destination. With Google Drive connected
(and the grant including `drive.file`) that is a Drive resumable session, and the file lands in
`Bhumi Estates ERP / <Listings|Notes|Transactions…> / <record label>`. Otherwise it is a signed upload URL
into the private `documents` bucket. The client PUTs the bytes there directly, then calls `action: 'record'`.
The record step re-checks that the file exists. Doing it this way keeps scanned deeds clear of the host's
request-body limit. Bucket files are opened through ten-minute signed URLs, and the bucket is never public.
Deleting a Drive document sends the file to Drive's trash. A Drive file that was only *linked* is unlinked
and never touched. The same Google connection serves Calendar/Meet and Drive, so a connection made before
Drive was added needs redoing (`/api/admin/google/status` reports `drive`).

### The mobile app (`mobile/`)

This is an Expo Router app that talks to the same API with `Authorization: Bearer`. An app login sends
`client: 'app'` and gets a 30-day token; the web cookie stays at 8 hours. It connects Google through
`POST /api/admin/google/connect`, which returns a five-minute signed link. The OAuth `state` is a signed
purpose token, so the callback works from a phone browser that has no admin cookie, and it redirects back
to `bhumiadmin://google`. Builds go through EAS (`preview` profile → APK). JS-only changes can ship as an
OTA update with `eas update --channel preview`.

**iPhone gets the same app as a home-screen web app, not an App Store build** (that needs a paid Apple
Developer account). `node scripts/build-pwa.js` exports `mobile/` for the web into `public/app/`, which is
**committed** and served at `/app` (SPA fallback rewrites in `next.config.js`); install is Safari → Share →
Add to Home Screen. The export does not rebuild itself: after changing `mobile/`, re-run the script and
commit `public/app/`, or iPhones keep the old version. On web the app calls the API on its own origin, and
local notifications and background refresh are native-only. Anything native-only must be guarded with
`Platform.OS`, including hooks: an unguarded `expo-notifications` call blanked the whole web app once.
`Alert.alert` is a no-op in react-native-web, so `src/lib/webAlert.ts` (imported by the root layout) maps it
onto `window.alert`/`confirm`/`prompt` on web; without it every "Delete this?" button on iPhone did nothing.
The app has the same agents (`components/agents.tsx`, the Deals → Agents tab, the agent profile on
`contact/[id]`), search (`search.tsx`) and assistant (`assistant.tsx`, streamed over XHR because React Native's
fetch can't read a body incrementally) as the web admin. `public/app/assets/node_modules/` holds the icon font and is re-included in `.gitignore` on purpose.
`mobile/app.json` also carries the iOS config (bundle id, usage strings) for a future `eas build -p ios`.

## Conventions

Design tokens are in `app/globals.css`, component styles in `app/components.css`. Add new utilities to
`components.css`; do not rename existing tokens.

**The `--navy*` tokens are green** (`--navy: #0E3B2E`), and `--green*` are aliases pointing back at them.
The names are historical — the palette changed, the token names did not. Read the value, not the name.

**`:root` also carries a UI type scale, a motion-duration scale and a z-index scale** — `--text-2xs` through
`--text-2xl`, `--duration-fast`/`--duration`/`--duration-slow`, and `--z-subnav` through `--z-skip-link`.
These were extracted from values already in use across both stylesheets (colors, radii and shadows were
already tokenized; font sizes, transition durations and z-index were not). Pick the nearest existing step
for new UI text, transitions and stacking contexts rather than writing another one-off `rem`/`s`/number —
that scatter is exactly what these three scales replace. They cover the *shared* component surface (buttons,
badges, forms, chips, tables, toast/modal/drawer, the admin dashboard's cards and stat tiles) — page-specific
marketing sections in `components.css` (hero, pillars, footer, pricing, etc.) were left on their original
literal values and are not part of this scale.

`--header-h` must stay defined on `:root`. The homepage hero is a *sibling* of the header and pulls itself up
by that value; scoping it to `.siteHeader` leaves a strip of page background above the hero video.

Copy, corridor data, case studies and insights live in `lib/content/`, separated from components. Domain
content reflects Karnataka practice as of August 2026 — verify anything before using it in external-facing
material.

## Watch out

**`README.md` is substantially out of date.** Its route table still lists `/verification`,
`/property-types`, `/services`, `/corridors`, `/portfolio`, `/tools`, `/checklist` and `/large-land-parcels`,
none of which exist; the site was restructured down to `/`, `/property-consultancy` (+2 children),
`/branding-advertising`, `/marketplace`, `/insights`, `/contact`, `/privacy`, `/terms`. It also gives the
wrong `--navy` value and stops at migration 005. Trust the tree over the README.

`Bhumi LOGO/` and a WhatsApp chat export (it contains customer phone numbers) sit in the repo root. They are
listed in `.gitignore` so they can't be committed by accident. Still, check what `git add` picks up before committing.
