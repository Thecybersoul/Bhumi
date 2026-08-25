'use client'

import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Icon from './Icon'
import type { Practice } from '@/lib/content/services'

/* The thread.

   The copy claims the two practices are "one continuous thread".
   Rather than assert that in a paragraph and lay the practices out
   as two disconnected cards, the section draws the thread: a single
   stroke that leaves the heading, passes through each practice in
   turn, and arrives at the closing step. It draws itself as you
   scroll, and each practice wakes as the stroke reaches it.

   The path is computed in JS from the measured positions of the
   cards rather than hard-coded, so it stays exact at any width and
   re-solves on resize. Nothing is faked with a stretched viewBox —
   the SVG works in real pixel space, so the stroke never distorts.

   Reduced motion gets the whole thread drawn and every practice
   awake on mount: same information, no animation. */

interface Geometry {
  w: number
  h: number
  path: string
  length: number
  nodes: { x: number; y: number }[]
}

export default function PracticeThread({ practices }: { practices: Practice[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [geo, setGeo] = useState<Geometry | null>(null)
  const [progress, setProgress] = useState(0)
  const [reduced, setReduced] = useState(false)

  /* Solve the path from where the cards actually sit. */
  const measure = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const wb = wrap.getBoundingClientRect()
    const w = wb.width
    const h = wb.height
    if (!w || !h) return

    const stacked = w < 900
    // Stacked: spine hugs the left gutter. Split: spine runs centre.
    const spine = stacked ? 26 : w / 2

    const nodes = cardRefs.current.filter(Boolean).map((el, i) => {
      const b = (el as HTMLDivElement).getBoundingClientRect()
      const y = b.top - wb.top + b.height / 2
      // Split layout alternates the cards, so the thread leans toward
      // whichever side the card is on before returning to the spine.
      const lean = stacked ? 0 : (i % 2 === 0 ? -1 : 1) * Math.min(150, w * 0.12)
      return { x: spine + lean, y }
    })

    let d = `M ${spine} 0`
    let prevY = 0
    nodes.forEach((n) => {
      const midY = (prevY + n.y) / 2
      d += ` C ${spine} ${midY}, ${n.x} ${midY}, ${n.x} ${n.y}`
      prevY = n.y
    })
    const midEnd = (prevY + h) / 2
    d += ` C ${nodes.length ? nodes[nodes.length - 1].x : spine} ${midEnd}, ${spine} ${midEnd}, ${spine} ${h}`

    // Measure the drawn length so dashoffset maps 1:1 to progress.
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    probe.setAttribute('d', d)
    const length = probe.getTotalLength ? probe.getTotalLength() : h

    setGeo({ w, h, path: d, length, nodes })
  }, [])

  useLayoutEffect(() => {
    measure()
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [measure])

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true)
      setProgress(1)
      return
    }
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const wrap = wrapRef.current
        if (!wrap) return
        const b = wrap.getBoundingClientRect()
        const vh = window.innerHeight
        // Draw across the span where the section is crossing the
        // viewport, finishing a little before it leaves so the last
        // practice is fully awake while still on screen.
        const start = vh * 0.85
        const end = -b.height + vh * 0.45
        const p = (start - b.top) / (start - end)
        setProgress(Math.max(0, Math.min(1, p)))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  /* A practice wakes once the stroke has reached its node. */
  const nodeReached = (i: number) => {
    if (reduced || !geo || !geo.nodes[i]) return true
    return progress * geo.h >= geo.nodes[i].y - 40
  }

  return (
    <div className="thread" ref={wrapRef}>
      {geo && (
        <svg
          className="thread__svg"
          width={geo.w}
          height={geo.h}
          viewBox={`0 0 ${geo.w} ${geo.h}`}
          fill="none"
          aria-hidden="true"
        >
          {/* The faint full path, so the route is legible before it draws. */}
          <path d={geo.path} className="thread__ghost" />
          <path
            d={geo.path}
            className="thread__line"
            style={{
              strokeDasharray: geo.length,
              strokeDashoffset: geo.length * (1 - progress),
            }}
          />
          {geo.nodes.map((n, i) => (
            <circle
              key={i}
              cx={n.x}
              cy={n.y}
              r={7}
              className={`thread__node ${nodeReached(i) ? 'is-lit' : ''}`}
            />
          ))}
        </svg>
      )}

      <div className="thread__rail">
        {practices.map((p, i) => (
          <div
            key={p.slug}
            ref={(el) => {
              cardRefs.current[i] = el
            }}
            className={`threadItem ${i % 2 === 0 ? 'is-left' : 'is-right'} ${
              nodeReached(i) ? 'is-awake' : ''
            }`}
          >
            <Link href={p.href} className="threadCard">
              <span className="threadCard__index">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="threadCard__name">{p.name}</h3>
              <p className="threadCard__pitch">{p.pitch}</p>

              <ul className="threadCard__services">
                {p.services.map((s, j) => (
                  <li key={s.slug} style={{ transitionDelay: `${120 + j * 80}ms` }}>
                    <Icon name={s.icon} size={17} />
                    <span>{s.name}</span>
                  </li>
                ))}
              </ul>

              <span className="threadCard__go">
                Explore {p.shortName} <Icon name="arrow" size={14} />
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
