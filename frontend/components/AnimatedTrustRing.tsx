'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { tierInfo } from '@/lib/utils'

const MAX = 1000

export function AnimatedTrustRing({
  score,
  size = 200,
  stroke,
  demoMode = false,
  startFromZero = true,
  showLabel = true,
}: {
  score: number
  size?: number
  stroke?: number
  /** when true, re-animates from current value to new score on every score change */
  demoMode?: boolean
  startFromZero?: boolean
  showLabel?: boolean
}) {
  const sw = stroke ?? Math.max(8, Math.round(size * 0.07))
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })

  const tier = (() => {
    if (score < 200) return 0
    if (score < 500) return 1
    if (score < 800) return 2
    return 3
  })()
  const info = tierInfo(tier)

  const [display, setDisplay] = useState(startFromZero ? 0 : score)
  const raf = useRef<number>()
  const fromRef = useRef(startFromZero ? 0 : score)

  useEffect(() => {
    const animateTo = (target: number) => {
      if (typeof window !== 'undefined') {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduce) {
          setDisplay(target)
          fromRef.current = target
          return
        }
      }
      const from = fromRef.current
      const dur = 1500
      let start: number | undefined
      const tick = (now: number) => {
        if (start === undefined) start = now
        const t = Math.min((now - start) / dur, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        const v = from + (target - from) * eased
        setDisplay(v)
        if (t < 1) raf.current = requestAnimationFrame(tick)
        else fromRef.current = target
      }
      raf.current = requestAnimationFrame(tick)
    }

    if (demoMode) {
      animateTo(score)
    } else if (inView) {
      animateTo(score)
    }
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [score, inView, demoMode])

  const pct = Math.min(Math.max(display / MAX, 0), 1)
  const offset = circ * (1 - pct)
  const angle = pct * 2 * Math.PI - Math.PI / 2
  const dotX = size / 2 + r * Math.cos(angle)
  const dotY = size / 2 + r * Math.sin(angle)
  const gid = `ring-${size}`

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <filter id={`${gid}-glow`}>
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#242C45" strokeWidth={sw} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          filter={`url(#${gid}-glow)`}
        />
        {pct > 0.01 && (
          <circle cx={dotX} cy={dotY} r={sw * 0.55} fill="#fff" opacity={0.9} filter={`url(#${gid}-glow)`} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={Math.round(display / 5)}
          className="font-display font-extrabold tracking-tight text-text"
          style={{ fontSize: size * 0.24, fontWeight: 800 }}
        >
          {Math.round(display)}
        </motion.span>
        {showLabel && (
          <span
            className="mt-0.5 font-display font-semibold uppercase tracking-wide"
            style={{ color: info.color, fontSize: Math.max(10, size * 0.07) }}
          >
            {info.name}
          </span>
        )}
      </div>
    </div>
  )
}
