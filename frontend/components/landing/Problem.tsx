'use client'

import { motion } from 'framer-motion'
import { Section, Eyebrow, SectionTitle } from '@/components/Section'
import { ComparisonCard } from '@/components/ComparisonCard'

export function Problem() {
  return (
    <Section bg="two">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true, margin: '-100px' }}
        className="max-w-2xl"
      >
        <Eyebrow>The Problem</Eyebrow>
        <SectionTitle>Web3 payments are broken.</SectionTitle>
      </motion.div>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <ComparisonCard
          variant="bad"
          title="Today's Web3 Payments"
          items={[
            'Every payment treated as your first',
            'No way to prove reliability',
            '150%+ overcollateralization required',
            '1.4 billion unbanked excluded from credit',
          ]}
        />
        <ComparisonCard
          variant="good"
          title="Payments on TrustFlow"
          items={[
            'Every payment builds verifiable history',
            'Reputation tied to QIE Pass identity',
            'Progressive trust unlocks lower escrow',
            'Anyone with QIE Pass can build credit',
          ]}
        />
      </div>

      <p className="mt-8 text-sm text-text-dim">
        TrustFlow uses QIE Pass identity to solve the cold-start problem in DeFi
        credit.
      </p>
    </Section>
  )
}
