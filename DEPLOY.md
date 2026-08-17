# Deploying Bhumi Estates

The application builds to 57 routes and runs correctly with **no environment variables at all** — reads fall
back to the seeded record and the admin refuses sign-in until it is configured. That means a first deploy
cannot leak anything, and you can add the database afterwards.

---

## Before the first public deploy

Two variables are mandatory, and the deployment is safe without them only because the admin disables itself.

| Variable | Required | Notes |
|---|---|---|
| `ADMIN_EMAIL` | **Yes, for admin access** | No default exists. Without it, `/api/admin/login` returns 503 in production. |
| `ADMIN_PASSWORD` | **Yes, for admin access** | Minimum 8 characters. Also derives the session signing key if `AUTH_SECRET` is unset. |
| `AUTH_SECRET` | Recommended | 32+ random chars: `openssl rand -base64 32`. Rotating it invalidates all sessions. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URLs, sitemap and Open Graph. Defaults to `https://bhumiestates.in`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Without it the site serves seeded content. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | **Server-side only.** Never expose it to the browser or prefix it with `NEXT_PUBLIC_`. |

---

## Vercel (recommended — the app is Next.js 16 with ISR and route handlers)

1. Import the GitHub repository at <https://vercel.com/new>.
2. Framework preset is detected from `vercel.json` (`nextjs`). No build overrides needed.
3. Add the environment variables above under **Settings → Environment Variables** (Production + Preview).
4. Deploy. Set the production branch to `main` once this branch is merged.

CLI alternative, from a machine that has your credentials:

```bash
npm i -g vercel
vercel login
vercel link
vercel env add ADMIN_EMAIL production      # repeat per variable
vercel --prod
```

## Netlify

`netlify.toml` is configured with the Next.js runtime plugin (`@netlify/plugin-nextjs`), `npm run build` and
a `.next` publish directory. Connect the repository, set the same environment variables under
**Site configuration → Environment variables**, and deploy.

---

## After the first deploy

1. **Point a monitor at `/api/health`.** It returns `status: "ok"` when serving and `"degraded"` when
   Supabase is configured but unreachable — that distinction is the useful alert, since a site serving
   seeded content is up, not broken.
2. **Attach the database.** Add the three Supabase variables, then run in the SQL editor, in order:
   `supabase/schema.sql`, then `supabase/migrations/004_business_plan_restructure.sql`. The admin's source
   pill flips from *Seeded data* to *Live database* with no code change.
3. **Replace the placeholder figures.** The transparency numbers, case studies and corridor price bands in
   `lib/content/` and `lib/data/seed.ts` are illustrative. The site's whole positioning rests on published
   claims being provable, so these must become your real record before you promote the site.
4. **Verify the K-RERA number** in `lib/content/brand.ts` — it is currently a placeholder, and it appears in
   the footer of every page and in advertising, where it is a regulatory requirement.
5. **Submit the sitemap** at `/sitemap.xml` to Search Console. `/lp/*` and `/admin` are `noindex` by design.

---

## Deployment checklist

```
[ ] ADMIN_EMAIL and ADMIN_PASSWORD set to real values
[ ] AUTH_SECRET set to 32+ random characters
[ ] NEXT_PUBLIC_SITE_URL set to the real domain
[ ] SUPABASE_SERVICE_ROLE_KEY set server-side only, never NEXT_PUBLIC_
[ ] Signed in to /admin/login successfully on the deployed URL
[ ] Confirmed `curl -H "Cookie: bhumi_admin=authenticated" <url>/api/leads` returns 401
[ ] Uptime monitor pointed at /api/health
[ ] Placeholder statistics replaced with the real record
[ ] K-RERA registration number verified
[ ] Sitemap submitted
```

The sixth line matters: a static session cookie was a live authentication bypass in an earlier revision of
this codebase. Sessions are now HMAC-signed and expire after eight hours. Re-run that check after any change
to `lib/session.ts`, `lib/auth.ts` or `proxy.ts`.
