import Link from 'next/link'
import Icon, { type IconName } from './Icon'
import Reveal from './Reveal'

/* Shared inner-page hero. Generous whitespace and a confident
   type hierarchy rather than a decorated banner (Plan §11). */

export interface Crumb {
  label: string
  href?: string
}

export default function PageHero({
  eyebrow,
  title,
  italic,
  after,
  lede,
  crumbs = [],
  stats,
  actions,
  tone = 'navy',
  children,
}: {
  eyebrow: string
  title: string
  italic?: string
  after?: string
  lede?: string
  crumbs?: Crumb[]
  stats?: { value: string; label: string }[]
  actions?: { label: string; href: string; variant?: 'gold' | 'outline'; external?: boolean; icon?: IconName }[]
  tone?: 'navy' | 'cream'
  children?: React.ReactNode
}) {
  const isNavy = tone === 'navy'

  return (
    <section className={`pageHero ${isNavy ? 'on-navy' : 'is-cream'}`}>
      <div className="pageHero__grain" aria-hidden="true" />
      <div className="wrap">
        {crumbs.length > 0 && (
          <nav className="pageHero__crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            {crumbs.map((c) => (
              <span key={c.label}>
                <span aria-hidden="true">/</span>
                {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
              </span>
            ))}
          </nav>
        )}

        <Reveal>
          <span className={`eyebrow ${isNavy ? 'eyebrow-light' : ''}`}>{eyebrow}</span>
          <h1 className="display pageHero__title">
            {title}
            {italic && (
              <>
                {' '}
                <em>{italic}</em>
              </>
            )}
            {after}
          </h1>
          {lede && <p className="lede pageHero__lede">{lede}</p>}
        </Reveal>

        {actions && actions.length > 0 && (
          <Reveal delay={80}>
            <div className="pageHero__actions">
              {actions.map((a) =>
                a.external ? (
                  <a
                    key={a.label}
                    href={a.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn btn-lg ${a.variant === 'outline' ? (isNavy ? 'btn-outline-light' : 'btn-outline') : 'btn-gold'}`}
                  >
                    {a.icon && <Icon name={a.icon} size={17} />}
                    {a.label}
                  </a>
                ) : (
                  <Link
                    key={a.label}
                    href={a.href}
                    className={`btn btn-lg ${a.variant === 'outline' ? (isNavy ? 'btn-outline-light' : 'btn-outline') : 'btn-gold'}`}
                  >
                    {a.icon && <Icon name={a.icon} size={17} />}
                    {a.label}
                  </Link>
                )
              )}
            </div>
          </Reveal>
        )}

        {stats && stats.length > 0 && (
          <Reveal delay={140}>
            <div className="pageHero__stats">
              {stats.map((s) => (
                <div key={s.label}>
                  <span className="numeral">{s.value}</span>
                  <small>{s.label}</small>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {children}
      </div>
    </section>
  )
}
