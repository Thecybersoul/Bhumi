import Link from 'next/link'
import Icon, { type IconName } from './Icon'
import Reveal from './Reveal'
import HeroVideo from './HeroVideo'

/* The full-bleed video hero used by the three main pages.

   Two ledes are rendered and one is shown by CSS: on a phone the
   long paragraph is replaced by a single line, because the footage
   behind it is meant to be the thing you actually see. Doing this
   in CSS rather than JS keeps it correct in the server-rendered
   HTML — no flash of the wrong copy on first paint. */

export interface HeroAction {
  label: string
  href: string
  variant?: 'gold' | 'outline'
  external?: boolean
  icon?: IconName
}

export default function BigHero({
  eyebrow,
  title,
  italic,
  after,
  lede,
  mobileLede,
  actions = [],
}: {
  eyebrow: string
  title: string
  italic?: string
  after?: string
  lede: string
  mobileLede: string
  actions?: HeroAction[]
}) {
  return (
    <section className="homeHero">
      <div className="homeHero__bg" aria-hidden="true">
        <HeroVideo className="homeHero__video" />
      </div>
      <div className="homeHero__scrim" aria-hidden="true" />
      <div className="wrap">
        <Reveal>
          <span className="eyebrow eyebrow-light">{eyebrow}</span>
          <h1 className="display homeHero__title">
            {title}
            {italic && (
              <>
                {' '}
                <em>{italic}</em>
              </>
            )}
            {after}
          </h1>
          <p className="homeHero__sub is-desktop">{lede}</p>
          <p className="homeHero__sub is-mobile">{mobileLede}</p>

          {actions.length > 0 && (
            <div className="homeHero__actions">
              {actions.map((a) =>
                a.external ? (
                  <a
                    key={a.label}
                    href={a.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn btn-lg ${a.variant === 'outline' ? 'btn-outline-light' : 'btn-gold'}`}
                  >
                    {a.icon && <Icon name={a.icon} size={16} />}
                    {a.label}
                  </a>
                ) : (
                  <Link
                    key={a.label}
                    href={a.href}
                    className={`btn btn-lg ${a.variant === 'outline' ? 'btn-outline-light' : 'btn-gold'}`}
                  >
                    {a.icon && <Icon name={a.icon} size={16} />}
                    {a.label}
                    {!a.icon && <Icon name="arrow" size={15} />}
                  </Link>
                )
              )}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  )
}
