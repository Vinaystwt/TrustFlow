'use client'

import { motion } from 'framer-motion'
import { Section, Eyebrow, SectionTitle } from '@/components/Section'
import { PersonaCard } from '@/components/PersonaCard'

const PERSONAS = [
  {
    seed: '0xPriyaFreelancerDesigner1111111111111111',
    name: 'Priya, the Freelancer',
    role: 'Indian designer working with international clients',
    quote:
      "I used to wait weeks for wire transfers. Now I get paid the moment I deliver, and I'm building a credit history I own.",
    useCase: 'Milestone payments with global clients',
  },
  {
    seed: '0xAgencyDevShopTwelveProjects222222222222',
    name: 'The Agency',
    role: 'Small dev shop managing 12 active client projects',
    quote:
      'We needed verifiable payment history without giving up our ledger to a centralized platform.',
    useCase: 'Managing multiple ongoing agreements with reputation',
  },
  {
    seed: '0xMarketplaceTrustScoreMatching3333333333',
    name: 'The Marketplace',
    role: 'Freelance marketplace integrating trust scores',
    quote:
      "We pulled TrustFlow's on-chain scores directly into our matching algorithm.",
    useCase: 'Composable reputation across platforms',
  },
]

export function Personas() {
  return (
    <Section>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true, margin: '-100px' }}
        className="max-w-2xl"
      >
        <Eyebrow>Built for Real Users</Eyebrow>
        <SectionTitle>Designed for three real workflows.</SectionTitle>
      </motion.div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {PERSONAS.map((p) => (
          <PersonaCard key={p.name} {...p} />
        ))}
      </div>
    </Section>
  )
}
