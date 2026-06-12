'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

export function CountUp({
  to,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = true,
  className,
}: {
  to: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  separator?: boolean
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [value, setValue] = useState(0)
  const raf = useRef<number>()
  const start = useRef<number>()

  useEffect(() => {
    if (!inView) return
    if (typeof window !== 'undefined') {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce || to === 0) {
        setValue(to)
        return
      }
    }
    start.current = undefined
    const tick = (now: number) => {
      if (start.current === undefined) start.current = now
      const t = Math.min((now - start.current) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(to * eased)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else setValue(to)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [inView, to, duration])

  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: separator,
  })

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
