'use client'

import { useMemo } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { FileText, Banknote, Users, Sigma, Activity } from 'lucide-react'
import { PageWrapper } from '@/components/PageWrapper'
import { StatCard } from '@/components/StatCard'
import { ActivityFeed } from '@/components/ActivityFeed'
import { Skeleton } from '@/components/Skeleton'
import { useProtocolEvents, uniqueUsers } from '@/hooks/useEvents'
import { TRUSTFLOW_ABI, TRUSTFLOW_ADDRESS } from '@/lib/contracts'
import { qusdcToNumber, TIERS, type Agreement, type TrustProfile } from '@/lib/utils'

export default function AnalyticsPage() {
  const { events, isLoading: eventsLoading } = useProtocolEvents(30_000)

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

  const users = useMemo(() => uniqueUsers(events), [events])
  const profileContracts = useMemo(
    () =>
      users.map((u) => ({
        abi: TRUSTFLOW_ABI,
        address: TRUSTFLOW_ADDRESS,
        functionName: 'getTrustProfile',
        args: [u],
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
  const totalScore = profiles.reduce((s, p) => s + Number(p.trustScore), 0)
  const activeUsers = profiles.filter((p) => Number(p.trustScore) > 0).length

  const tierCounts = [0, 0, 0, 0]
  profiles.forEach((p) => {
    if (Number(p.trustScore) > 0) tierCounts[Math.min(p.tier, 3)]++
  })
  const tierTotal = tierCounts.reduce((a, b) => a + b, 0) || 1

  return (
    <PageWrapper className="max-w-5xl">
      <h1 className="font-display text-3xl font-bold tracking-tight text-text">
        Protocol Analytics
      </h1>
      <p className="mt-1 text-text-secondary">Live data from TrustFlow on QIE Testnet</p>

      {/* Hero stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<FileText size={15} />} label="Agreements" value={counter} gradient />
        <StatCard icon={<Banknote size={15} />} label="Volume Settled" value={totalVolume} decimals={2} suffix="QUSDC" gradient />
        <StatCard icon={<Users size={15} />} label="Active Users" value={activeUsers} gradient />
        <StatCard icon={<Sigma size={15} />} label="Total Trust Score" value={totalScore} gradient />
      </div>

      {/* Tier distribution */}
      <div className="card mt-8 p-6">
        <h2 className="font-display text-lg font-bold tracking-tight text-text">
          Tier Distribution
        </h2>
        <div className="mt-5 space-y-4">
          {TIERS.map((t) => {
            const pct = Math.round((tierCounts[t.id] / tierTotal) * 100)
            return (
              <div key={t.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-display font-semibold" style={{ color: t.color }}>
                    {t.name}
                  </span>
                  <span className="font-mono text-text-secondary">
                    {tierCounts[t.id]} · {pct}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-subtle">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: t.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Activity feed */}
      <div className="card mt-8 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-text">
          <Activity size={18} className="text-brand-primary-light" /> Recent Activity
        </h2>
        <p className="mb-4 text-xs text-text-dim">Refreshes every 30 seconds</p>
        {eventsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ActivityFeed events={events} limit={20} emptyText="No protocol activity yet." />
        )}
      </div>
    </PageWrapper>
  )
}
