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
  /* How far along the stroke each node sits, 0–1. A node wakes when
     the draw passes it. Measured along the path rather than compared
     on an axis, because the stitch runs horizontally on desktop and
     vertically when stacked — an axis test would be right in one
     layout and wrong in the other. */
  nodeAt: number[]
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
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[]
    let nodes: { x: number; y: number }[] = []
    let d = ''

    if (stacked) {
      /* Stacked: a spine down the left gutter, leaning to each card. */
      const spine = 26
      nodes = cards.map((el) => {
        const b = el.getBoundingClientRect()
        return { x: spine, y: b.top - wb.top + b.height / 2 }
      })
      d = `M ${spine} 0`
      let prevY = 0
      nodes.forEach((n) => {
        const midY = (prevY + n.y) / 2
        d += ` C ${spine} ${midY}, ${n.x} ${midY}, ${n.x} ${n.y}`
        prevY = n.y
      })
      d += ` L ${spine} ${h}`
    } else {
      /* Side by side: two cards is too few to justify a tall zigzag —
         it just leaves the section sparse. Instead the thread runs
         across the top as a single stitch, dipping down to touch the
         head of each card and rising between them. It draws left to
         right, which is also the order you read the cards in. */
      nodes = cards.map((el) => {
        const b = el.getBoundingClientRect()
        return { x: b.left - wb.left + b.width / 2, y: b.top - wb.top }
      })
      const crest = Math.max(10, (nodes[0]?.y ?? 80) - 62)

      // Waypoints: in at the left crest, dip to each node, crest
      // between them, out at the right crest.
      const pts: { x: number; y: number }[] = [{ x: 0, y: crest }]
      nodes.forEach((n, i) => {
        if (i > 0) {
          const prev = nodes[i - 1]
          pts.push({ x: (prev.x + n.x) / 2, y: crest })
        }
        pts.push(n)
      })
      pts.push({ x: w, y: crest })

      // Horizontal tangents at every waypoint give a clean wave.
      d = `M ${pts[0].x} ${pts[0].y}`
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1]
        const p1 = pts[i]
        const dx = (p1.x - p0.x) * 0.5
        d += ` C ${p0.x + dx} ${p0.y}, ${p1.x - dx} ${p1.y}, ${p1.x} ${p1.y}`
      }
    }

    // Measure the drawn length so dashoffset maps 1:1 to progress.
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    probe.setAttribute('d', d)
    const length = probe.getTotalLength ? probe.getTotalLength() : h

    /* Walk the path once and record the closest point to each node. */
    const nodeAt = nodes.map(() => 0)
    if (probe.getPointAtLength && length > 0) {
      const best = nodes.map(() => ({ dist: Infinity, t: 0 }))
      const steps = 240
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const pt = probe.getPointAtLength(length * t)
        nodes.forEach((n, k) => {
          const dd = (pt.x - n.x) ** 2 + (pt.y - n.y) ** 2
          if (dd < best[k].dist) best[k] = { dist: dd, t }
        })
      }
      best.forEach((b, k) => {
        nodeAt[k] = b.t
      })
    }

    setGeo({ w, h, path: d, length, nodes, nodeAt })
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
    if (reduced || !geo || geo.nodeAt[i] === undefined) return true
    return progress >= geo.nodeAt[i] - 0.02
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
