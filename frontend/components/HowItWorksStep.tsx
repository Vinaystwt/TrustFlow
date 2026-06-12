'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cx } from '@/lib/utils'

export function HowItWorksStep({
  index,
  title,
  description,
  icon,
  isLast,
}: {
  index: number
  title: string
  description: string
  icon: ReactNode
  isLast?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-80px' }}
      className="relative flex gap-5 pb-10"
    >
      {!isLast && (
        <span className="absolute left-7 top-16 h-[calc(100%-3.5rem)] w-px bg-border" />
      )}
      <div className="relative shrink-0">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl font-display text-xl font-bold text-white"
          style={{ background: 'var(--gradient-hero)' }}
        >
          {index}
        </span>
      </div>
      <div className={cx('card card-hover flex-1 p-5')}>
        <div className="flex items-center gap-2.5">
          <span className="text-brand-primary-light">{icon}</span>
          <h3 className="font-display text-lg font-bold tracking-tight text-text">
            {title}
          </h3>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>
    </motion.div>
  )
}
