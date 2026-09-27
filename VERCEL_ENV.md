# Environment variables on Vercel

Every variable the site and the ERP read, where each value comes from, and how to get it into Vercel.

**Never commit a value.** This file lists names only. Real values live in `.env.local` on your machine,
which git ignores, and in Vercel's encrypted environment settings.

Vercel project: `chethan17s-projects/bhumi`. Pushes to `main` deploy to production automatically.

> **A changed variable only takes effect on the next deployment.** After adding or editing one, redeploy
> (see [Redeploy](#redeploy)).

---

## The variables

### Required — the site and admin

| Variable | What it's for | Where to get the value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Database and storage address | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public read key | Supabase → Project Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side full access. **Secret, and never `NEXT_PUBLIC_`** | Supabase → Project Settings → API → `service_role` key |
| `ADMIN_PASSWORD` | Signs admin sessions while `AUTH_SECRET` is unset. **Changing it signs everyone out** | Existing value, keep as is |
| `ADMIN_EMAIL` | The old shared login. It stops working once named accounts exist, but it's harmless to keep | Existing value |

### Recommended

| Variable | What it's for | Value |
|---|---|---|
| `AUTH_SECRET` | Signs session tokens. If unset, a value derived from `ADMIN_PASSWORD` is used. Setting it signs everyone out once | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, share cards | `https://www.bhumiestates.in` |

### Google Workspace — Drive, Calendar, Meet, Gmail, Sheets

| Variable | What it's for | Where to get the value |
|---|---|---|
| `GOOGLE_CLIENT_ID` | OAuth client | Google Cloud → Google Auth Platform → Clients → *Bhumi ERP server* → Client ID (ends in `.apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret. **Secret** | Same client → Client secret (also in the JSON you downloaded) |
| `GOOGLE_REDIRECT_URI` | Where Google sends the admin back | `https://www.bhumiestates.in/api/admin/google/callback`. It must match the redirect URI on the client exactly, `www` included |
| `GOOGLE_WORKSPACE_EMAIL` | *Optional.* The only Google account allowed to connect | Defaults to `info@bhumiestates.in`. Set it only to change that |

The OAuth client must be a **Web application** with these scopes on its consent screen: `openid`,
`userinfo.email`, `calendar.events`, `drive.file`, `gmail.send`, `meetings.space.created` and
`meetings.space.readonly`.

### Database updates (migrations)

| Variable | What it's for | Where to get the value |
|---|---|---|
| `SUPABASE_DB_URL` | Lets production deploys apply new migrations themselves (`scripts/migrate.js --deploy` runs before `next build`), and powers Setup's **Apply pending updates** button. **Secret** | Supabase → **Connect** → *Session pooler* URI, with the database password filled in. Not needed if the Supabase ↔ Vercel integration already added `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING`, which are picked up automatically |

### Scheduled jobs

| Variable | What it's for | Value |
|---|---|---|
| `CRON_SECRET` | Lets Vercel Cron run the daily Google Sheets sync (`/api/cron/sheets`). Without it, the route refuses everyone. **Secret** | **Already set on Vercel** (27 Sep 2026), and the same value is in `.env.local`. To rotate it, generate a new one as for `AUTH_SECRET` |

### Local only — never add these to Vercel

| Variable | Why it stays local |
|---|---|
| `LISTING_SRC` | Input path for the listing image scripts |

---

## Option A — Vercel dashboard (simplest)

1. Go to https://vercel.com → project **bhumi** → **Settings → Environment Variables**.
2. For each variable: enter the **Key** and the **Value**, tick **Production** (and **Preview** if you use
   preview deployments), then click **Save**.
3. Mark secrets as **Sensitive** so the value can't be read back.
4. [Redeploy](#redeploy).

## Option B — Vercel CLI, one at a time

From the repo root (the CLI is already linked to the project):

```bash
npx vercel env add GOOGLE_CLIENT_ID production
```

It prompts for the value. Paste it and press Enter. Repeat for each variable, then check with:

```bash
npx vercel env ls production
```

To change a value, remove it and add it again:

```bash
npx vercel env rm GOOGLE_CLIENT_ID production
```

## Option C — push everything from `.env.local` in one go

Put the production values in `.env.local`, then run this from the repo root (Git Bash). It sends each
variable listed in `KEYS` that has a value, replacing whatever Vercel had. It never prints a value, and it
skips the local-only variables.

```bash
KEYS="NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY ADMIN_EMAIL ADMIN_PASSWORD AUTH_SECRET NEXT_PUBLIC_SITE_URL GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_REDIRECT_URI GOOGLE_WORKSPACE_EMAIL CRON_SECRET"
for k in $KEYS; do
  v=$(grep -E "^$k=" .env.local | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')
  [ -z "$v" ] && { echo "skip  $k (not in .env.local)"; continue; }
  npx vercel env rm "$k" production --yes >/dev/null 2>&1
  printf '%s' "$v" | npx vercel env add "$k" production >/dev/null 2>&1 && echo "set   $k" || echo "FAIL  $k"
done
```

> **Careful with `GOOGLE_REDIRECT_URI`.** For local testing, `.env.local` may hold the `localhost`
> callback. Make sure the production URL is what gets pushed, or leave that key out of `KEYS` and set it
> in the dashboard.

## Redeploy

A variable change applies to the next deployment. Any one of these works:

- push a commit to `main`;
- Vercel dashboard → **Deployments** → latest → **⋯ → Redeploy**;
- CLI: `npx vercel --prod`.

## Check it worked

```bash
curl -s https://www.bhumiestates.in/api/health
```

That should show `"reachable": true`. Then, in the app: **Profile → Google Workspace** should show
*Connect Google account*, not "Not set up on the server yet". After connecting as info@bhumiestates.in,
all five chips (Drive, Calendar, Meet, Gmail, Sheets) turn green.
