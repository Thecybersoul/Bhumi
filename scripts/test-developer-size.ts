/* Checks the developer-size rule the Sales funnel uses to put mid to large
   developers first (lib/crm.ts developerSize / byPreference), and that the
   app's copy hasn't drifted.

     npx tsx scripts/test-developer-size.ts */
import { readFileSync } from 'node:fs'
import { byPreference, developerSize, matchesSize, type Prospect } from '../lib/crm'

let fails = 0
const check = (label: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '  ok ' : 'FAIL'}  ${label}${!ok && detail ? ` — ${detail}` : ''}`)
  if (!ok) fails++
}
const tier = (kind: string, deal_band = '') => developerSize({ kind, deal_band })?.tier ?? null

// Kinds exactly as they appear in the research data.
check('listed national developer is large', tier('Developer · Listed national developer') === 'large')
check('listed developer, Bengaluru home market is large', tier('Listed developer · Bengaluru home market') === 'large')
check('large unlisted national developer is large', tier('Developer · Large unlisted national developer') === 'large')
check('township developer is large', tier('Township developer') === 'large')
check('mid-size developer is mid', tier('Mid-size developer · Bengaluru') === 'mid')
check('mid-market LISTED developer is mid, not large', tier('Mid-market listed developer') === 'mid')
check('mid-size builder is mid', tier('Mid-size builder') === 'mid')
check('regional developer is mid', tier('Developer · Regional developer') === 'mid')
check('small plotted developer is small', tier('Small plotted developer') === 'small')
check('home construction builder is small', tier('Developer · Home construction / builder') === 'small')
check('a bare "Developer · Residential developer" has no recorded size', tier('Developer · Residential developer') === 'unsized')
check('a ticket up to 50 acres makes a developer large', tier('Developer', '10–50 acres') === 'large')
check('a ticket up to 20 acres makes a developer mid', tier('Developer', '5–20 acres') === 'mid')
check('a ticket up to 12 acres alone does not', tier('Developer', '5–12 acres') === 'unsized')
check('a data-centre operator is not a developer', tier('Commercial/industrial · Data-centre operator') === null)
check('an office REIT is not a developer', tier('Commercial/industrial · Office REIT (Sattva/Blackstone)') === null)
check('a hotel group is not a developer', tier('Commercial/industrial · Hotel group') === null)
check('a university is not a developer', tier('Institutional buyer · University') === null)
check('a land-source bank is not a developer', tier('Seller · Land source · Bank (SARFAESI auctions)') === null)
check('a local agency is not a developer', tier('Local agency · Co-broker') === null)

const P = (name: string, kind: string, prio: Prospect['prio'], score: number, deal_band = ''): Prospect => ({ id: name, name, kind, prio, score, deal_band } as Prospect)
const order = [
  P('Small', 'Small plotted developer', 'A', 90),
  P('Fund', 'Fund/investor · PE', 'A', 95),
  P('Unsized', 'Developer · Residential developer', 'A', 80),
  P('Mid', 'Mid-size developer', 'C', 40),
  P('LargeB', 'Listed developer', 'B', 70),
  P('LargeA', 'Listed developer', 'A', 60),
].sort(byPreference).map((p) => p.name)
check('order: large (by priority), mid, unsized, small, then non-developers', order.join(',') === 'LargeA,LargeB,Mid,Unsized,Small,Fund', order.join(','))
check('mid–large filter keeps large and mid only', matchesSize({ kind: 'Listed developer', deal_band: '' }, 'midlarge') && matchesSize({ kind: 'Mid-size builder', deal_band: '' }, 'midlarge') && !matchesSize({ kind: 'Small developer', deal_band: '' }, 'midlarge') && !matchesSize({ kind: 'Office REIT', deal_band: '' }, 'midlarge'))

check('the app copy of the rule is identical', readFileSync('lib/crm.ts', 'utf8').split('Developer size')[1]?.split('export const today')[0] === readFileSync('mobile/src/lib/crm.ts', 'utf8').split('Developer size')[1]?.split('export const today')[0])
console.log(fails ? `\nFAILED: ${fails}` : '\nPASS: the developer-size rule behaves.')
process.exit(fails ? 1 : 0)
