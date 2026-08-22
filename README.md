# Bhumi Estates

**Land sourcing · Verification · Development · Branding · Outdoor advertising**

A Next.js 16 + Supabase application built from the Bhumi Estates Website Business Plan. The site's
organising idea comes straight from the plan: **publish the proof, not the pitch.** A six-stage verification
protocol is published in full, the diligence numbers behind it — including the percentage of parcels we flag
— are published on a live dashboard, and every page ends in a specific next step.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, React 19) |
| Database | Supabase (Postgres + RLS) — **optional**, see below |
| Styling | Design tokens in `app/globals.css`, components in `app/components.css` |
| Identity | Navy `#0B2239` + gold `#C2974A`, Fraunces + Inter + JetBrains Mono |
| Auth | Cookie session for `/admin`, guarded in `proxy.ts` *and* server-side in the admin layout |
| Hosting | Vercel (`vercel.json`) or Netlify (`netlify.toml`) |

### The site runs without a database

Every read goes through `lib/db.ts`, which falls back to the seeded record in `lib/data/seed.ts` when
Supabase credentials are absent or unreachable, and reports which source it used. A page never throws
because a database is down. `/api/health` distinguishes *serving* from *degraded*, and the admin shows a
`Seeded data` / `Live database` pill on every panel.

```bash
npm install
npm run dev          # http://localhost:3000 — fully functional with no env vars
npm run build && npm start
```

### Environment

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # server-side only, never reaches the browser
NEXT_PUBLIC_SITE_URL=https://bhumiestates.in
ADMIN_EMAIL=...                      # change before any public deployment
ADMIN_PASSWORD=...
```

Run migrations in the Supabase SQL editor in order:
`supabase/schema.sql` → `supabase/migrations/004_business_plan_restructure.sql` →
`supabase/migrations/005_language_cleanup.sql`.

---

## Site structure (Plan §6)

| Route | Purpose |
|---|---|
| `/` | One-line pitch, credibility bar, five-service value chain, one clear next step |
| `/verification` | **The flagship.** Six-stage protocol as an interactive stepper + the Transparency Dashboard |
| `/property-types` + `/property-types/[slug]` | Five asset classes, each with its own presentation and critical field |
| `/large-land-parcels` | Institutional pillar with the NDA-gated data room |
| `/services` + `/services/[slug]` | The five services, one page each |
| `/corridors` + `/corridors/[slug]` | Interactive corridor map and six corridor notes |
| `/portfolio` + `/portfolio/[slug]` | Case studies with project numbers, including the deals we walked away from |
| `/tools` + `/tools/[slug]` | Four working decision-support tools |
| `/insights` + `/insights/[slug]` | Regulation explainers, corridor notes, market data |
| `/marketplace` | Filterable inventory; every listing states its verification position |
| `/checklist` | The gated lead magnet — and the full checklist printed on the same page |
| `/lp/[slug]` | Campaign landing pages, no site nav, one offer each, `noindex` |
| `/contact`, `/privacy`, `/terms` | WhatsApp-first contact and legal |

### Signature features (Plan §3)

- **Verification Transparency Dashboard** (`/verification#transparency`) — parcels reviewed, the flag rate,
  where parcels fail by stage, why they fail, and the counting methodology. Computed from the live
  verification case record, so the published figures cannot drift from what actually happened.
- **Data-driven credibility bar** — served from the same record as the dashboard.
- **The verification stepper** — the plan's intended brand asset, using shipment-tracking visual language.
- **Interactive corridor map** — schematic SVG; no third-party tiles, no external request.
- **WhatsApp-first** — click-to-chat is the primary action in the header, every lead block and the footer.

---

## Admin

`/admin/login` → the advisory desk. Organised around what the plan asks the team to operate.

| Route | What it does |
|---|---|
| `/admin/dashboard` | Operating picture; flags cases past twice their stage's typical duration |
| `/admin/verifications` | The six-stage board. Click a stage to cycle it; a flag closes the case |
| `/admin/leads` | One inbox for every conversion path, each lead carrying its qualifying inputs |
| `/admin/data-room` | NDA-gated requests, released or declined by a named advisor |
| `/admin/properties` | Listings, with the per-class critical field checked |
| `/admin/transparency` | Published figures reconciled against the live case record |
| `/admin/metrics` | Plan §13, each metric tied to where it is observable today |
| `/admin/plan` | What the plan asked for, and where each requirement now lives |

Admin APIs (`GET /api/leads`, `?admin=1` on properties, verification case detail, uploads) all return 401
without a session. Only the aggregate at `/api/verifications?aggregate=1` is public.

---

## Content lives in `lib/content/`

Copy, corridor data, case studies, insights and tool reference rates are separated from the components:

```
lib/content/
  brand.ts           identity, contact routes, navigation, WhatsApp helper
  verification.ts    the six stages — inputs, checks, outputs, deal-stoppers
  pillars.ts         the five-service value chain
  propertyTypes.ts   six asset classes with per-class diligence
  corridors.ts       six corridors with price bands and infrastructure status
  caseStudies.ts     case studies with real numbers
  insights.ts        long-form explainers
  tools.ts           tool registry + construction rates, statutory costs, warehouse thresholds
  landingPages.ts    campaign pages
  home.ts            homepage copy
```

Domain content reflects Karnataka practice as of August 2026 — Kaveri 2.0 for the EC, Bhoomi i-RTC for the
revenue record, e-Khata, the 2025 Land Revenue Rules amendment, K-RERA advertising rules, Section 45(5A)
capital gains timing, and the 2025 registration-fee revision. **Verify anything before using it in
external-facing material**; land rules change.

---

## Reliability (Plan §10)

- Graceful degradation to seeded data; `/api/health` reports serving status, DB reachability and latency
- Security headers, HSTS and `noindex` on `/admin` in `next.config.js`
- ISR with per-route revalidation; immutable caching for static assets; `no-store` on health and admin
- `app/error.tsx` keeps WhatsApp and phone reachable even when a page fails
- AVIF/WebP image formats, `sitemap.xml`, `robots.txt`, JSON-LD (Organization, HowTo, FAQ, Article)
- Reduced-motion respected; skip link; focus-visible rings

Load testing, alerting, automatic rollback, staging and backups are hosting-platform configuration rather
than application code — see `/admin/plan` for what is built versus what is outstanding.

---

## Design tokens

| Token | Value | Use |
|---|---|---|
| `--navy` | `#0B2239` | Primary brand, headings, primary CTA |
| `--gold` | `#C2974A` | Accent, eyebrows — matches the logo SVGs exactly |
| `--cream` / `--paper` | `#F7F5F0` / `#FCFBF8` | Page and panel backgrounds |
| `--verified` / `--flagged` / `--progress` / `--pending` | | Verification status language, used consistently |

`--green*` remain as aliases onto navy so nothing renders off-brand. Add new utilities to
`app/components.css`; do not rename existing tokens.

---

## License

MIT — see `LICENSE`.
