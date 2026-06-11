'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cx } from '@/lib/utils'

export function PageWrapper({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cx('mx-auto w-full max-w-7xl px-4 py-8 sm:px-6', className)}
    >
      {children}
    </motion.div>
  )
}
