/* Checks the shared phone helper (lib/phone.ts) that builds every Call and
   WhatsApp link, and that the app's copy hasn't drifted from it.

     npx tsx scripts/test-phone.ts */
import { readFileSync } from 'node:fs'
import { parsePhone, telLink, waLink } from '../lib/phone'

let fails = 0
const check = (label: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '  ok ' : 'FAIL'}  ${label}${!ok && detail ? ` — ${detail}` : ''}`)
  if (!ok) fails++
}
const eq = (label: string, input: string | null | undefined, tel: string | null, wa: string | null) => {
  const t = telLink(input)
  const w = waLink(input)
  check(`${JSON.stringify(input)} → tel ${t ?? 'none'} · wa ${w ?? 'none'}`, t === tel && w === wa, `got tel ${t} wa ${w}`)
}

// The numbers named in the brief, and the ones that crashed before.
eq('mobile', '+91 98450 54449', 'tel:+919845054449', 'https://wa.me/919845054449')
eq('Bengaluru landline', '+91 80 4145 6000', 'tel:+918041456000', null)
eq('toll-free', '1800 267 1010', 'tel:18002671010', null)
eq('international', '+61 2 9385 1000', 'tel:+61293851000', 'https://wa.me/61293851000')
eq('empty', '', null, null)
eq('two numbers in one string', '+91 9916503814; +91 8123171581', null, null)
eq('letters', 'abc', null, null)

// More shapes that appear in the data and in typing.
eq('bare 10-digit mobile gets +91', '9845054449', 'tel:+919845054449', 'https://wa.me/919845054449')
eq('0-prefixed mobile', '09845054449', 'tel:+919845054449', 'https://wa.me/919845054449')
eq('mobile on the 80 series, written 5+5', '+91 80888 66000', 'tel:+918088866000', 'https://wa.me/918088866000')
eq('080 landline with hyphens', '080-4145-6000', 'tel:+918041456000', null)
eq('Mumbai landline', '+91 22 2490 8000', 'tel:+912224908000', null)
eq('Chennai landline', '+91 44 4347 0970', 'tel:+914443470970', null)
eq('Hyderabad landline', '+91 40 2381 0671', 'tel:+914023810671', null)
eq('two numbers split by a slash', '98450 54449 / 98450 54450', null, null)
eq('comma list', '+91 98450 54449, +91 98450 54450', null, null)
eq('too short', '12345', null, null)
eq('too long', '+91 98450 54449 12345', null, null)
eq('null', null, null, null)
eq('undefined', undefined, null, null)
eq('stray text', 'call me on 98450 54449', null, null)
eq('whitespace only', '   ', null, null)

const m = parsePhone('+91 98450 54449')!
check('display keeps the 5+5 grouping', m.display === '+91 98450 54449' && m.kind === 'mobile')
check('landline is not offered WhatsApp', parsePhone('+91 80 4145 6000')?.kind === 'landline' && parsePhone('+91 80 4145 6000')?.wa === null)
check('toll-free keeps its own digits (no +91)', parsePhone('1800 267 1010')?.tel === 'tel:18002671010')
check('a WhatsApp link carries its message, encoded', waLink('9845054449', 'Hi & hello') === 'https://wa.me/919845054449?text=Hi%20%26%20hello')

check('the app copy is identical to lib/phone.ts', readFileSync('lib/phone.ts', 'utf8') === readFileSync('mobile/src/lib/phone.ts', 'utf8'))

console.log(fails ? `\nFAILED: ${fails}` : '\nPASS: the phone helper behaves.')
process.exit(fails ? 1 : 0)
