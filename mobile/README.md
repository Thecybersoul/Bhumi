# Bhumi Estates Admin — mobile app

A companion iOS/Android app for the admin at `../` (the Next.js site). It is a
**client of that same backend** — same API routes, same bearer-token session,
same database — not a second product. See
`../MOBILE_APP_PLAN.md`-equivalent doc for the fuller plan; this file is just
"how to run it."

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `i` / `a` for a
simulator, or `w` for a web preview (useful for a quick check without a
device — see "Web preview" below).

## Point it at your backend

The app talks to whichever URL is in `EXPO_PUBLIC_API_URL`, defaulting to
`http://localhost:3000` (see `src/lib/config.ts`). For a physical device on
the same network as your dev machine, use your machine's LAN IP instead of
`localhost`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.23:3000 npx expo start
```

For a built app pointed at production, set `expo.extra.apiUrl` in `app.json`
to your deployed domain before running `eas build`.

## Sign-in

Same credentials as the web admin — `ADMIN_EMAIL` / `ADMIN_PASSWORD` in the
backend's `.env.local`. The app stores the session token in SecureStore
(hardware-backed on iOS/Android) and sends it as `Authorization: Bearer
<token>` — see `../lib/auth.ts` on the backend for the matching half.

## What's here (v1 / phase 1 of the plan)

- **Dashboard** — the same KPIs as the web dashboard, from `GET /api/dashboard`
  (`../lib/dashboard.ts` computes them once, shared by both surfaces).
- **Deals** — transaction pipeline and lead inbox, read-only for now.
- **Properties** — the listings table.
- **Notes & Tasks** — add/complete a task, add a note. A task synced to
  Google Calendar (done from the web admin's Notes & Tasks board today) shows
  its synced state here.

Not yet built: advancing a transaction's stage, approving a document
request, or syncing a task to Calendar *from* the app itself — all listed as
phase 2 in the plan. Every screen is read/write against the real database;
none of this is mocked.

## Web preview

`npx expo start --web` needs `react-native-web` (already installed here).
Two things are web-only quirks, not app bugs:

- **SecureStore has no web implementation.** `src/lib/auth.tsx` falls back to
  `localStorage` on web and uses the real hardware-backed SecureStore on
  iOS/Android — the code you're reading already handles this.
- **CORS.** A browser enforces it; a native app never does. The backend's
  `next.config.js` allows cross-origin requests to `/api/*` so the web
  preview can reach `localhost:3000` at all — every route still requires the
  bearer token or admin cookie regardless.

## Google Calendar / Meet

Configured entirely on the backend (`../lib/google.ts`, `/admin/setup`) — the
app just displays whether a task has a synced Meet link. See the backend's
`.env.example` for the three env vars a Google Cloud project needs to supply.
