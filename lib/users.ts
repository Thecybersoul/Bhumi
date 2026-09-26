import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { createServiceClient, hasSupabase } from './supabase'

/* ═══════════════════════════════════════════════════════════
   Named admin accounts (migration 012).

   Everyone has the same access. Accounts exist so every change
   can say who made it. Passwords are scrypt hashes. Accounts are
   created with scripts/create-admin-users.js, which prints each
   password exactly once and never writes it into the repository.

   Before any account exists (a fresh checkout, or before 012 is
   applied), the single ADMIN_EMAIL / ADMIN_PASSWORD login still
   works as the account "env". The moment a real account exists,
   that shared login and every session issued under it stop
   working. From then on, only named accounts are allowed in.
   ═══════════════════════════════════════════════════════════ */

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number, opts: object) => Promise<Buffer>

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  active: boolean
  created_at?: string
  last_login_at?: string | null
  password_changed_at?: string | null
}

export const ENV_USER_ID = 'env'

const N = 16384
const R = 8
const P = 1

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, 64, { N, r: R, p: P })
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${hash.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, salt, hash] = stored.split('$')
  if (algo !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64')
  const actual = await scrypt(password, Buffer.from(salt, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  })
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

/* Every authenticated request resolves its account, so the list is
   cached briefly in-process. A deactivated account is locked out
   within this window. */
let cache: { at: number; users: AdminUser[] } | null = null
const TTL_MS = 30_000

export function invalidateUsers() {
  cache = null
}

/* "No accounts" has to mean the table is really empty, or not there
   yet (before 012). It must never mean "the database had a bad
   moment". An error would otherwise read as an empty list and let
   the retired shared login back in. So an error is reported as
   unknown, and unknown is treated as "named accounts are on". */
async function loadUsers(): Promise<{ users: AdminUser[]; known: boolean }> {
  if (cache && Date.now() - cache.at < TTL_MS) return { users: cache.users, known: true }
  if (!hasSupabase()) return { users: [], known: true }
  try {
    const { data, error } = await createServiceClient()
      .from('admin_users')
      .select('id,email,name,role,active,created_at,last_login_at,password_changed_at')
      .order('created_at')
    if (error) {
      const missing = error.code === 'PGRST205' || error.code === '42P01' || /does not exist|could not find the table/i.test(error.message)
      return { users: [], known: missing }
    }
    const users = (data ?? []) as AdminUser[]
    cache = { at: Date.now(), users }
    return { users, known: true }
  } catch {
    return { users: cache?.users ?? [], known: Boolean(cache) }
  }
}

export async function listUsers(): Promise<AdminUser[]> {
  return (await loadUsers()).users
}

/** True once at least one named account exists, or whenever that
    can't be confirmed. The shared env login only works on a database
    that definitely has no accounts. */
export async function namedAccountsEnabled(): Promise<boolean> {
  const { users, known } = await loadUsers()
  return !known || users.length > 0
}

export function envUser(): AdminUser {
  return { id: ENV_USER_ID, email: process.env.ADMIN_EMAIL ?? 'admin', name: 'Admin', role: 'Admin', active: true }
}

export async function getUser(id: string): Promise<AdminUser | null> {
  const { users, known } = await loadUsers()
  if (id === ENV_USER_ID) return known && users.length === 0 ? envUser() : null
  const u = users.find((x) => x.id === id)
  return u && u.active ? u : null
}

export async function findWithHash(email: string): Promise<(AdminUser & { password_hash: string }) | null> {
  if (!hasSupabase()) return null
  const { data } = await createServiceClient()
    .from('admin_users')
    .select('*')
    .ilike('email', email.trim())
    .maybeSingle()
  return (data as (AdminUser & { password_hash: string }) | null) ?? null
}

export async function touchLogin(id: string) {
  if (id === ENV_USER_ID || !hasSupabase()) return
  await createServiceClient().from('admin_users').update({ last_login_at: new Date().toISOString() }).eq('id', id)
  invalidateUsers()
}

export async function setPassword(id: string, password: string) {
  const password_hash = await hashPassword(password)
  const { error } = await createServiceClient()
    .from('admin_users')
    .update({ password_hash, password_changed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

/** The rules a new password must meet, as one message, or null. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 12) return 'Use at least 12 characters.'
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length
  if (classes < 3) return 'Mix at least three of: lowercase, uppercase, numbers, symbols.'
  return null
}
