'use client'

import { motion } from 'framer-motion'
import { Section, Eyebrow, SectionTitle, SectionSub } from '@/components/Section'
import { InteractiveTrustDemo } from '@/components/InteractiveTrustDemo'

export function TrustSystemDemo() {
  return (
    <Section bg="three">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true, margin: '-100px' }}
        className="text-center"
      >
        <Eyebrow>Trust Score System</Eyebrow>
        <SectionTitle>Watch your reputation grow.</SectionTitle>
        <div className="mx-auto mt-4 max-w-xl">
          <SectionSub>
            Real on-chain reputation, calculated from real payment activity.
          </SectionSub>
        </div>
      </motion.div>

      <div className="mt-12">
        <InteractiveTrustDemo />
      </div>
    </Section>
  )
}
