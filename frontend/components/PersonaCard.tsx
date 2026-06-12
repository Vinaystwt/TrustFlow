'use client'

import { motion } from 'framer-motion'
import { Avatar } from './Avatar'

export function PersonaCard({
  seed,
  name,
  role,
  quote,
  useCase,
}: {
  seed: string
  name: string
  role: string
  quote: string
  useCase: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-60px' }}
      className="card flex h-full flex-col p-6"
    >
      <div className="flex items-center gap-3">
        <Avatar address={seed} size={48} />
        <div>
          <p className="font-display text-base font-bold tracking-tight text-text">
            {name}
          </p>
          <p className="text-sm text-text-secondary">{role}</p>
        </div>
      </div>
      <blockquote className="mt-5 flex-1 border-l-2 border-brand-primary/40 pl-4 text-[15px] leading-relaxed text-text">
        “{quote}”
      </blockquote>
      <p className="mt-5 text-xs uppercase tracking-wide text-text-dim">
        {useCase}
      </p>
    </motion.div>
  )
}
