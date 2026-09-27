/* Checks the WhatsApp post reader (lib/whatsapp/parse.ts) against the
   kinds of posts brokers and owners actually send.

     npx tsx scripts/test-whatsapp-parser.ts

   Exits non-zero on any failure. Add a case whenever a real post is
   read wrongly. */
import { parseWhatsApp, type ListingDraft, type LeadDraft } from '../lib/whatsapp/parse'

type Expect = Partial<Record<keyof ListingDraft | keyof LeadDraft | 'kind' | 'count' | 'phone' | 'name' | 'role', unknown>>
const cases: { name: string; text: string; expect: Expect; index?: number }[] = [
  {
    name: 'classic land post with acre+gunta, per-acre rate, contact',
    text: `*For Sale* 📍 Budigere, Hoskote tq
2 acre 10 gunta, DC converted, E khata
40 ft road, east facing
Rate 3.2 cr per acre neg
Contact Ravi Kumar 98450 12345`,
    expect: { kind: 'listing', extent_acres: 2.25, price_per_acre_cr: 3.2, price_total_cr: 7.2, conversion: 'Converted (DC conversion, as stated)', khata: 'E khata', facing: 'East', road_type: '40 ft road', price_type: 'Negotiable', zone: 'East', property_type: 'land-parcels', phone: '98450 12345', name: 'Ravi Kumar' },
  },
  {
    name: 'whatsapp copy prefix, guntas only, per gunta rate',
    text: `[27/09/26, 3:59 pm] Suresh Realty: 20 guntas agri land near Devanahalli airport
45 L per gunta. Owner direct. 9900112233`,
    expect: { kind: 'listing', extent_acres: 0.5, price_per_acre_cr: 18, price_total_cr: 9, conversion: 'Not converted (agricultural)', zone: 'North', phone: '99001 12233', role: 'Landowner' },
  },
  {
    name: 'residential site with dimensions and sq ft rate',
    text: `BDA approved site for sale in Yelahanka
30x40 east facing, A khata
Rs 7500 per sqft
Call 8123456789`,
    expect: { kind: 'listing', property_type: 'residential', plot_area_sqft: 1200, dimensions: '30 × 40 ft', price_per_sqft: 7500, khata: 'A khata', authority: 'BDA', facing: 'East', zone: 'North' },
  },
  {
    name: 'apartment with BHK, built-up and total price in lakh',
    text: `3 BHK flat 1460 sqft ready to move JP Nagar 7th phase
Price 95 L negotiable
Contact Priya 9876543210`,
    expect: { kind: 'listing', bhk: 3, built_up_sqft: 1460, price_total_cr: 0.95, price_type: 'Negotiable', zone: 'South', property_type: 'residential' },
  },
  {
    name: 'large parcel on highway with survey number',
    text: `12 acres land on NH 44 frontage, Chikkaballapur
Sy no 45/2, clear title
Asking 2.5 cr/acre`,
    expect: { kind: 'listing', extent_acres: 12, property_type: 'large-land-parcels', price_per_acre_cr: 2.5, price_total_cr: 30, survey_number: '45/2', zone: 'North' },
  },
  {
    name: 'warehouse for lease',
    text: `Warehouse for lease in Hoskote, 25000 sqft built up, 40 ft road, rent 22 per sqft`,
    expect: { kind: 'listing', property_type: 'warehouses', for_lease: true, zone: 'East' },
  },
  {
    name: 'buyer requirement becomes a lead',
    text: `Requirement: 2-3 acres converted land near airport / Devanahalli
Budget 3 cr per acre. Client ready. Pls share. Mahesh 9844098440`,
    expect: { kind: 'lead', intent: 'Buy', areas: 'Kempegowda Airport, Devanahalli', budget: '3 cr per acre', role: 'Buyer', phone: '98440 98440' },
  },
  {
    name: 'multiple properties in one post',
    text: `Available properties:
1) 5 acres Bagalur, 2.8 cr per acre
2) 2 acres 20 guntas Kannamangala, 4 cr per acre, DC converted
3) 30x40 site Yelahanka 80 L
Contact Gowda Properties 9741234567`,
    expect: { count: 3 },
  },
  {
    name: 'multiple: second item read correctly',
    index: 1,
    text: `Available properties:
1) 5 acres Bagalur, 2.8 cr per acre
2) 2 acres 20 guntas Kannamangala, 4 cr per acre, DC converted
3) 30x40 site Yelahanka 80 L
Contact Gowda Properties 9741234567`,
    expect: { extent_acres: 2.5, price_per_acre_cr: 4, price_total_cr: 10, zone: 'North', role: 'Agent' },
  },
  {
    name: 'phone number is never read as a price',
    text: `Plot in Sarjapur 2400 sqft, call 9845012345`,
    expect: { kind: 'listing', plot_area_sqft: 2400, price_total_cr: undefined, price_per_sqft: undefined },
  },
  {
    name: 'compact shorthand and full rupee price',
    text: `Hoskote main road 2A 10G converted
Price ₹ 5,40,00,000/- final
Ramesh 9611122233`,
    expect: { kind: 'listing', extent_acres: 2.25, price_total_cr: 5.4, price_type: 'Fixed', zone: 'East', name: 'Ramesh' },
  },
  {
    name: 'Kannada-English mix with gunte',
    text: `Doddaballapur hatra 1 acre 20 gunte jameenu maaratakke ide, rate 1.8 cr per acre, owner number 9731122334`,
    expect: { kind: 'listing', extent_acres: 1.5, price_per_acre_cr: 1.8, price_total_cr: 2.7, zone: 'North', role: 'Landowner' },
  },
  {
    name: '"Contact <number>" is not a name; the WhatsApp sender is used',
    text: `[27/09/26, 3:59 pm] Ravi Kumar: *For Sale* 📍 Budigere, Hoskote tq
2 acre 10 gunta, DC converted
Rate 3.2 cr per acre neg
Contact 98450 12345`,
    expect: { name: 'Ravi Kumar', phone: '98450 12345' },
  },
  {
    name: 'greeting is not a property',
    text: `Good morning sir 🙏 have a great day`,
    expect: { count: 0 },
  },
]

let failed = 0
for (const c of cases) {
  const r = parseWhatsApp(c.text)
  const d = r.drafts[c.index ?? 0] as unknown as Record<string, unknown> | undefined
  const problems: string[] = []
  for (const [k, want] of Object.entries(c.expect)) {
    const got = k === 'count' ? r.drafts.length : k === 'phone' ? r.contact?.phone : k === 'name' ? r.contact?.name : k === 'role' ? r.contact?.role : d?.[k]
    if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${k}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`)
  }
  if (problems.length) {
    failed++
    console.log(`✗ ${c.name}\n    ${problems.join('\n    ')}\n    title: ${d?.title}`)
  } else console.log(`✓ ${c.name}  →  ${d?.title ?? '(nothing)'}`)
}
console.log(`\n${cases.length - failed}/${cases.length} passed`)
process.exit(failed ? 1 : 0)
