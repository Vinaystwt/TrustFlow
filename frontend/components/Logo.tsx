'use client'

import { motion } from 'framer-motion'
import { cx } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_PX: Record<Size, number> = { sm: 24, md: 32, lg: 48, xl: 64 }
const WORD_PX: Record<Size, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-3xl',
}

// Geometric shield: flat top with chamfered corners, pointed bottom.
const SHIELD_PATH =
  'M10 3 H38 L45 10 V26 L24 45 L3 26 V10 Z'

// Three ascending bars (x, y, width, height, fill)
const BARS = [
  { x: 13, y: 28, w: 22, h: 5, fill: 'rgba(99,102,241,0.5)' },
  { x: 13, y: 20, w: 22, h: 5, fill: 'rgba(99,102,241,0.78)' },
  { x: 13, y: 12, w: 22, h: 5, fill: '#818CF8' },
]

function Shield({
  px,
  animated,
  gradId,
}: {
  px: number
  animated?: boolean
  gradId: string
}) {
  return (
    <svg
      width={px}
      height={px * (48 / 48)}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <path
        d={SHIELD_PATH}
        stroke={`url(#${gradId})`}
        strokeWidth={2}
        fill="rgba(99,102,241,0.08)"
        strokeLinejoin="round"
      />
      {BARS.map((b, i) =>
        animated ? (
          <motion.rect
            key={i}
            x={b.x}
            width={b.w}
            height={b.h}
            rx={1.5}
            fill={b.fill}
            initial={{ y: 33, scaleY: 0, opacity: 0 }}
            animate={{ y: b.y, scaleY: 1, opacity: 1 }}
            transition={{
              duration: 0.35,
              delay: 0.15 + i * 0.12,
              ease: 'easeOut',
            }}
            style={{ transformOrigin: 'center bottom' }}
          />
        ) : (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={1.5}
            fill={b.fill}
          />
        )
      )}
      {/* shine */}
      <line
        x1={38}
        y1={6}
        x2={42}
        y2={10}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  )
}

let counter = 0
function nextId() {
  return `lg-${++counter}`
}

export function LogoMark({ size = 'md' }: { size?: Size }) {
  return <Shield px={SIZE_PX[size]} gradId={nextId()} />
}

export function Logo({ size = 'md' }: { size?: Size }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Shield px={SIZE_PX[size]} gradId={nextId()} />
      <span
        className={cx(
          'font-display font-bold tracking-tight text-text',
          WORD_PX[size]
        )}
      >
        TrustFlow
      </span>
    </span>
  )
}

export function LogoAnimated({
  size = 'md',
  withWordmark = false,
}: {
  size?: Size
  withWordmark?: boolean
}) {
  return (
    <motion.span
      className="group inline-flex items-center gap-2"
      whileHover="hover"
    >
      <Shield px={SIZE_PX[size]} animated gradId={nextId()} />
      {withWordmark && (
        <span
          className={cx(
            'font-display font-bold tracking-tight text-text',
            WORD_PX[size]
          )}
        >
          TrustFlow
        </span>
      )}
    </motion.span>
  )
}
