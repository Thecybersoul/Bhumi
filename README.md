# ಭೂ Bhūmī — Bengaluru Land Exchange

A world-class marketplace & admin platform for **large land parcels in and around Bengaluru** — purpose-built for villa & apartment townships, industries, resorts, agriculture, and strategic land-banking.

> **Find it. Understand it. Own it — with full clarity.**

This repository contains a complete, production-ready **static front-end** package: an interactive marketplace prototype, a login-protected admin dashboard, a plain-English founder's brief, and a full strategic + technical blueprint.

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
| **Founder's Brief** | The vision in plain English | `founders-brief.html` |
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
| Email | `admin@bhumi.land` |
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

## 🙏 Acknowledgements

Concept inspired by the product patterns of [Big Properties World](https://bigpropertiesworld.com/) (large-parcel listings & enquiry flow) and [TalkingLands](https://www.talkinglands.com/) (spatial intelligence & immersive UX), reimagined for Bengaluru's land market.

---

*Bengaluru · India · 2026 — Bhūmī v1.0*
