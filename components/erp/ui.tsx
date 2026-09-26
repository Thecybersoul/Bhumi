'use client'

import Link from 'next/link'
import {
  Briefcase,
  CircleCheck,
  Globe,
  Link as LinkIcon,
  Map,
  MessagesSquare,
  Navigation,
  Pencil,
  Phone,
  Settings,
  SquareCheck,
  User,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react'
import type { Audited, MeetingKind } from './lib'
import { timeAgo } from './lib'

/* ─── People ─────────────────────────────────────────────── */

/* Each person has one colour everywhere, on the web and in the app,
   so an avatar says who did something before the name is read. */
const PALETTE = ['#0E3B2E', '#9E7833', '#1B6FA8', '#6B4FA8', '#B5543C', '#2F8462']
const FIXED: Record<string, string> = { Chethan: '#2F8462', Sanjog: '#B8862F', Ranjith: '#1B6FA8' }

export function personColor(name?: string | null) {
  if (!name) return 'var(--muted)'
  if (FIXED[name]) return FIXED[name]
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export function initials(name?: string | null) {
  if (!name) return '?'
  const p = name.trim().split(/\s+/)
  return (p[0][0] + (p[1]?.[0] ?? '')).toUpperCase()
}

export function Avatar({ name, size = 28 }: { name?: string | null; size?: number }) {
  const system = !name || name === 'Website' || name === 'Imported' || name === 'System' || name === 'Daily sync'
  if (system) {
    const Icon = name === 'Website' ? Globe : Settings
    return (
      <span className="erpAvatar" style={{ width: size, height: size, background: 'var(--line-2)', color: 'var(--muted)' }} title={name ?? ''}>
        <Icon size={size * 0.5} />
      </span>
    )
  }
  return (
    <span className="erpAvatar" style={{ width: size, height: size, background: personColor(name), fontSize: size * 0.4 }} title={name ?? ''}>
      {initials(name)}
    </span>
  )
}

/** "Added by Sanjog · 3d ago · Edited by Chethan · 2h ago" */
export function ByLine({ record, createdAt, compact }: { record: Audited; createdAt?: string | null; compact?: boolean }) {
  const by = record.created_by
  const upd = record.updated_by
  const edited =
    upd &&
    record.updated_at &&
    (upd !== by || (createdAt && Math.abs(new Date(record.updated_at).getTime() - new Date(createdAt).getTime()) > 60_000))
  if (!by && !edited) return null
  return (
    <div className="erpBy">
      {by ? (
        <span>
          <Avatar name={by} size={16} />
          {compact ? by : `Added by ${by}`}
          {createdAt ? ` · ${timeAgo(createdAt)}` : ''}
        </span>
      ) : null}
      {edited ? (
        <span>
          <Pencil size={11} />
          {compact ? upd : `Edited by ${upd}`} · {timeAgo(record.updated_at)}
        </span>
      ) : null}
    </div>
  )
}

/* ─── Small building blocks ──────────────────────────────── */

export function Card({
  title,
  icon: Icon,
  action,
  actionHref,
  onAction,
  children,
  style,
}: {
  title?: React.ReactNode
  icon?: LucideIcon
  action?: string
  actionHref?: string
  onAction?: () => void
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <section className="erpCard" style={style}>
      {title ? (
        <div className="erpCard__head">
          <div className="erpCard__title">
            {Icon ? <Icon size={17} /> : null}
            {title}
          </div>
          {action && actionHref ? (
            <Link href={actionHref} className="erpCard__action">
              {action} ›
            </Link>
          ) : action && onAction ? (
            <button className="erpCard__action" onClick={onAction}>
              {action} ›
            </button>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function Banner({ tone = 'warn', children }: { tone?: 'warn' | 'error' | 'ok'; children: React.ReactNode }) {
  return <div className={`erpBanner ${tone}`}>{children}</div>
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="erpEmpty">{children}</p>
}

export function Loading() {
  return <p className="erpEmpty">Loading…</p>
}

const TONES: Record<string, [string, string]> = {
  live: ['var(--verified)', 'var(--verified-bg)'],
  verified: ['var(--verified)', 'var(--verified-bg)'],
  closed: ['var(--verified)', 'var(--verified-bg)'],
  completed: ['var(--verified)', 'var(--verified-bg)'],
  approved: ['var(--verified)', 'var(--verified-bg)'],
  reserved: ['var(--progress)', 'var(--progress-bg)'],
  progress: ['var(--progress)', 'var(--progress-bg)'],
  contacted: ['var(--progress)', 'var(--progress-bg)'],
  sold: ['var(--gold-deep)', 'var(--gold-tint)'],
  lost: ['var(--flagged)', 'var(--flagged-bg)'],
  flagged: ['var(--flagged)', 'var(--flagged-bg)'],
  declined: ['var(--flagged)', 'var(--flagged-bg)'],
  high: ['var(--flagged)', 'var(--flagged-bg)'],
  new: ['var(--pending)', 'var(--pending-bg)'],
  pending: ['var(--pending)', 'var(--pending-bg)'],
  cancelled: ['var(--muted)', 'var(--line-2)'],
}

export function Pill({ label, tone }: { label: string; tone?: string }) {
  const [fg, bg] = TONES[(tone ?? label).toLowerCase()] ?? ['var(--progress)', 'var(--progress-bg)']
  return (
    <span className="erpPill" style={{ color: fg, background: bg }}>
      {label}
    </span>
  )
}

export function Field({ label, hint, full, children }: { label: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`erpField ${full ? 'full' : ''}`}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export function Chips<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T | ''; onChange: (v: T) => void }) {
  return (
    <div className="erpChips">
      {options.map((o) => (
        <button type="button" key={o} className={`erpChip ${value === o ? 'is-on' : ''}`} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  )
}

export const KIND_ICON: Record<MeetingKind, LucideIcon> = {
  'In person': Users,
  'Site visit': Navigation,
  Call: Phone,
  'Video call': Video,
  Discussion: MessagesSquare,
}

export const LINK_ICON: Record<string, LucideIcon> = {
  property: Map,
  transaction: Briefcase,
  task: SquareCheck,
  lead: User,
  meeting: Users,
  verification: CircleCheck,
  general: LinkIcon,
}

export function linkHref(type?: string | null, id?: string | null): string | null {
  if (!id) return null
  if (type === 'property') return `/admin/properties/${id}`
  if (type === 'transaction') return `/admin/deals/${id}`
  if (type === 'meeting') return `/admin/meetings/${id}`
  if (type === 'task' || type === 'note') return '/admin/notes-tasks'
  if (type === 'lead') return '/admin/deals?tab=leads'
  return null
}

export function RecordLink({ type, id, label }: { type?: string | null; id?: string | null; label?: string | null }) {
  if (!label) return null
  const Icon = LINK_ICON[type ?? 'general'] ?? LinkIcon
  const href = linkHref(type, id)
  const inner = (
    <>
      <Icon size={12} />
      <span>{label}</span>
    </>
  )
  return href ? (
    <Link href={href} className="erpLink" onClick={(e) => e.stopPropagation()}>
      {inner}
    </Link>
  ) : (
    <span className="erpLink">{inner}</span>
  )
}
