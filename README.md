# ಭೂ Bhumi Estates — India's Spatial Land Intelligence Platform

A spatial-intelligence-first land platform combining a **verified land marketplace** with **AI-powered spatial intelligence**, **enterprise tools**, and a **3-tier verification system** — launching in Bengaluru, scaling pan-India.

> **Discover. Analyze. Own — with full spatial intelligence.**

This repository contains a production-ready **Next.js** application: an interactive marketplace prototype, a login-protected admin dashboard, a comprehensive feasibility plan, and a full strategic + technical blueprint. Inspired by the best of [1acre.in](https://1acre.in) and [TalkingLands](https://talkinglands.com).

---

## 📦 What's inside

```
bhumi-platform/
├── index.html              # Root landing page (entry point) — links to everything
├── founders-brief.html     # Plain-English vision document for the founding team
├── blueprint.html          # Full strategic & technical blueprint
├── prototype/
│   ├── marketplace.html    # Public marketplace (search, filter, map, detail drawer)
│   ├── admin.html          # Admin dashboard (login + CRUD + leads + analytics)
│   └── img/                # Generated hero & property imagery (.jpg)
├── README.md               # This file
├── LICENSE                 # MIT
├── .gitignore
├── package.json            # Optional: local dev server helper
├── vercel.json             # Deploy config for Vercel
└── netlify.toml            # Deploy config for Netlify
```

| Deliverable | What it is | How to open |
|---|---|---|
| **Marketplace** | Interactive buyer site with sample inventory | `prototype/marketplace.html` |
| **Admin Dashboard** | Login-protected console (demo creds pre-filled) | `prototype/admin.html` |
| **Executive Brief** | The strategic vision and market opportunity brief | `founders-brief.html` |
| **Blueprint** | Brand, design system, data model, tech, roadmap | `blueprint.html` |

---

## 🚀 Quick start (run locally)

This is a **static site** — no build step required. Pick any one option:

### Option A — just open it
Double-click `index.html`, or open it in your browser.

### Option B — local server (recommended, so relative paths & images behave)
```bash
# Python 3 (pre-installed on most systems)
python3 -m http.server 8080

# or Node
npx serve .
```
Then visit **http://localhost:8080**.

### Option C — npm script
```bash
npm install
npm start
```

---

## 🌐 Deploy

Because it's 100% static HTML/CSS/JS, it deploys anywhere. Two one-click options:

### Vercel
1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) → import the repo.
3. Framework preset: **Other** · Build command: *(none)* · Output dir: *(root)*.
4. Deploy. (`vercel.json` is included for sane defaults.)

…or CLI:
```bash
npm i -g vercel
vercel
```

### Netlify
1. Push to GitHub.
2. [app.netlify.com](https://app.netlify.com) → "Add new site" → "Import from Git".
3. Build command: *(leave empty)* · Publish directory: *(root)*.
4. Deploy. (`netlify.toml` is included.)

…or drag-and-drop: zip the folder and drop it into Netlify's manual deploy.

### GitHub Pages
1. Push to GitHub.
2. Settings → Pages → Source: `main` branch / root.
3. Save. Live at `https://<user>.github.io/<repo>/`.

---

## 🔐 Admin demo login

The admin dashboard (`prototype/admin.html`) ships with demo credentials **pre-filled** — just click **Sign in**:

| Field | Value |
|---|---|
| Email | `admin@bhumiestates.com` |
| Password | `bhumi2026` |

> ⚠️ This is a front-end-only demo. There is **no real backend or authentication** — the login is simulated in JavaScript. Before going live, wire it to a real auth provider and API (see the Blueprint's tech-stack section).

---

## 🛠 Tech notes

- **No dependencies, no build step.** Plain HTML + CSS + vanilla JS.
- Fonts load from Google Fonts CDN (requires internet; falls back gracefully).
- Images are bundled locally in `prototype/img/`.
- Sample property & lead data lives inline in each prototype's `<script>`.
- Fully responsive (mobile, tablet, desktop).

To turn this into a real product, see the **Blueprint** (`blueprint.html`) → "Tech Stack & Architecture" for the recommended Next.js + Postgres/PostGIS + Mapbox stack.

---

## 📝 License

MIT — see [LICENSE](LICENSE). Free to use, modify, and deploy.

---

*Bengaluru · India · 2026 — Bhumi Estates v2.0 · bhumiestates.com*
