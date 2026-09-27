-- ═══════════════════════════════════════════════════════════
-- 015 — Contacts, a working lead pipeline, and listings shown
--
-- contacts         One row per person the business deals with —
--                  buyers, sellers, landowners, investors, brokers,
--                  lawyers. `phone_norm` is the phone reduced to
--                  digits with the 91 country code, which is what
--                  duplicate checks compare, so "+91 98450 12345"
--                  and "9845012345" are the same person.
--
-- contact_links    Tags a contact on any record (a deal, listing,
--                  task, note, meeting or verification case) with
--                  the role they play there: the landowner of a
--                  listing, the buyer's lawyer on a deal. A lead's
--                  own person is leads.contact_id, and a deal's
--                  parties are transactions.buyer_/seller_contact_id,
--                  so those are not repeated here.
--
-- leads            Gain what an advisor needs to work one: whether
--                  they want to buy or sell, budget, preferred areas,
--                  size, timeline, priority, who owns it, the next
--                  follow-up, and — once it closes — the deal it
--                  became. The stages now run
--                    New → Contacted → Qualified → Visit (site visit)
--                    → Negotiation → Converted | Lost | Nurture.
--                  'Closed' stays valid for rows written before this.
--
-- lead_properties  Which listings have been shown to which client,
--                  and how it went: shortlisted, shared, visit
--                  planned, visited, interested, not interested,
--                  offer made, with the client's feedback.
--
-- Existing leads and deal parties are copied into contacts, matched
-- by phone or email so nobody is entered twice.
-- ═══════════════════════════════════════════════════════════

-- Digits only, with the Indian country code, for duplicate checks.
CREATE OR REPLACE FUNCTION bhumi_phone_norm(p TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
           WHEN length(d) = 10 THEN '91' || d
           WHEN length(d) = 11 AND left(d, 1) = '0' THEN '91' || right(d, 10)
           ELSE d
         END
  FROM (SELECT regexp_replace(COALESCE(p, ''), '\D', '', 'g') AS d) x
$$;

-- ─── Contacts ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT DEFAULT '',
  phone_norm  TEXT DEFAULT '',
  alt_phone   TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  company     TEXT DEFAULT '',
  roles       TEXT[] NOT NULL DEFAULT '{}',
  city        TEXT DEFAULT '',
  address     TEXT DEFAULT '',
  source      TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  created_by  TEXT DEFAULT '',
  updated_by  TEXT DEFAULT '',
  updated_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_norm);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(lower(email));
CREATE INDEX IF NOT EXISTS idx_contacts_name  ON contacts(lower(name));
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS contact_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id    UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL
                  CHECK (entity_type IN ('lead','transaction','property','task','note','meeting','verification')),
  entity_id     TEXT NOT NULL,
  entity_label  TEXT DEFAULT '',
  role          TEXT DEFAULT '',
  created_by    TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contact_id, entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_contact_links_entity ON contact_links(entity_type, entity_id);
ALTER TABLE contact_links ENABLE ROW LEVEL SECURITY;

-- ─── Leads ─────────────────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_id        UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent            TEXT NOT NULL DEFAULT 'Buy';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_min_cr     NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_max_cr     NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS size_requirement  TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS locations         TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline          TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority          TEXT NOT NULL DEFAULT 'Warm';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to       TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason       TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS transaction_id    UUID REFERENCES transactions(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at      TIMESTAMPTZ;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_intent_check;
ALTER TABLE leads ADD CONSTRAINT leads_intent_check
  CHECK (intent IN ('Buy','Sell','Lease','Rent out','Invest','Other'));
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_priority_check;
ALTER TABLE leads ADD CONSTRAINT leads_priority_check
  CHECK (priority IN ('Hot','Warm','Cold'));
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_stage_check;
ALTER TABLE leads ADD CONSTRAINT leads_stage_check
  CHECK (stage IN ('New','Contacted','Qualified','Visit','Negotiation','Converted','Lost','Nurture','Closed'));
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_channel_check;
ALTER TABLE leads ADD CONSTRAINT leads_channel_check
  CHECK (channel IN ('WhatsApp','Form','Call','Landing page','Walk-in','Referral','Broker','Portal','Social media','Email','Other'));

CREATE INDEX IF NOT EXISTS idx_leads_contact   ON leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(next_follow_up_at);

-- Someone asking to list their property is a seller.
UPDATE leads SET intent = 'Sell' WHERE kind = 'Listing request' AND intent = 'Buy';

-- ─── Listings shown to a lead ──────────────────────────────
CREATE TABLE IF NOT EXISTS lead_properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  property_label  TEXT DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'Shortlisted'
                    CHECK (status IN ('Shortlisted','Shared','Visit planned','Visited','Interested','Not interested','Offer made')),
  shared_at       TIMESTAMPTZ,
  visited_at      TIMESTAMPTZ,
  feedback        TEXT DEFAULT '',
  created_by      TEXT DEFAULT '',
  updated_by      TEXT DEFAULT '',
  updated_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lead_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_lead_properties_property ON lead_properties(property_id);
ALTER TABLE lead_properties ENABLE ROW LEVEL SECURITY;

-- ─── Deals know their lead and their parties ───────────────
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS lead_id           UUID REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_contact  ON transactions(buyer_contact_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_contact ON transactions(seller_contact_id);

-- ─── A task, note, meeting or document can be about a contact ─
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_entity_type_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_entity_type_check
  CHECK (entity_type IN ('lead','transaction','property','verification','meeting','contact','general'));
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_entity_type_check;
ALTER TABLE notes ADD CONSTRAINT notes_entity_type_check
  CHECK (entity_type IN ('lead','transaction','property','verification','meeting','contact','general'));
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_entity_type_check;
ALTER TABLE meetings ADD CONSTRAINT meetings_entity_type_check
  CHECK (entity_type IN ('property','transaction','task','lead','verification','contact','general'));
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_entity_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_entity_type_check
  CHECK (entity_type IN ('property','note','transaction','lead','verification','meeting','task','contact','general'));

-- ─── Backfill: leads → contacts ────────────────────────────
INSERT INTO contacts (name, phone, phone_norm, email, company, roles, source, created_by, created_at)
SELECT DISTINCT ON (l.key)
       l.name, l.phone, bhumi_phone_norm(l.phone), l.email, COALESCE(l.company, ''),
       ARRAY[CASE WHEN l.intent = 'Sell' THEN 'Seller' ELSE 'Buyer' END],
       'Lead · ' || l.kind, 'Imported', COALESCE(l.created_at, now())
FROM (
  SELECT *, COALESCE(NULLIF(bhumi_phone_norm(phone), ''), lower(NULLIF(email, ''))) AS key
  FROM leads
  WHERE contact_id IS NULL AND (COALESCE(phone, '') <> '' OR COALESCE(email, '') <> '')
) l
WHERE NOT EXISTS (
  SELECT 1 FROM contacts c
  WHERE (c.phone_norm <> '' AND c.phone_norm = bhumi_phone_norm(l.phone))
     OR (COALESCE(c.email, '') <> '' AND lower(c.email) = lower(l.email))
)
ORDER BY l.key, l.created_at;

UPDATE leads l SET contact_id = c.id
FROM contacts c
WHERE l.contact_id IS NULL
  AND ((c.phone_norm <> '' AND c.phone_norm = bhumi_phone_norm(l.phone))
    OR (COALESCE(c.email, '') <> '' AND COALESCE(l.email, '') <> '' AND lower(c.email) = lower(l.email)));

-- ─── Backfill: deal parties → contacts ─────────────────────
-- Matched on phone, then email, then — only when neither was given —
-- the exact name, so two different "Ravi"s with numbers stay apart.
DO $$
DECLARE
  side TEXT;
BEGIN
  FOREACH side IN ARRAY ARRAY['buyer', 'seller'] LOOP
    EXECUTE format($f$
      INSERT INTO contacts (name, phone, phone_norm, email, roles, source, created_by, created_at)
      SELECT DISTINCT ON (key) %1$s_name, COALESCE(%1$s_phone, ''), bhumi_phone_norm(%1$s_phone), COALESCE(%1$s_email, ''),
             ARRAY[%2$L], 'Deal · ' || reference, 'Imported', COALESCE(opened_at, now())
      FROM (
        SELECT *, COALESCE(NULLIF(bhumi_phone_norm(%1$s_phone), ''), lower(NULLIF(%1$s_email, '')), 'name:' || lower(%1$s_name)) AS key
        FROM transactions
        WHERE %1$s_contact_id IS NULL AND COALESCE(%1$s_name, '') <> ''
      ) t
      WHERE NOT EXISTS (
        SELECT 1 FROM contacts c
        WHERE (c.phone_norm <> '' AND c.phone_norm = bhumi_phone_norm(t.%1$s_phone))
           OR (COALESCE(c.email, '') <> '' AND lower(c.email) = lower(COALESCE(t.%1$s_email, '')))
           OR (COALESCE(t.%1$s_phone, '') = '' AND COALESCE(t.%1$s_email, '') = '' AND lower(c.name) = lower(t.%1$s_name))
      )
      ORDER BY key, opened_at
    $f$, side, initcap(side));

    EXECUTE format($f$
      UPDATE transactions t SET %1$s_contact_id = c.id
      FROM contacts c
      WHERE t.%1$s_contact_id IS NULL AND COALESCE(t.%1$s_name, '') <> ''
        AND ((c.phone_norm <> '' AND c.phone_norm = bhumi_phone_norm(t.%1$s_phone))
          OR (COALESCE(c.email, '') <> '' AND lower(c.email) = lower(COALESCE(t.%1$s_email, '')))
          OR (COALESCE(t.%1$s_phone, '') = '' AND COALESCE(t.%1$s_email, '') = '' AND lower(c.name) = lower(t.%1$s_name)))
    $f$, side);
  END LOOP;
END $$;
