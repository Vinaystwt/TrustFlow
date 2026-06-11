'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { tierInfo } from '@/lib/utils'
import { useCountUp } from '@/hooks/useCountUp'

const SIZES = {
  sm: { px: 80, stroke: 7, score: 'text-xl', label: 'text-[9px]' },
  md: { px: 120, stroke: 9, score: 'text-3xl', label: 'text-[10px]' },
  lg: { px: 200, stroke: 14, score: 'text-5xl', label: 'text-sm' },
}

const MAX_SCORE = 1000

export function TrustScoreRing({
  score,
  tier,
  size = 'lg',
}: {
  score: number
  tier: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const dims = SIZES[size]
  const radius = (dims.px - dims.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(Math.max(score / MAX_SCORE, 0), 1)
  const targetOffset = circumference * (1 - pct)

  const info = tierInfo(tier)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [animate, setAnimate] = useState(false)
  const countedScore = useCountUp(animate ? score : 0, 1500)

  useEffect(() => {
    if (inView) setAnimate(true)
  }, [inView])

  const gradId = `ring-grad-${size}`

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center justify-center"
      style={{ width: dims.px, height: dims.px }}
    >
      <svg
        width={dims.px}
        height={dims.px}
        viewBox={`0 0 ${dims.px} ${dims.px}`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <circle
          cx={dims.px / 2}
          cy={dims.px / 2}
          r={radius}
          fill="none"
          stroke="#1E3050"
          strokeWidth={dims.stroke}
        />
        <motion.circle
          cx={dims.px / 2}
          cy={dims.px / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={dims.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: animate ? targetOffset : circumference }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-display font-bold tracking-display-lg text-trust-text ${dims.score}`}
          style={{ fontWeight: 800 }}
        >
          {Math.round(countedScore)}
        </span>
        {size !== 'sm' && (
          <span
            className={`mt-0.5 font-display font-semibold uppercase tracking-wide ${dims.label}`}
            style={{ color: info.color }}
          >
            {info.name}
          </span>
        )}
      </div>
    </div>
  )
}
