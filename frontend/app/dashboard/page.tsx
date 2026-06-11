'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAccount, useReadContracts } from 'wagmi'
import { motion } from 'framer-motion'
import { Wallet, Activity, CheckCircle2, Gauge, Plus, Inbox } from 'lucide-react'
import { PageWrapper } from '@/components/PageWrapper'
import { TrustScoreRing } from '@/components/TrustScoreRing'
import { TierBadge } from '@/components/TierBadge'
import { StatCard } from '@/components/StatCard'
import { AgreementCard } from '@/components/AgreementCard'
import { SkeletonCard, SkeletonRing, SkeletonStat } from '@/components/Skeleton'
import {
  useGetTrustProfile,
  useGetUserAgreements,
} from '@/hooks/useTrustFlow'
import { TRUSTFLOW_ABI, TRUSTFLOW_ADDRESS } from '@/lib/contracts'
import {
  qusdcToNumber,
  nextTierAt,
  tierInfo,
  type Agreement,
  type Milestone,
} from '@/lib/utils'

const container = { animate: { transition: { staggerChildren: 0.08 } } }

export default function DashboardPage() {
  const router = useRouter()
  const { address, isConnected, status } = useAccount()

  useEffect(() => {
    if (status !== 'reconnecting' && status !== 'connecting' && !isConnected) {
      router.replace('/')
    }
  }, [isConnected, status, router])

  const { profile, isLoading: profileLoading } = useGetTrustProfile(address)
  const { ids, isLoading: idsLoading } = useGetUserAgreements(address)

  const agreementContracts = useMemo(
    () =>
      (ids ?? []).map((id) => ({
        abi: TRUSTFLOW_ABI,
        address: TRUSTFLOW_ADDRESS,
        functionName: 'getAgreement',
        args: [id],
      })),
    [ids]
  )

  const milestoneContracts = useMemo(
    () =>
      (ids ?? []).map((id) => ({
        abi: TRUSTFLOW_ABI,
        address: TRUSTFLOW_ADDRESS,
        functionName: 'getMilestones',
        args: [id],
      })),
    [ids]
  )

  const { data: agreementDataRaw, isLoading: agLoading } = useReadContracts({
    contracts: agreementContracts as never,
    query: { enabled: agreementContracts.length > 0 },
  })

  const { data: milestoneDataRaw } = useReadContracts({
    contracts: milestoneContracts as never,
    query: { enabled: milestoneContracts.length > 0 },
  })

  const agreementData = agreementDataRaw as
    | { result?: unknown }[]
    | undefined
  const milestoneData = milestoneDataRaw as
    | { result?: unknown }[]
    | undefined

  const rows = useMemo(() => {
    if (!agreementData) return []
    return agreementData
      .map((r, i) => {
        const agreement = r.result as Agreement | undefined
        const ms = (milestoneData?.[i]?.result as Milestone[] | undefined) ?? []
        const approved = ms.filter((m) => m.status === 3).length
        return agreement ? { agreement, approved } : null
      })
      .filter((x): x is { agreement: Agreement; approved: number } => !!x)
      // newest first
      .sort((a, b) => Number(b.agreement.id) - Number(a.agreement.id))
  }, [agreementData, milestoneData])

  const score = Number(profile?.trustScore ?? 0n)
  const tier = profile?.tier ?? 0
  const next = nextTierAt(score)

  const totalEarned = useMemo(
    () =>
      rows
        .filter(
          (r) => r.agreement.creator.toLowerCase() === address?.toLowerCase()
        )
        .reduce((sum, r) => sum + qusdcToNumber(r.agreement.paidAmount), 0),
    [rows, address]
  )
  const activeCount = rows.filter((r) => r.agreement.status === 1).length
  const completedCount = Number(profile?.completedAgreements ?? 0n)

  const listLoading = idsLoading || agLoading

  return (
    <PageWrapper>
      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        {/* Left column */}
        <div className="space-y-6">
          <div className="card flex flex-col items-center p-8">
            {profileLoading ? (
              <SkeletonRing />
            ) : (
              <>
                <TrustScoreRing score={score} tier={tier} size="lg" />
                <div className="mt-5">
                  <TierBadge tier={tier} />
                </div>
                <p className="mt-3 text-sm text-trust-text-secondary">
                  {next
                    ? `Next tier at ${next} · ${next - score} points to go`
                    : 'Top tier reached — Elite'}
                </p>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-trust-base">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((score / 1000) * 100, 100)}%`,
                      backgroundColor: tierInfo(tier).color,
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {profileLoading ? (
              <>
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
              </>
            ) : (
              <>
                <StatCard
                  icon={<Wallet size={15} />}
                  label="Total Earned"
                  value={totalEarned}
                  decimals={2}
                  suffix="QUSDC"
                />
                <StatCard
                  icon={<Activity size={15} />}
                  label="Active"
                  value={activeCount}
                />
                <StatCard
                  icon={<CheckCircle2 size={15} />}
                  label="Completed"
                  value={completedCount}
                />
                <StatCard
                  icon={<Gauge size={15} />}
                  label="Trust Score"
                  value={score}
                />
              </>
            )}
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-display-md text-trust-text">
              Active Agreements
            </h2>
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 rounded-xl bg-trust-accent px-4 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-trust-accent-hover"
            >
              <Plus size={16} /> Create New
            </Link>
          </div>

          {listLoading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : rows.length === 0 ? (
            <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-trust-base text-trust-text-dim">
                <Inbox size={22} />
              </span>
              <p className="mt-4 font-display text-base font-semibold text-trust-text">
                No agreements yet
              </p>
              <p className="mt-1 text-sm text-trust-text-secondary">
                Create your first one to start building trust.
              </p>
              <Link
                href="/create"
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-trust-accent px-4 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-trust-accent-hover"
              >
                <Plus size={16} /> Create Agreement
              </Link>
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="initial"
              animate="animate"
              className="space-y-4"
            >
              {rows.map((r) => (
                <AgreementCard
                  key={String(r.agreement.id)}
                  agreement={r.agreement}
                  currentAddress={address}
                  approvedCount={r.approved}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
