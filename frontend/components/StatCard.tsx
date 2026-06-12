'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { CountUp } from './CountUp'
import { cx } from '@/lib/utils'

export function StatCard({
  icon,
  label,
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  delta,
  gradient = false,
}: {
  icon?: ReactNode
  label: string
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  delta?: number
  gradient?: boolean
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="card card-hover p-5 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-text-secondary">
          {icon && <span className="text-brand-primary-light">{icon}</span>}
          <span className="font-body text-xs font-medium uppercase tracking-wide">
            {label}
          </span>
        </span>
        {delta !== undefined && delta !== 0 && (
          <span
            className={cx(
              'inline-flex items-center gap-0.5 text-xs font-semibold',
              delta > 0 ? 'text-success' : 'text-danger'
            )}
          >
            {delta > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(delta)}
          </span>
        )}
      </div>
      <p
        className={cx(
          'mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl',
          gradient ? 'gradient-text' : 'text-text'
        )}
      >
        <CountUp to={value} decimals={decimals} prefix={prefix} />
        {suffix && (
          <span className="ml-1 text-base font-semibold text-text-secondary">
            {suffix}
          </span>
        )}
      </p>
    </motion.div>
  )
}
