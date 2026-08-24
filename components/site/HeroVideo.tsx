'use client'

import { useEffect, useRef } from 'react'

/* Shared aerial footage used behind every hero — the corridors we
   source, the land we grade, the identity we build on top of it.
   A slightly slowed playback rate reads as deliberate rather than
   drone-footage-raw. Hidden on small screens and reduced-motion to
   keep the poster frame (already painted behind it) as the fallback. */

export default function HeroVideo({ className }: { className: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = 0.65
  }, [])

  return (
    <video
      ref={ref}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster="/img/hero-poster.jpg"
      aria-hidden="true"
    >
      <source src="/video/hero.mp4" type="video/mp4" />
    </video>
  )
}
