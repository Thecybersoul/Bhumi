'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'

/* Horizontal scroller.

   Native scrolling with snap points does the work — the arrows are
   an affordance on top of it, not the mechanism. That way it stays
   swipeable on touch, keyboard-scrollable, and readable to a screen
   reader as a plain list, while a mouse user still gets buttons.
   The arrows hide themselves when there is nothing to scroll to. */

export default function Carousel({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [scrollable, setScrollable] = useState(false)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setScrollable(max > 8)
    setAtStart(el.scrollLeft <= 8)
    setAtEnd(el.scrollLeft >= max - 8)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      ro.disconnect()
    }
  }, [measure])

  /* Page by roughly one card, derived from the first child so the
     step stays right across breakpoints. */
  const page = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    const first = el.firstElementChild as HTMLElement | null
    const step = first ? first.getBoundingClientRect().width + 18 : el.clientWidth * 0.8
    el.scrollBy({ left: step * dir, behavior: 'smooth' })
  }

  return (
    <div className="carousel">
      <div
        className="carousel__track"
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        {children}
      </div>

      {scrollable && (
        <div className="carousel__nav">
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={atStart}
            aria-label="Scroll left"
          >
            <Icon name="arrow" size={16} />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={atEnd}
            aria-label="Scroll right"
          >
            <Icon name="arrow" size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
