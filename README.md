# ಭೂ Bhūmī Estates — Bengaluru's Verified Land Marketplace

A Next.js 16 + Supabase application that combines a verified land marketplace with spatial intelligence, a 9-point verification standard, and a content-led insights channel — built for serious land buyers in Bengaluru.

> **Discover. Analyze. Own — with full spatial intelligence.**

---

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Database**: Supabase (Postgres + Row Level Security)
- **Styling**: CSS Modules + design tokens in `app/globals.css` (green / gold / cream, Fraunces + Inter)
- **Auth**: Cookie-based admin session (`/admin/login`)
- **Hosting**: Vercel-ready (`vercel.json` included) or Netlify (`netlify.toml`)

---

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

Build:
```bash
npm run build
npm start
```

### Environment

Copy `.env.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # for admin / service fetches only
```

---

## Project structure

```
app/
  page.tsx                       # Homepage
  marketplace/                   # Public marketplace (list + filters + drawer)
  insights/                      # Insights index + [slug] (Phase 3)
  admin/                         # Admin dashboard (login-gated)
  privacy/  terms/               # Legal pages
  api/                           # Route handlers
components/
  home/                          # One component per homepage section
  marketplace/                   # PropertyCard, PropertyDrawer, etc.
  admin/                         # AdminShell, StatTile
lib/
  supabase.ts                    # createServiceClient / createBrowserClient
  types.ts                       # Property, Enquiry, Insight
  copy/                          # All visible copy in one place
  geo.ts                         # Map helpers (Phase 2)
  auth.ts                        # assertAdmin() helper (Phase 4)
supabase/
  schema.sql                     # Initial schema + 7 seed properties
  migrations/                    # Phase 2+ migrations
```

---

## Public site

- `/` — Home (hero, city pills, KPI strip, 3 feature rows, trust strip, featured parcels, tools, testimonials, FAQ, insights teaser)
- `/marketplace` — Filterable, searchable, drawer-based marketplace
- `/insights` — Insight index (Phase 3) + `/insights/[slug]`
- `/privacy`, `/terms` — Legal
- `/tools/survey-lookup`, `/tools/price-estimator`, `/tools/land-evaluator` — Free land tools (Phase 4)

## Admin

Login at `/admin/login`. Demo credentials are pre-filled on the form. Admin is gated by a cookie session set by `POST /api/admin/login`.

Once logged in:
- `/admin/dashboard` — Stats + recent enquiries + pending verifications
- `/admin/properties` — CRUD properties
- `/admin/insights` — Author/insight pages (Phase 4)
- `/admin/blueprint`, `/admin/feasibility`, `/admin/vision` — Strategic documents

---

## Database

Schema lives in `supabase/schema.sql`. It seeds 7 Bengaluru parcels with real-world location, pricing, and verification metadata.

Phase 2 adds:
- `lat` / `lng` on `properties` (centroid coordinates for the map)
- `gallery_urls`, `verified_tier`, `appreciation_5yr_pct`, `nearby_infra`, `video_url`
- `market_stats` table for the homepage + marketplace KPI strip

Phase 3 adds the `insights` table.

Run migrations in the Supabase SQL editor, in order: `schema.sql` → `migrations/002_redesign.sql` → `migrations/003_insights.sql`.

---

## Design tokens

| Token | Value | Use |
|---|---|---|
| `--green` | `#0E3B2E` | Primary brand, headings on light, primary CTA |
| `--gold` | `#C2974A` | Accent, eyebrows, hover, secondary CTA |
| `--cream` | `#F6F3EC` | Page background |
| `--ink` | `#10231B` | Body text |
| `--serif` | Fraunces | Display, headlines, big numerals |
| `--sans` | Inter | UI, body, captions |

Add new utility classes to `app/globals.css`. Do **not** rename or recolour existing tokens.

---

## Deploy

**Vercel**
```bash
vercel
```
Set the three Supabase env vars in the Vercel project settings.

**Netlify**
Connect the repo, set the build command to `npm run build` and the publish directory to `.next`. Set the env vars in the Netlify dashboard.

---

## License

MIT — see `LICENSE`.
