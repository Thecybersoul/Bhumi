/* Phone numbers for Call and WhatsApp links. Pure (no imports), and
   copied byte-for-byte to mobile/src/lib/phone.ts (scripts/test-phone.ts
   fails if the two differ), so the website and the app build links from
   one set of rules.

   One field holds ONE number. Anything that looks like more than one
   number ("+91 99165 03814; +91 81231 71581"), has letters, or is not a
   plausible number yields null, and null means no link: the button is
   hidden or disabled, never built from a guess. (The earlier helper
   stripped every non-digit from the whole string, so two numbers became
   one 24-digit "number" that tel: and wa.me then choked on.)

   What it decides:
   - mobile    Indian 10 digits starting 6-9 (with or without +91 or 0):
               Call and WhatsApp.
   - landline  Indian numbers with an STD code (+91 80 …, +91 22 …, 0xx …):
               Call only.
   - tollfree  1800 / 1860 numbers: Call only, never given a +91.
   - intl      any other +country number, 8-15 digits: Call and WhatsApp.

   +91 80 and +91 79 are the one ambiguity: 80 is Bengaluru's STD code but
   80xxx is also a mobile series. They count as landlines only when written
   with the code set apart ("+91 80 4145 6000", "080-4145-6000"), and as
   mobiles when written as 5+5 ("+91 80888 66000"). */

export type PhoneKind = 'mobile' | 'landline' | 'tollfree' | 'intl'

export interface ParsedPhone {
  kind: PhoneKind
  /** Digits with a leading +, or bare digits for toll-free. */
  number: string
  /** "+91 98450 54449", for showing. */
  display: string
  tel: string
  /** null when the number can't be a mobile. */
  wa: string | null
}

const STD_NOT_MOBILE = /^(11|20|22|33|40|44)/ // start with 1-4: can never be a mobile

export function parsePhone(raw: string | null | undefined): ParsedPhone | null {
  const s = String(raw ?? '').trim()
  if (!s) return null
  if (/[A-Za-z;,/|\n\r]/.test(s)) return null // letters, or a list of numbers
  if (/[^\d\s+()\-.]/.test(s)) return null
  if ((s.match(/\+/g) ?? []).length > 1 || (s.includes('+') && !s.startsWith('+'))) return null
  const digits = s.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) return null

  // Toll-free: 1800 xxx xxxx (no country code), also written 1-800.
  if (!s.startsWith('+') && /^(1800|1860)\d{6,7}$/.test(digits)) {
    return { kind: 'tollfree', number: digits, display: groupToll(digits), tel: `tel:${digits}`, wa: null }
  }

  let national: string
  let cc: string
  let std2 = false // an STD code written apart from the number
  if (s.startsWith('+')) {
    if (digits.startsWith('91')) {
      cc = '91'
      national = digits.slice(2)
      std2 = /^\+\s*91[\s\-.()]*0?\d{2}[\s\-.()]+\d{3,4}[\s\-.()]+\d{3,4}$/.test(s)
    } else {
      return mk('intl', `+${digits}`, s.replace(/\s+/g, ' ').trim(), true)
    }
  } else if (digits.length === 12 && digits.startsWith('91')) {
    cc = '91'
    national = digits.slice(2)
  } else if (digits.length === 11 && digits.startsWith('0')) {
    cc = '91'
    national = digits.slice(1)
    // A trunk 0 means an STD code follows, so 080… / 079… are landlines.
    std2 = /^(79|80)/.test(national)
  } else if (digits.length === 10 && /^[6-9]/.test(digits)) {
    cc = '91'
    national = digits
  } else {
    return null
  }
  if (cc !== '91') return null

  if (national.length === 11 && national.startsWith('0')) national = national.slice(1)
  if (national.length < 8 || national.length > 10) return null

  const mobile = national.length === 10 && /^[6-9]/.test(national) && !STD_NOT_MOBILE.test(national) && !(std2 && /^(79|80)/.test(national))
  const number = `+91${national}`
  return mk(mobile ? 'mobile' : 'landline', number, formatIn(national, mobile, std2), mobile)
}

function mk(kind: PhoneKind, number: string, display: string, wa: boolean): ParsedPhone {
  return { kind, number, display, tel: `tel:${number}`, wa: wa ? `https://wa.me/${number.slice(1)}` : null }
}

function formatIn(national: string, mobile: boolean, std2: boolean) {
  if (mobile && national.length === 10) return `+91 ${national.slice(0, 5)} ${national.slice(5)}`
  if (national.length === 10 && (std2 || /^(11|20|22|33|40|44|79|80)/.test(national))) return `+91 ${national.slice(0, 2)} ${national.slice(2, 6)} ${national.slice(6)}`
  return `+91 ${national}`
}

function groupToll(d: string) {
  return d.length === 10 ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : d
}

/** tel: link, or null when there is nothing safe to dial. */
export const telLink = (raw: string | null | undefined): string | null => parsePhone(raw)?.tel ?? null

/** wa.me link (with an optional prefilled message), or null unless the number can be a mobile. */
export function waLink(raw: string | null | undefined, text?: string): string | null {
  const w = parsePhone(raw)?.wa
  return w ? `${w}${text ? `?text=${encodeURIComponent(text)}` : ''}` : null
}
