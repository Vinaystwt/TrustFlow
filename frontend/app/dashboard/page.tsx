'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAccount, useReadContracts } from 'wagmi'
import { motion } from 'framer-motion'
import {
  Wallet,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Inbox,
  BadgeCheck,
  Trophy,
  ArrowRight,
} from 'lucide-react'
import { PageWrapper } from '@/components/PageWrapper'
import { AnimatedTrustRing } from '@/components/AnimatedTrustRing'
import { TierBadge } from '@/components/TierBadge'
import { StatCard } from '@/components/StatCard'
import { AgreementCard } from '@/components/AgreementCard'
import { ActivityFeed } from '@/components/ActivityFeed'
import { FaucetButton } from '@/components/FaucetButton'
import { OnboardingModal } from '@/components/OnboardingModal'
import { SkeletonCard, SkeletonRing, SkeletonStat } from '@/components/Skeleton'
import { useGetTrustProfile, useGetUserAgreements, useQUSDCBalance } from '@/hooks/useTrustFlow'
import { useProtocolEvents } from '@/hooks/useEvents'
import { TRUSTFLOW_ABI, TRUSTFLOW_ADDRESS } from '@/lib/contracts'
import {
  qusdcToNumber,
  nextTierAt,
  tierInfo,
  truncateAddress,
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
  const { balance: qusdcBalance } = useQUSDCBalance(address)
  const { events } = useProtocolEvents()

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

  const { data: agRaw, isLoading: agLoading } = useReadContracts({
    contracts: agreementContracts as never,
    query: { enabled: agreementContracts.length > 0 },
  })
  const { data: msRaw } = useReadContracts({
    contracts: milestoneContracts as never,
    query: { enabled: milestoneContracts.length > 0 },
  })
  const agreementData = agRaw as { result?: unknown }[] | undefined
  const milestoneData = msRaw as { result?: unknown }[] | undefined

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
      .sort((a, b) => Number(b.agreement.id) - Number(a.agreement.id))
  }, [agreementData, milestoneData])

  const userEvents = useMemo(() => {
    if (!address) return []
    const lower = address.toLowerCase()
    return events.filter((e) => {
      const a = e.args
      return ['user', 'creator', 'client', 'recipient'].some(
        (k) => typeof a[k] === 'string' && (a[k] as string).toLowerCase() === lower
      )
    })
  }, [events, address])

  const score = Number(profile?.trustScore ?? 0n)
  const tier = profile?.tier ?? 0
  const next = nextTierAt(score)
  const verified = !!profile?.qiePassVerified

  const totalEarned = useMemo(
    () =>
      rows
        .filter((r) => r.agreement.creator.toLowerCase() === address?.toLowerCase())
        .reduce((sum, r) => sum + qusdcToNumber(r.agreement.paidAmount), 0),
    [rows, address]
  )
  const activeCount = rows.filter((r) => r.agreement.status === 1).length
  const completedCount = Number(profile?.completedAgreements ?? 0n)
  const disputeCount = Number(profile?.disputeCount ?? 0n)

  const listLoading = idsLoading || agLoading

  // Onboarding for first-time users
  const [showOnboarding, setShowOnboarding] = useState(false)
  useEffect(() => {
    if (!isConnected || listLoading) return
    let onboarded = false
    try {
      onboarded = window.localStorage.getItem('trustflow_onboarded') === 'true'
    } catch {
      /* ignore */
    }
    if (!onboarded && rows.length === 0) setShowOnboarding(true)
  }, [isConnected, listLoading, rows.length])

  // Recommended actions
  const recommendations = useMemo(() => {
    const recs: { icon: typeof BadgeCheck; title: string; body: string; href: string; cta: string }[] = []
    if (!verified)
      recs.push({ icon: BadgeCheck, title: 'Get QIE Pass verified', body: 'Add +200 to your trust score instantly.', href: 'https://www.qie.digital', cta: 'Verify' })
    if (rows.length === 0)
      recs.push({ icon: Plus, title: 'Create your first agreement', body: 'Start building your on-chain credit.', href: '/create', cta: 'Create' })
    if (score >= 500)
      recs.push({ icon: Trophy, title: 'Browse the leaderboard', body: 'See where you rank among top builders.', href: '/leaderboard', cta: 'View' })
    if (recs.length < 3)
      recs.push({ icon: Trophy, title: 'Climb the leaderboard', body: 'Complete more agreements to rank higher.', href: '/leaderboard', cta: 'View' })
    return recs.slice(0, 3)
  }, [verified, rows.length, score])

  return (
    <PageWrapper>
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}

      {/* Top banner */}
      <div className="card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-section-1" />
        <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:items-center">
          {profileLoading ? (
            <SkeletonRing />
          ) : (
            <AnimatedTrustRing score={score} size={180} startFromZero />
          )}
          <div className="flex-1 text-center lg:text-left">
            <p className="text-sm text-text-secondary">Welcome back,</p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-text">
              {truncateAddress(address)}
            </h1>
            <div className="mt-3 flex justify-center lg:justify-start">
              <TierBadge tier={tier} />
            </div>
            <p className="mt-3 text-sm text-text-secondary">
              {next ? `${next - score} points to ${tierInfo(tier + 1).name}` : 'Top tier reached: Elite'}
            </p>
            <div className="mt-2 h-2 w-full max-w-sm overflow-hidden rounded-full bg-bg-subtle">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min((score / 1000) * 100, 100)}%`, background: 'var(--gradient-trust)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Faucet prompt when QUSDC balance is low */}
      {qusdcBalance !== undefined && qusdcBalance < 100_000_000n && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-brand-primary/25 bg-brand-primary/10 px-5 py-3">
          <p className="text-sm text-text-secondary">
            Your test QUSDC balance is low. Mint some to fund agreements.
          </p>
          <FaucetButton compact={false} />
        </div>
      )}

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {profileLoading ? (
          <>
            <SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat />
          </>
        ) : (
          <>
            <StatCard icon={<Wallet size={15} />} label="Total Earned" value={totalEarned} decimals={2} suffix="QUSDC" />
            <StatCard icon={<Activity size={15} />} label="Active" value={activeCount} />
            <StatCard icon={<CheckCircle2 size={15} />} label="Completed" value={completedCount} />
            <StatCard icon={<AlertTriangle size={15} />} label="Disputes" value={disputeCount} />
          </>
        )}
      </div>

      {/* Two columns */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-tight text-text">
              Active Agreements
            </h2>
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-display text-sm font-semibold text-white"
              style={{ background: 'var(--gradient-hero)' }}
            >
              <Plus size={16} /> Create New
            </Link>
          </div>

          {listLoading ? (
            <div className="space-y-4">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : rows.length === 0 ? (
            <div className="card flex flex-col items-center px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-subtle text-text-dim">
                <Inbox size={22} />
              </span>
              <p className="mt-4 font-display text-base font-semibold text-text">No agreements yet</p>
              <p className="mt-1 text-sm text-text-secondary">Create your first one to start building trust.</p>
            </div>
          ) : (
            <motion.div variants={container} initial="initial" animate="animate" className="space-y-4">
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

        <div>
          <h2 className="mb-5 font-display text-xl font-bold tracking-tight text-text">
            Your Recent Activity
          </h2>
          <div className="card p-5">
            <ActivityFeed events={userEvents} limit={10} emptyText="No activity yet. Create an agreement to begin." />
          </div>
        </div>
      </div>

      {/* Recommended actions */}
      <div className="mt-10">
        <h2 className="mb-5 font-display text-xl font-bold tracking-tight text-text">
          Recommended Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {recommendations.map((rec, i) => {
            const Icon = rec.icon
            const external = rec.href.startsWith('http')
            const inner = (
              <div className="card card-hover flex h-full flex-col p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary-light">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-text">{rec.title}</h3>
                <p className="mt-1 flex-1 text-sm text-text-secondary">{rec.body}</p>
                <span className="mt-3 inline-flex items-center gap-1 font-display text-sm font-semibold text-brand-primary-light">
                  {rec.cta} <ArrowRight size={14} />
                </span>
              </div>
            )
            return external ? (
              <a key={i} href={rec.href} target="_blank" rel="noreferrer">{inner}</a>
            ) : (
              <Link key={i} href={rec.href}>{inner}</Link>
            )
          })}
        </div>
      </div>
    </PageWrapper>
  )
}
