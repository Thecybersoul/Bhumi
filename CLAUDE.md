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

Migrations live in `supabase/`, applied in order: `schema.sql`, then `migrations/004`–`008`.
**006 creates `site_content` and `media`** — without it the content editor and media library cannot save
anything and uploads fail outright. **007 creates `transactions`** — the deal pipeline, separate from
`properties` (inventory on offer). **008 creates `notes` and `tasks`** — the ERP's follow-up memory; both
have optional `entity_type`/`entity_id`/`entity_label` columns so a note or task can point at a specific
lead, transaction, property or verification case, but the shipped UI (`/admin/notes-tasks`) only writes
`entity_type: 'general'` for now — per-record linking is future work, not yet built. `schema.sql` itself
carries no seed data by design — a listing represents real land, so demo rows belong only in
`lib/data/seed.ts`, the in-code fallback. The service-role key reaches PostgREST and Storage but *cannot*
execute DDL; that is why `npm run migrate` needs `SUPABASE_DB_URL` (a real Postgres connection string)
separately from the Supabase keys.

### The admin nav folds related views under one entry, not one nav item per table

`/admin/deals` is one page with three tabs (Pipeline, Leads, Document requests) built with the shared
`AdminTabs` component (`components/admin/AdminTabs.tsx`) — each tab's content is a normal server-rendered
component (`TransactionBoard`, `LeadInbox`, `DataRoomQueue`) fetched in parallel by the page and handed to
`AdminTabs` as already-rendered children; switching tabs only toggles `display`, it never remounts, so a
filter typed into one tab survives a trip to another. `/admin/properties` does the same for Listings and
Verification, since a verification case is always about one specific parcel. `?tab=<id>` on either route
preselects a tab (used by cross-links from `/admin/metrics` and the dashboard). Adding a fourth related view
to either page means adding a tab, not a new top-level nav entry — that consolidation is deliberate, not an
oversight to "fix" by splitting them back out.

Metrics and Business plan (`/admin/metrics`, `/admin/plan`) are static reference material tied to the
original business-plan document. They're intentionally **not in the sidebar nav** (routes still work,
reachable by URL) — day-to-day ERP use doesn't need them front and center. Setup lives in the sidebar
footer, not the main nav, for the same reason: it's a utility you check when something looks wrong, not
part of the daily flow.

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

`Bhumi LOGO/*.png` and a WhatsApp chat export sit untracked in the repo root and are **not** covered by
`.gitignore`. The export contains customer phone numbers — never `git add -A` here without checking what it
picks up.
