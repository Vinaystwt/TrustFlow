'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useReadContracts } from 'wagmi'
import {
  Share2,
  CheckCircle2,
  ShieldCheck,
  ShieldOff,
  Globe,
} from 'lucide-react'
import type { Address } from 'viem'
import { PageWrapper } from '@/components/PageWrapper'
import { AnimatedTrustRing } from '@/components/AnimatedTrustRing'
import { TierBadge } from '@/components/TierBadge'
import { AddressDisplay } from '@/components/AddressDisplay'
import { Avatar } from '@/components/Avatar'
import { ActivityFeed } from '@/components/ActivityFeed'
import { SkeletonRing } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { useGetTrustProfile, useGetUserAgreements } from '@/hooks/useTrustFlow'
import { useProtocolEvents } from '@/hooks/useEvents'
import { TRUSTFLOW_ABI } from '@/lib/contracts'
import { useContracts } from '@/lib/useContracts'
import { formatQUSDC, formatDate, isValidAddress, cx, type Agreement } from '@/lib/utils'

const TABS = ['Overview', 'Agreements', 'Activity'] as const
type Tab = (typeof TABS)[number]

export default function ProfilePage() {
  const params = useParams()
  const addrParam = (Array.isArray(params.address) ? params.address[0] : params.address) as string
  const valid = isValidAddress(addrParam || '')
  const address = valid ? (addrParam as Address) : undefined

  const { toast } = useToast()
  const { trustFlowAddress, chainId } = useContracts()
  const { profile, isLoading } = useGetTrustProfile(address)
  const { ids } = useGetUserAgreements(address)
  const { events } = useProtocolEvents()
  const [tab, setTab] = useState<Tab>('Overview')

  const contracts = useMemo(
    () =>
      (ids ?? []).map((id) => ({
        abi: TRUSTFLOW_ABI,
        address: trustFlowAddress,
        chainId,
        functionName: 'getAgreement',
        args: [id],
      })),
    [ids, trustFlowAddress, chainId]
  )
  const { data: dataRaw } = useReadContracts({
    contracts: contracts as never,
    query: { enabled: contracts.length > 0 },
  })
  const data = dataRaw as { result?: unknown }[] | undefined
  const agreements = useMemo(
    () =>
      (data ?? [])
        .map((r) => r.result as Agreement | undefined)
        .filter((a): a is Agreement => !!a),
    [data]
  )

  const completed = agreements.filter((a) => a.status === 2)
  const memberSince = useMemo(() => {
    if (agreements.length === 0) return null
    return agreements.reduce((min, a) => (a.createdAt < min ? a.createdAt : min), agreements[0].createdAt)
  }, [agreements])

  const isDomainHolder = useMemo(
    () => agreements.some((a) => a.creator.toLowerCase() === address?.toLowerCase() && a.creatorDomain.trim().length > 0),
    [agreements, address]
  )

  const userEvents = useMemo(() => {
    if (!address) return []
    const lower = address.toLowerCase()
    return events.filter((e) =>
      ['user', 'creator', 'client', 'recipient'].some(
        (k) => typeof e.args[k] === 'string' && (e.args[k] as string).toLowerCase() === lower
      )
    )
  }, [events, address])

  const completedCount = Number(profile?.completedAgreements ?? 0n)
  const disputeCount = Number(profile?.disputeCount ?? 0n)
  const denom = completedCount + disputeCount
  const disputeRatio = denom > 0 ? Math.round((disputeCount / denom) * 100) : 0
  const score = Number(profile?.trustScore ?? 0n)
  const verified = !!profile?.qiePassVerified

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({ type: 'success', message: 'Profile link copied' })
    } catch {
      toast({ type: 'info', message: window.location.href })
    }
  }

  if (!valid) {
    return (
      <PageWrapper className="max-w-xl">
        <div className="card p-8 text-center">
          <p className="font-display text-lg font-semibold">Invalid address</p>
          <Link href="/dashboard" className="mt-3 inline-block text-sm text-brand-primary-light">Back to dashboard</Link>
        </div>
      </PageWrapper>
    )
  }

  const STATS = [
    { label: 'Completed', value: String(completedCount) },
    { label: 'Total Volume', value: formatQUSDC(profile?.totalVolumeUSDC) },
    { label: 'Member Since', value: memberSince ? formatDate(memberSince) : 'N/A' },
    { label: 'Dispute Ratio', value: `${disputeRatio}%` },
  ]

  return (
    <PageWrapper className="max-w-3xl">
      {/* Header */}
      <div className="card relative overflow-hidden p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-section-1" />
        <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          {isLoading ? <SkeletonRing /> : <AnimatedTrustRing score={score} size={150} startFromZero />}
          <div className="flex-1">
            <div className="flex items-center justify-center gap-3 sm:justify-start">
              <Avatar address={address} size={40} />
              <AddressDisplay address={address} />
            </div>
            <div className="mt-3 flex justify-center sm:justify-start">
              <TierBadge tier={profile?.tier ?? 0} />
            </div>
            <button
              onClick={share}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 font-display text-xs font-semibold text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-text"
            >
              <Share2 size={14} /> Share Profile
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              'relative px-4 py-3 font-display text-sm font-semibold transition-colors',
              tab === t ? 'text-text' : 'text-text-secondary hover:text-text'
            )}
          >
            {t}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-brand-primary" />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="card p-4 text-center">
                  <p className="text-xs uppercase text-text-dim">{s.label}</p>
                  <p className="mt-1.5 font-mono text-base text-text">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <VerificationBadge active={verified} icon={verified ? <ShieldCheck size={18} /> : <ShieldOff size={18} />} label="QIE Pass Verified" activeNote="Identity verified · +200 trust" inactiveNote="Not verified" />
              <VerificationBadge active={isDomainHolder} icon={<Globe size={18} />} label="Domain Holder" activeNote="Owns a .qie domain" inactiveNote="No domain linked" />
            </div>
          </div>
        )}

        {tab === 'Agreements' && (
          completed.length === 0 ? (
            <p className="text-sm text-text-dim">No completed agreements yet.</p>
          ) : (
            <div className="space-y-2">
              {completed
                .sort((a, b) => Number(b.completedAt) - Number(a.completedAt))
                .map((a) => (
                  <Link key={String(a.id)} href={`/agreement/${a.id}`} className="flex items-center justify-between rounded-xl bg-bg-elevated px-4 py-3 transition-colors hover:bg-bg-subtle">
                    <span className="inline-flex items-center gap-2 text-sm text-text">
                      <CheckCircle2 size={15} className="text-success" /> {a.title || `Agreement #${a.id}`}
                    </span>
                    <span className="font-mono text-sm text-text">{formatQUSDC(a.totalAmount)}</span>
                  </Link>
                ))}
            </div>
          )
        )}

        {tab === 'Activity' && (
          <div className="card p-5">
            <ActivityFeed events={userEvents} limit={20} emptyText="No on-chain activity yet." />
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

function VerificationBadge({
  active,
  icon,
  label,
  activeNote,
  inactiveNote,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  activeNote: string
  inactiveNote: string
}) {
  return (
    <div className={cx('card flex items-center gap-3 p-4', active && 'border-success/40')}>
      <span className={cx('flex h-10 w-10 items-center justify-center rounded-lg', active ? 'bg-success/15 text-success' : 'bg-bg-subtle text-text-dim')}>
        {icon}
      </span>
      <div>
        <p className="font-display text-sm font-semibold text-text">{label}</p>
        <p className={cx('text-xs', active ? 'text-success' : 'text-text-dim')}>{active ? activeNote : inactiveNote}</p>
      </div>
    </div>
  )
}
