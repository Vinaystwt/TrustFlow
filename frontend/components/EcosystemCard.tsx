'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

export function EcosystemCard({
  icon,
  name,
  description,
  accent,
}: {
  icon: ReactNode
  name: string
  description: string
  accent: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-60px' }}
      whileHover={{ y: -4 }}
      className="group card relative overflow-hidden p-6"
      style={{ borderColor: 'var(--border)' }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-60 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: accent }}
      />
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
        style={{ backgroundColor: `${accent}1F`, color: accent }}
      >
        {icon}
      </span>
      <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-text">
        {name}
      </h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-text-secondary">
        {description}
      </p>
    </motion.div>
  )
}
