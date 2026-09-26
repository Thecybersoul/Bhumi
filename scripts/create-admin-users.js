/* Create (or reset) the named admin accounts — migration 012.

     node scripts/create-admin-users.js <credentials-file> [--reset]

   Each account gets a freshly generated password: 20 random
   characters from crypto.randomInt, grouped for readability. Only the
   scrypt hash goes into the database. The plaintext is written once,
   to <credentials-file>, which must be OUTSIDE the repository, and
   nowhere else. Hand each person their own line, then delete the
   file. Everyone can change their password from the app's Profile tab.

   Existing accounts are left alone unless --reset is passed, which
   issues new passwords and invalidates the old ones. */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

const ACCOUNTS = [
  { name: 'Chethan', email: 'chethan@bhumiestates.in' },
  { name: 'Sanjog', email: 'sanjog@bhumiestates.in' },
  { name: 'Ranjith', email: 'ranjith@bhumiestates.in' },
]

function loadEnv() {
  for (const f of ['.env.local', '.env']) {
    const p = path.join(__dirname, '..', f)
    if (!fs.existsSync(p)) continue
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}

/* No look-alikes (0/O, 1/l/I) so a password can be read aloud or typed
   off a screen; every group mixes cases, digits and a symbol. */
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnopqrstuvwxyz'
const DIGIT = '23456789'
const SYMBOL = '#$%&*+=?@'
const ALL = UPPER + LOWER + DIGIT + SYMBOL
const pick = (set) => set[crypto.randomInt(set.length)]

function generatePassword() {
  const groups = []
  for (let g = 0; g < 4; g++) {
    const chars = [pick(UPPER), pick(LOWER), pick(DIGIT), pick(SYMBOL), pick(ALL)]
    for (let i = chars.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1)
      ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    groups.push(chars.join(''))
  }
  return groups.join('-')
}

function hashPassword(password) {
  const N = 16384, r = 8, p = 1
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, 64, { N, r, p })
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${hash.toString('base64')}`
}

async function main() {
  const out = process.argv[2]
  const reset = process.argv.includes('--reset')
  if (!out || out.startsWith('--')) {
    console.error('Usage: node scripts/create-admin-users.js <credentials-file-outside-the-repo> [--reset]')
    process.exit(1)
  }
  const repo = path.resolve(__dirname, '..')
  if (path.resolve(out).startsWith(repo + path.sep)) {
    console.error('Refusing to write passwords inside the repository. Pick a path outside it.')
    process.exit(1)
  }

  loadEnv()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  const sb = createClient(url, key, { auth: { persistSession: false } })

  const lines = []
  for (const a of ACCOUNTS) {
    const { data: existing, error: readErr } = await sb.from('admin_users').select('id').eq('email', a.email).maybeSingle()
    if (readErr) throw new Error(`${readErr.message} — has migration 012 been applied?`)
    if (existing && !reset) {
      console.log(`  exists   ${a.email} (unchanged; pass --reset to issue a new password)`)
      continue
    }
    const password = generatePassword()
    const row = { email: a.email, name: a.name, role: 'Admin', active: true, password_hash: hashPassword(password), password_changed_at: new Date().toISOString() }
    const { error } = existing
      ? await sb.from('admin_users').update(row).eq('id', existing.id)
      : await sb.from('admin_users').insert(row)
    if (error) throw new Error(`${a.email}: ${error.message}`)
    console.log(`  ${existing ? 'reset  ' : 'created'}  ${a.email}`)
    lines.push(`${a.name.padEnd(9)} ${a.email.padEnd(28)} ${password}`)
  }

  if (lines.length) {
    const body = [
      'Bhumi Estates ERP — admin logins',
      `Issued ${new Date().toLocaleString('en-IN')}`,
      '',
      ...lines,
      '',
      'Sign in on the app or at https://www.bhumiestates.in/admin.',
      'Give each person only their own line, then delete this file.',
      'Passwords can be changed any time from the app: Profile → Change password.',
      '',
    ].join('\n')
    fs.writeFileSync(out, body, { mode: 0o600 })
    console.log(`\nPasswords written to ${out}`)
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
