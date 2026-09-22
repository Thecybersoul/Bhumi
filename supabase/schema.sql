-- ===================================================
-- Bhūmī Database Schema
-- Run this in Supabase SQL Editor
-- ===================================================

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT UNIQUE NOT NULL,
  title            TEXT NOT NULL,
  location         TEXT NOT NULL,
  zone             TEXT NOT NULL CHECK (zone IN ('North','East','South','West')),
  extent_acres     NUMERIC(10,2) NOT NULL,
  price_per_acre_cr NUMERIC(10,3) NOT NULL,
  price_type       TEXT NOT NULL DEFAULT 'Negotiable' CHECK (price_type IN ('Fixed','Negotiable','On Request')),
  status           TEXT NOT NULL DEFAULT 'Live' CHECK (status IN ('Live','Reserved','Sold')),
  land_use         TEXT NOT NULL DEFAULT 'Residential',
  use_cases        TEXT[] NOT NULL DEFAULT '{}',
  road_type        TEXT DEFAULT '',
  dist_airport_km  INT DEFAULT 30,
  dist_city_km     INT DEFAULT 30,
  topo             TEXT DEFAULT 'Flat',
  soil             TEXT DEFAULT '',
  water            TEXT DEFAULT '',
  conversion       TEXT DEFAULT 'Not converted',
  ownership        TEXT DEFAULT 'Single owner',
  title_clear      BOOLEAN DEFAULT true,
  risk             TEXT DEFAULT 'Low' CHECK (risk IN ('Low','Moderate','High')),
  risk_notes       TEXT DEFAULT '',
  description      TEXT DEFAULT '',
  amenities        TEXT DEFAULT '',
  img_url          TEXT DEFAULT '/img/p1.jpg',
  featured         BOOLEAN DEFAULT false,
  conn_score       INT DEFAULT 70,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Enquiries table
CREATE TABLE IF NOT EXISTS enquiries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID REFERENCES properties(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  company      TEXT DEFAULT '',
  phone        TEXT DEFAULT '',
  email        TEXT DEFAULT '',
  intent       TEXT NOT NULL DEFAULT 'Enquire' CHECK (intent IN ('Enquire','Visit')),
  stage        TEXT NOT NULL DEFAULT 'New' CHECK (stage IN ('New','Contacted','Visit')),
  source       TEXT DEFAULT 'Website',
  notes        TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Public can read Live properties
DROP POLICY IF EXISTS "public_read_live_properties" ON properties;
CREATE POLICY "public_read_live_properties"
  ON properties FOR SELECT
  USING (status = 'Live');

-- Public can insert enquiries
DROP POLICY IF EXISTS "public_insert_enquiries" ON enquiries;
CREATE POLICY "public_insert_enquiries"
  ON enquiries FOR INSERT
  WITH CHECK (true);

-- Service role (admin API) bypasses RLS — no policy needed, handled by service key

-- Indexes
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_zone ON properties(zone);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_enquiries_property_id ON enquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_stage ON enquiries(stage);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);

-- No seed data here by design: `properties` holds real inventory, and a
-- listing is a representation about actual land. Demo rows belong in
-- lib/data/seed.ts (the in-code fallback), never in the live database.
