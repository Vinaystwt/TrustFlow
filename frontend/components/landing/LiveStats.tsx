'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useReadContract, useReadContracts } from 'wagmi'
import { FileText, Banknote, Gauge, Users } from 'lucide-react'
import { Section, Eyebrow, SectionTitle, SectionSub } from '@/components/Section'
import { CountUp } from '@/components/CountUp'
import { TRUSTFLOW_ABI, TRUSTFLOW_ADDRESS } from '@/lib/contracts'
import { qusdcToNumber, type Agreement, type TrustProfile } from '@/lib/utils'

export function LiveStats() {
  const { data: counterRaw } = useReadContract({
    abi: TRUSTFLOW_ABI,
    address: TRUSTFLOW_ADDRESS,
    functionName: 'agreementCounter',
  })
  const counter = counterRaw ? Number(counterRaw as bigint) : 0

  const agreementContracts = useMemo(
    () =>
      Array.from({ length: counter }, (_, i) => ({
        abi: TRUSTFLOW_ABI,
        address: TRUSTFLOW_ADDRESS,
        functionName: 'getAgreement',
        args: [BigInt(i + 1)],
      })),
    [counter]
  )

  const { data: agRaw } = useReadContracts({
    contracts: agreementContracts as never,
    query: { enabled: counter > 0 },
  })
  const agreements = ((agRaw as { result?: unknown }[] | undefined) ?? [])
    .map((r) => r.result as Agreement | undefined)
    .filter((a): a is Agreement => !!a)

  const users = useMemo(() => {
    const set = new Set<string>()
    agreements.forEach((a) => {
      set.add(a.creator.toLowerCase())
      set.add(a.client.toLowerCase())
    })
    return Array.from(set)
  }, [agreements])

  const profileContracts = useMemo(
    () =>
      users.map((u) => ({
        abi: TRUSTFLOW_ABI,
        address: TRUSTFLOW_ADDRESS,
        functionName: 'getTrustProfile',
        args: [u as `0x${string}`],
      })),
    [users]
  )
  const { data: profRaw } = useReadContracts({
    contracts: profileContracts as never,
    query: { enabled: users.length > 0 },
  })
  const profiles = ((profRaw as { result?: unknown }[] | undefined) ?? [])
    .map((r) => r.result as TrustProfile | undefined)
    .filter((p): p is TrustProfile => !!p)

  const totalVolume = agreements.reduce((s, a) => s + qusdcToNumber(a.paidAmount), 0)
  const scores = profiles.map((p) => Number(p.trustScore))
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const tier2plus = profiles.filter((p) => Number(p.trustScore) >= 500).length

  const hasData = counter > 0

  const STATS = [
    { icon: <FileText size={16} />, label: 'Total Agreements', value: counter, suffix: '' },
    { icon: <Banknote size={16} />, label: 'Total Volume', value: hasData ? totalVolume : 0, suffix: 'QUSDC', decimals: 2 },
    { icon: <Gauge size={16} />, label: 'Average Trust Score', value: avgScore, suffix: '' },
    { icon: <Users size={16} />, label: 'Active Tier 2+ Users', value: tier2plus, suffix: '' },
  ]

  return (
    <Section bg="one">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true, margin: '-100px' }}
        className="text-center"
      >
        <Eyebrow>Live Protocol Stats</Eyebrow>
        <SectionTitle>Live on QIE Testnet.</SectionTitle>
        <div className="mx-auto mt-4 max-w-xl">
          <SectionSub>Real on-chain data from the deployed protocol.</SectionSub>
        </div>
      </motion.div>

      <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="card p-6 text-center">
            <span className="inline-flex items-center gap-1.5 text-text-secondary">
              <span className="text-brand-primary-light">{s.icon}</span>
              <span className="text-xs font-medium uppercase tracking-wide">{s.label}</span>
            </span>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight gradient-text sm:text-4xl">
              <CountUp to={s.value} decimals={s.decimals ?? 0} />
            </p>
            {s.suffix && <p className="mt-1 text-xs text-text-dim">{s.suffix}</p>}
          </div>
        ))}
      </div>

      {!hasData && (
        <p className="mt-6 text-center text-sm text-text-dim">
          Stats update in real-time as the protocol grows.
        </p>
      )}
    </Section>
  )
}
