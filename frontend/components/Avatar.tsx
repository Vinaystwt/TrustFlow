'use client'

import { useId, useMemo } from 'react'

const PALETTE = [
  ['#6366F1', '#A855F7'],
  ['#3B82F6', '#06B6D4'],
  ['#EC4899', '#A855F7'],
  ['#10B981', '#3B82F6'],
  ['#F59E0B', '#EC4899'],
  ['#06B6D4', '#6366F1'],
]

function hashAddress(addr: string): number {
  let h = 0
  for (let i = 0; i < addr.length; i++) {
    h = (h << 5) - h + addr.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function Avatar({
  address,
  size = 40,
}: {
  address?: string
  size?: number
}) {
  const { from, to, angle, dots } = useMemo(() => {
    const a = (address || '0x0').toLowerCase()
    const h = hashAddress(a)
    const [from, to] = PALETTE[h % PALETTE.length]
    const angle = h % 360
    // deterministic dot pattern (3x3 grid)
    const dots: boolean[] = []
    for (let i = 0; i < 9; i++) {
      dots.push(((h >> i) & 1) === 1)
    }
    return { from, to, angle, dots }
  }, [address])

  const cell = size / 3
  const dotR = cell * 0.18
  const gid = `av-${useId().replace(/:/g, '')}`

  return (
    <span
      className="inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-border"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gid} gradientTransform={`rotate(${angle})`}>
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <rect width={size} height={size} fill={`url(#${gid})`} />
        {dots.map((on, i) =>
          on ? (
            <circle
              key={i}
              cx={(i % 3) * cell + cell / 2}
              cy={Math.floor(i / 3) * cell + cell / 2}
              r={dotR}
              fill="rgba(255,255,255,0.35)"
            />
          ) : null
        )}
      </svg>
    </span>
  )
}
