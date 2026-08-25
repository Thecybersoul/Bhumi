'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'

/* Horizontal scroller that drifts on its own.

   Native scrolling with snap points does the work — the arrows are
   an affordance on top of it, not the mechanism. That way it stays
   swipeable on touch, keyboard-scrollable, and readable to a screen
   reader as a plain list, while a mouse user still gets buttons.

   Auto-scroll rules, because an unattended marquee is easy to get
   wrong and very annoying when you do:

   - It yields to the person. Hover, focus, touch or a deliberate
     scroll all stop it, and it only resumes after they have been
     idle for a moment.
   - It stops entirely when off-screen, so a rail three sections
     down is not burning frames.
   - Reduced motion switches it off and leaves a plain scroller.
   - The loop is seamless: the set is rendered twice and the scroll
     position wraps by exactly one set width, so there is no jump
     back to the start. The clone is inert and hidden from
     assistive tech, so nothing is announced or focused twice. */

const SPEED = 22 // px per second — a drift, not a slide

export default function Carousel({
  children,
  label,
  autoScroll = true,
}: {
  children: React.ReactNode
  label: string
  autoScroll?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const setRef = useRef<HTMLDivElement>(null)
  const cloneRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [scrollable, setScrollable] = useState(false)
  const [looping, setLooping] = useState(false)

  /* Everything the rAF loop needs, kept in refs so changing it
     never re-renders or restarts the loop. */
  const paused = useRef(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onScreen = useRef(false)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setScrollable(max > 8)
    if (!looping) {
      setAtStart(el.scrollLeft <= 8)
      setAtEnd(el.scrollLeft >= max - 8)
    }
  }, [looping])

  /* Only loop if there is genuinely more content than fits;
     duplicating a rail that already fits would just add whitespace. */
  useEffect(() => {
    const el = ref.current
    const set = setRef.current
    if (!el || !set || !autoScroll) return
    const decide = () => {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setLooping(false)
      setLooping(set.scrollWidth > el.clientWidth + 8)
    }
    decide()
    const ro = new ResizeObserver(decide)
    ro.observe(el)
    ro.observe(set)
    return () => ro.disconnect()
  }, [autoScroll])

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

  /* Pause while the rail is off-screen. */
  useEffect(() => {
    const el = ref.current
    if (!el || !looping) return
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen.current = e.isIntersecting
      },
      { threshold: 0.05 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [looping])

  /* The drift itself. */
  useEffect(() => {
    const el = ref.current
    const set = setRef.current
    if (!el || !set || !looping) return

    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(now - last, 64) / 1000 // clamp after a tab switch
      last = now
      if (!paused.current && onScreen.current) {
        /* The loop period is the distance between the start of the
           set and the start of its clone — set width plus the flex
           gap. Wrapping by the set width alone leaves a gap-sized
           stutter on every pass. Measured rather than assumed, so a
           change to the gap in CSS cannot desynchronise it. */
        const clone = cloneRef.current
        const span = clone ? clone.offsetLeft - set.offsetLeft : set.scrollWidth
        if (span > 0) {
          let next = el.scrollLeft + SPEED * dt
          if (next >= span) next -= span
          el.scrollLeft = next
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [looping])

  const hold = () => {
    paused.current = true
    if (idleTimer.current) clearTimeout(idleTimer.current)
  }
  const release = (after = 0) => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      paused.current = false
    }, after)
  }
  /* A deliberate scroll or drag holds it longer than a passing cursor. */
  const nudge = () => {
    paused.current = true
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      paused.current = false
    }, 2600)
  }

  useEffect(() => () => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
  }, [])

  /* The duplicated set must not be reachable by tab or announced —
     otherwise every card exists twice for a keyboard or screen
     reader user. Set on the node because React does not reliably
     pass `inert` through as an attribute. */
  useEffect(() => {
    if (cloneRef.current) cloneRef.current.inert = true
  }, [looping])

  const page = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    const first = el.querySelector('.carousel__set > *') as HTMLElement | null
    const step = first ? first.getBoundingClientRect().width + 18 : el.clientWidth * 0.8
    el.scrollBy({ left: step * dir, behavior: 'smooth' })
    nudge()
  }

  return (
    <div className="carousel">
      <div
        className={`carousel__track ${looping ? 'is-looping' : ''}`}
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        onMouseEnter={hold}
        onMouseLeave={() => release(200)}
        onFocusCapture={hold}
        onBlurCapture={() => release(600)}
        onPointerDown={hold}
        onPointerUp={nudge}
        onWheel={nudge}
        onKeyDown={nudge}
        onTouchStart={hold}
        onTouchEnd={nudge}
      >
        <div className="carousel__set" ref={setRef}>
          {children}
        </div>
        {looping && (
          <div className="carousel__set" aria-hidden="true" ref={cloneRef}>
            {children}
          </div>
        )}
      </div>

      {scrollable && (
        <div className="carousel__nav">
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={!looping && atStart}
            aria-label="Scroll left"
          >
            <Icon name="arrow" size={16} />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={!looping && atEnd}
            aria-label="Scroll right"
          >
            <Icon name="arrow" size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
