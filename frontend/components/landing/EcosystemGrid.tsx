'use client'

import { motion } from 'framer-motion'
import { Wallet, Coins, BadgeCheck, Globe, ArrowLeftRight } from 'lucide-react'
import { Section, Eyebrow, SectionTitle, SectionSub } from '@/components/Section'
import { EcosystemCard } from '@/components/EcosystemCard'

const CARDS = [
  { icon: <Wallet size={22} />, name: 'QIE Wallet', description: 'Auth, signing, transactions.', accent: '#3B82F6' },
  { icon: <Coins size={22} />, name: 'QUSDC Stablecoin', description: "All payments settled in QIE's native stable.", accent: '#06B6D4' },
  { icon: <BadgeCheck size={22} />, name: 'QIE Pass', description: 'Identity verification gives +200 trust score.', accent: '#A855F7' },
  { icon: <Globe size={22} />, name: 'QIE Domains', description: 'Pay to priya.qie instead of hex addresses.', accent: '#EC4899' },
  { icon: <ArrowLeftRight size={22} />, name: 'QIEDEX', description: 'Live price quotes from QIEDEX router on mainnet.', accent: '#F59E0B' },
]

export function EcosystemGrid() {
  return (
    <Section>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true, margin: '-100px' }}
        className="max-w-2xl"
      >
        <Eyebrow>QIE Ecosystem</Eyebrow>
        <SectionTitle>Deeply integrated with QIE.</SectionTitle>
        <SectionSub>
          TrustFlow uses all 5 core QIE components to build something none of
          them can do alone.
        </SectionSub>
      </motion.div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <EcosystemCard key={c.name} {...c} />
        ))}
      </div>

      <p className="mt-8 text-sm text-text-dim">
        TrustFlow is the only QIE protocol integrating all 5 components.
      </p>
    </Section>
  )
}
