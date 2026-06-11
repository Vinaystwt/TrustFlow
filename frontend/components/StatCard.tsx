'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useCountUp } from '@/hooks/useCountUp'

export function StatCard({
  icon,
  label,
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
}: {
  icon: ReactNode
  label: string
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
}) {
  const animated = useCountUp(value)
  const display = animated.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(59,130,246,0.08)' }}
      className="card p-4"
    >
      <div className="flex items-center gap-2 text-trust-text-secondary">
        <span className="text-trust-accent">{icon}</span>
        <span className="font-body text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-display-md text-trust-text">
        {prefix}
        {display}
        {suffix && <span className="ml-1 text-base text-trust-text-secondary">{suffix}</span>}
      </p>
    </motion.div>
  )
}
