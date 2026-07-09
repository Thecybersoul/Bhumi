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
CREATE POLICY "public_read_live_properties"
  ON properties FOR SELECT
  USING (status = 'Live');

-- Public can insert enquiries
CREATE POLICY "public_insert_enquiries"
  ON enquiries FOR INSERT
  WITH CHECK (true);

-- Service role (admin API) bypasses RLS — no policy needed, handled by service key

-- Indexes
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_zone ON properties(zone);
CREATE INDEX idx_properties_featured ON properties(featured);
CREATE INDEX idx_enquiries_property_id ON enquiries(property_id);
CREATE INDEX idx_enquiries_stage ON enquiries(stage);
CREATE INDEX idx_enquiries_created_at ON enquiries(created_at DESC);

-- ===================================================
-- Seed Data — existing 7 properties
-- ===================================================

INSERT INTO properties (code, title, location, zone, extent_acres, price_per_acre_cr, price_type, status, land_use, use_cases, road_type, dist_airport_km, dist_city_km, topo, soil, water, conversion, ownership, title_clear, risk, risk_notes, description, amenities, img_url, featured, conn_score)
VALUES
  ('BLR-1042','68 Acres NH-44 Frontage Land','Devanahalli','North',68,9.5,'Negotiable','Live','Residential / Mixed',ARRAY['Township','Villa','Land-banking'],'NH-44, 850m',15,38,'Flat','Red loam','Borewell + good table','Not converted','Agreement holder',true,'Low','No rajakaluve / lake buffer','Strategically located large parcel near Kempegowda International Airport — ideal for township, villa or land-banking with strong appreciation potential driven by aerospace SEZ & business parks.','Intl Airport 15km · KIADB 8km · Metro Phase-2B planned','/img/p1.jpg',true,88),
  ('BLR-1037','22 Acres Scenic Lake-View Land','Sarjapur','East',22,6.2,'Fixed','Live','Residential',ARRAY['Villa','Resort'],'60ft road',52,24,'Gently sloping','Red loam','Cauvery supply nearby','Converted (NA)','Single owner',true,'Low','Lake buffer 30m setback respected','A picturesque parcel adjoining a lake — perfect for a premium villa community or boutique resort with strong residential demand in the IT belt.','Whitefield 12km · IT parks 6km · International schools 4km','/img/p2.jpg',true,81),
  ('BLR-1029','45 Acres Industrial-Grade Land','Hoskote','East',45,3.8,'Negotiable','Live','Industrial',ARRAY['Industrial','Township'],'State highway frontage',45,30,'Flat','Rocky base, load-bearing','Borewell x3','Converted','Single owner',true,'Low','Clear of all buffers','Wide, flat, well-serviced parcel suited for warehousing, logistics or industrial development with direct highway frontage.','STRR 5km · KIADB industrial area 10km · rail siding 18km','/img/p3.jpg',false,74),
  ('BLR-1051','30 Acres Fertile Agricultural Land','Kanakapura Road','South',30,1.6,'Negotiable','Live','Agricultural',ARRAY['Agriculture','Land-banking','Resort'],'Village road 30ft',62,34,'Gently undulating','Fertile red loam','Canal + 2 borewells','Not converted','Multiple owners (4)',true,'Moderate','Seasonal stream — verify buffer','Lush, fertile farmland with mature trees and canal access — a strong long-term hold as the southern corridor develops.','NICE Road 22km · Metro Green Line ext. planned · Art-of-Living 14km','/img/p4.jpg',false,62),
  ('BLR-1064','52 Acres Resort-Ready Hill-View Land','Nandi Hills','North',52,4.4,'On Request','Live','Residential / Hospitality',ARRAY['Resort','Villa','Land-banking'],'District road',30,48,'Rolling with elevation','Rocky-loam','Borewell','Partially converted','Single owner',true,'Low','Elevated — no flood risk','Elevated, scenic parcel with hill views — a rare resort/villa development opportunity in a fast-appreciating tourism corridor.','Nandi Hills 6km · Airport 30km · NH-44 12km','/img/p5.jpg',true,70),
  ('BLR-1018','15 Acres Highway Commercial Land','Tumkur Road','West',15,7.1,'Fixed','Live','Commercial',ARRAY['Industrial','Township','Land-banking'],'NH-4 frontage 400m',55,22,'Flat','Hard strata','Cauvery','Converted (NA)','Single owner',true,'Low','Clear','Premium highway-frontage commercial parcel — strong visibility and access for showrooms, logistics or mixed commercial use.','NH-4 · Dabaspet industrial area 8km · rail 5km','/img/p1.jpg',false,79),
  ('BLR-1073','40 Acres Mixed-Use Township Land','Doddaballapur','North',40,2.9,'Negotiable','Reserved','Residential / Industrial',ARRAY['Township','Industrial','Land-banking'],'STRR frontage',42,46,'Flat','Red loam','Borewell','Not converted','Agreement holder',false,'Moderate','Title under verification','Large STRR-frontage parcel with township & industrial potential — currently reserved pending title verification.','STRR · KIADB 9km · Airport 42km','/img/p3.jpg',false,66);
