// Marketplace-specific copy. The "Market Intelligence" banner reads from here
// in Phase 1; in Phase 2 it can read from a `market_stats` table.

export const intelBanner = {
  eyebrow: 'Market Intelligence',
  body: 'Devanahalli corridor land appreciated 14% YoY in 2024–25, outpacing Bengaluru’s overall land inflation of 9%. Of the 7,400 acres in Bhūmī’s active watchlist, 38% sit within notified KIADB industrial zones.',
  source: 'Source: KIADB industrial zone notifications · BDA master plan · Bhūmī transaction data',
}

export const resultCount = (n) => `${n} ${n === 1 ? 'parcel' : 'parcels'}`
