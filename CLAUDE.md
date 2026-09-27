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

Migrations live in `supabase/`, applied in order: `schema.sql`, then `migrations/004`–`013`.
**006 creates `site_content` and `media`** — without it the content editor and media library cannot save
anything and uploads fail outright. **007 creates `transactions`** — the deal pipeline, separate from
`properties` (inventory on offer). **008 creates `notes` and `tasks`** — the ERP's follow-up memory; both
have optional `entity_type`/`entity_id`/`entity_label` columns so a note or task can point at a specific
lead, transaction, property or verification case, but the shipped UI (`/admin/notes-tasks`) only writes
`entity_type: 'general'` for now — per-record linking is future work, not yet built. **009** adds Google
Calendar sync, **010** the extra listing fields, and **011 creates `documents`**, the files attached to a
listing, note, transaction, lead or verification case. `schema.sql` itself
carries no seed data by design — a listing represents real land, so demo rows belong only in
`lib/data/seed.ts`, the in-code fallback. The service-role key reaches PostgREST and Storage but *cannot*
execute DDL; that is why `npm run migrate` needs `SUPABASE_DB_URL` (a real Postgres connection string)
separately from the Supabase keys.

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
`public/app/assets/node_modules/` holds the icon font and is re-included in `.gitignore` on purpose.
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
