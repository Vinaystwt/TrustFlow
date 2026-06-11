'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Counts up from 0 to `target` over `duration` ms with an ease-out curve.
 * Respects prefers-reduced-motion (jumps straight to target).
 */
export function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0)
  const frame = useRef<number>()
  const start = useRef<number>()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || target === 0) {
      setValue(target)
      return
    }

    start.current = undefined
    const tick = (now: number) => {
      if (start.current === undefined) start.current = now
      const elapsed = now - start.current
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(target * eased)
      if (t < 1) frame.current = requestAnimationFrame(tick)
      else setValue(target)
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [target, duration])

  return value
}
