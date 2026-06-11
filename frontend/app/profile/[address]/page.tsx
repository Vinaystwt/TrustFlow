'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useReadContracts } from 'wagmi'
import { motion } from 'framer-motion'
import {
  BadgeCheck,
  Globe,
  Share2,
  CheckCircle2,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react'
import type { Address } from 'viem'
import { PageWrapper } from '@/components/PageWrapper'
import { TrustScoreRing } from '@/components/TrustScoreRing'
import { TierBadge } from '@/components/TierBadge'
import { AddressDisplay } from '@/components/AddressDisplay'
import { SkeletonRing } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { useGetTrustProfile, useGetUserAgreements } from '@/hooks/useTrustFlow'
import { TRUSTFLOW_ABI, TRUSTFLOW_ADDRESS } from '@/lib/contracts'
import {
  formatQUSDC,
  formatDate,
  isValidAddress,
  cx,
  type Agreement,
} from '@/lib/utils'

export default function ProfilePage() {
  const params = useParams()
  const addrParam = (
    Array.isArray(params.address) ? params.address[0] : params.address
  ) as string
  const valid = isValidAddress(addrParam || '')
  const address = valid ? (addrParam as Address) : undefined

  const { toast } = useToast()
  const { profile, isLoading } = useGetTrustProfile(address)
  const { ids } = useGetUserAgreements(address)

  const contracts = useMemo(
    () =>
      (ids ?? []).map((id) => ({
        abi: TRUSTFLOW_ABI,
        address: TRUSTFLOW_ADDRESS,
        functionName: 'getAgreement',
        args: [id],
      })),
    [ids]
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
    const earliest = agreements.reduce(
      (min, a) => (a.createdAt < min ? a.createdAt : min),
      agreements[0].createdAt
    )
    return earliest
  }, [agreements])

  const isDomainHolder = useMemo(
    () =>
      agreements.some(
        (a) =>
          a.creator.toLowerCase() === address?.toLowerCase() &&
          a.creatorDomain.trim().length > 0
      ),
    [agreements, address]
  )

  const completedCount = Number(profile?.completedAgreements ?? 0n)
  const disputeCount = Number(profile?.disputeCount ?? 0n)
  const denom = completedCount + disputeCount
  const disputeRatio = denom > 0 ? Math.round((disputeCount / denom) * 100) : 0

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
          <Link href="/dashboard" className="mt-3 inline-block text-sm text-trust-accent">
            Back to dashboard
          </Link>
        </div>
      </PageWrapper>
    )
  }

  const score = Number(profile?.trustScore ?? 0n)
  const verified = !!profile?.qiePassVerified

  const STATS = [
    { label: 'Completed', value: String(completedCount) },
    { label: 'Total Volume', value: formatQUSDC(profile?.totalVolumeUSDC) },
    { label: 'Member Since', value: memberSince ? formatDate(memberSince) : '—' },
    { label: 'Dispute Ratio', value: `${disputeRatio}%` },
  ]

  return (
    <PageWrapper className="max-w-3xl">
      <div className="card flex flex-col items-center p-8 text-center">
        {isLoading ? (
          <SkeletonRing />
        ) : (
          <>
            <TrustScoreRing score={score} tier={profile?.tier ?? 0} size="lg" />
            <div className="mt-5">
              <TierBadge tier={profile?.tier ?? 0} />
            </div>
            <div className="mt-3">
              <AddressDisplay address={address} />
            </div>
            <button
              onClick={share}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-trust-border px-4 py-2 font-display text-xs font-semibold text-trust-text-secondary transition-colors hover:border-trust-accent/40 hover:text-trust-text"
            >
              <Share2 size={14} /> Share Profile
            </button>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-xs uppercase text-trust-text-dim">{s.label}</p>
            <p className="mt-1.5 font-mono text-base text-trust-text">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Verification badges */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <VerificationBadge
          active={verified}
          icon={verified ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
          label="QIE Pass Verified"
          activeNote="Identity verified · +200 trust"
          inactiveNote="Not verified"
        />
        <VerificationBadge
          active={isDomainHolder}
          icon={<Globe size={18} />}
          label="Domain Holder"
          activeNote="Owns a .qie domain"
          inactiveNote="No domain linked"
        />
      </div>

      {/* History */}
      <div className="card mt-6 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold tracking-display-md text-trust-text">
          <BadgeCheck size={18} className="text-trust-progress" /> Completed Agreements
        </h2>
        {completed.length === 0 ? (
          <p className="text-sm text-trust-text-dim">
            No completed agreements yet.
          </p>
        ) : (
          <div className="space-y-2">
            {completed
              .sort((a, b) => Number(b.completedAt) - Number(a.completedAt))
              .map((a) => (
                <Link
                  key={String(a.id)}
                  href={`/agreement/${a.id}`}
                  className="flex items-center justify-between rounded-xl bg-trust-base px-4 py-3 transition-colors hover:bg-trust-surface-hover"
                >
                  <span className="inline-flex items-center gap-2 text-sm text-trust-text">
                    <CheckCircle2 size={15} className="text-trust-progress" />
                    {a.title || `Agreement #${a.id}`}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-sm text-trust-text">
                      {formatQUSDC(a.totalAmount)}
                    </span>
                    <span className="hidden text-xs text-trust-text-dim sm:inline">
                      {formatDate(a.completedAt)}
                    </span>
                  </span>
                </Link>
              ))}
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
    <div
      className={cx(
        'card flex items-center gap-3 p-4',
        active ? 'border-trust-progress/40' : ''
      )}
    >
      <span
        className={cx(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          active
            ? 'bg-trust-progress/15 text-trust-progress'
            : 'bg-trust-base text-trust-text-dim'
        )}
      >
        {icon}
      </span>
      <div>
        <p className="font-display text-sm font-semibold text-trust-text">
          {label}
        </p>
        <p
          className={cx(
            'text-xs',
            active ? 'text-trust-progress' : 'text-trust-text-dim'
          )}
        >
          {active ? activeNote : inactiveNote}
        </p>
      </div>
    </div>
  )
}
