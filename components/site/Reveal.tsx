'use client'

import { useEffect, useRef, useState } from 'react'

/* Scroll-triggered motion.

   Three rules this obeys, because they are what separate motion
   that feels considered from motion that feels like a template:

   1. Content is never hidden by a failed effect. No observer, no
      JS, reduced-motion — all three render visible immediately.
   2. Motion runs once. Elements that re-animate every time they
      re-enter the viewport read as restless on a long page.
   3. Transforms and opacity only, so every frame stays on the
      compositor and nothing triggers layout.

   `variant` picks how the element arrives. `mask` is the one worth
   knowing about: the child slides up from behind its own overflow
   edge, which is what makes a heading feel typeset rather than
   faded in. */

export type RevealVariant = 'up' | 'mask' | 'fade' | 'scale' | 'wipe'

export default function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
  variant = 'up',
  style,
}: {
  children: React.ReactNode
  delay?: number
  as?: 'div' | 'section' | 'li' | 'article' | 'span' | 'figure'
  className?: string
  variant?: RevealVariant
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`reveal reveal--${variant} ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {variant === 'mask' ? <span className="reveal__inner">{children}</span> : children}
    </Tag>
  )
}

/* Stagger — reveals direct children in sequence off a single
   observer, rather than mounting one per child. On a list of a
   dozen cards that is one observer instead of twelve. */
export function Stagger({
  children,
  step = 70,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode
  step?: number
  className?: string
  as?: 'div' | 'ul' | 'ol'
}) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') return setVisible(true)
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setVisible(true)
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.unobserve(entry.target)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`stagger ${visible ? 'is-visible' : ''} ${className}`}
      style={{ ['--stagger-step' as string]: `${step}ms` }}
    >
      {children}
    </Tag>
  )
}
