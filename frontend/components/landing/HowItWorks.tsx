'use client'

import {
  Wallet,
  FilePlus2,
  CircleDollarSign,
  Upload,
  Banknote,
  TrendingUp,
} from 'lucide-react'
import { Section, Eyebrow, SectionTitle, SectionSub } from '@/components/Section'
import { HowItWorksStep } from '@/components/HowItWorksStep'

const STEPS = [
  { icon: <Wallet size={18} />, title: 'Connect QIE Wallet', description: 'Sign in with your wallet, optionally verify with QIE Pass for a +200 trust bonus.' },
  { icon: <FilePlus2 size={18} />, title: 'Create Agreement', description: 'Define milestones in QUSDC, share the funding link with your client.' },
  { icon: <CircleDollarSign size={18} />, title: 'Client Funds Escrow', description: "Client deposits the full amount into TrustFlow's smart contract." },
  { icon: <Upload size={18} />, title: 'Deliver Work', description: 'Mark milestones complete and upload proof of delivery.' },
  { icon: <Banknote size={18} />, title: 'Receive Payment', description: 'Client approves, payment releases instantly to your wallet.' },
  { icon: <TrendingUp size={18} />, title: 'Trust Score Grows', description: 'Both parties gain reputation. Higher scores unlock instant settlement and advances.' },
]

export function HowItWorks() {
  return (
    <Section id="how-it-works" inner="max-w-3xl">
      <div className="text-center">
        <Eyebrow>How It Works</Eyebrow>
        <SectionTitle>Six steps to building credit on-chain.</SectionTitle>
        <div className="mx-auto mt-4 max-w-xl">
          <SectionSub>
            Every milestone payment adds to your trust score. Watch it grow.
          </SectionSub>
        </div>
      </div>

      <div className="mt-14">
        {STEPS.map((s, i) => (
          <HowItWorksStep
            key={i}
            index={i + 1}
            title={s.title}
            description={s.description}
            icon={s.icon}
            isLast={i === STEPS.length - 1}
          />
        ))}
      </div>
    </Section>
  )
}
