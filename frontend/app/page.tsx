import { Hero } from '@/components/landing/Hero'
import { Problem } from '@/components/landing/Problem'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { TrustSystemDemo } from '@/components/landing/TrustSystemDemo'
import { EcosystemGrid } from '@/components/landing/EcosystemGrid'
import { LiveStats } from '@/components/landing/LiveStats'
import { Personas } from '@/components/landing/Personas'
import { CTASection } from '@/components/landing/CTASection'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Problem />
      <HowItWorks />
      <TrustSystemDemo />
      <EcosystemGrid />
      <LiveStats />
      <Personas />
      <CTASection />
    </>
  )
}
