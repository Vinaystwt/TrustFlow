'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useReadContracts } from 'wagmi'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { PageWrapper } from '@/components/PageWrapper'
import { TierBadge } from '@/components/TierBadge'
import { AddressDisplay } from '@/components/AddressDisplay'
import { Avatar } from '@/components/Avatar'
import { Skeleton } from '@/components/Skeleton'
import { useProtocolEvents, uniqueUsers } from '@/hooks/useEvents'
import { TRUSTFLOW_ABI, TRUSTFLOW_ADDRESS } from '@/lib/contracts'
import { formatQUSDC, cx, type TrustProfile } from '@/lib/utils'

const MEDAL = ['#F59E0B', '#94A3B8', '#B45309']

export default function LeaderboardPage() {
  const { events, isLoading: eventsLoading } = useProtocolEvents()
  const users = useMemo(() => uniqueUsers(events), [events])

  const contracts = useMemo(
    () =>
      users.map((u) => ({
        abi: TRUSTFLOW_ABI,
        address: TRUSTFLOW_ADDRESS,
        functionName: 'getTrustProfile',
        args: [u],
      })),
    [users]
  )

  const { data: profRaw, isLoading: profLoading } = useReadContracts({
    contracts: contracts as never,
    query: { enabled: users.length > 0 },
  })

  const rows = useMemo(() => {
    const profiles = (profRaw as { result?: unknown }[] | undefined) ?? []
    return profiles
      .map((r, i) => ({ address: users[i], profile: r.result as TrustProfile | undefined }))
      .filter((r) => r.profile && Number(r.profile.trustScore) > 0)
      .sort((a, b) => Number(b.profile!.trustScore) - Number(a.profile!.trustScore))
      .slice(0, 10)
  }, [profRaw, users])

  const loading = eventsLoading || (users.length > 0 && profLoading)

  return (
    <PageWrapper className="max-w-4xl">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-amber/15 text-accent-amber">
          <Trophy size={22} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text">
            Top Trusted Users
          </h1>
          <p className="text-text-secondary">The most reputable builders on TrustFlow</p>
        </div>
      </div>

      <div className="card mt-8 overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Trophy size={28} className="text-text-dim" />
            <p className="mt-4 font-display text-lg font-semibold text-text">
              Be the first.
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Create an agreement to claim the top spot.
            </p>
            <Link
              href="/create"
              className="mt-5 rounded-xl px-5 py-2.5 font-display text-sm font-semibold text-white"
              style={{ background: 'var(--gradient-hero)' }}
            >
              Create Agreement
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-text-dim">
                  <th className="px-5 py-3 font-medium">Rank</th>
                  <th className="px-2 py-3 font-medium">User</th>
                  <th className="px-2 py-3 font-medium">Tier</th>
                  <th className="px-2 py-3 text-right font-medium">Score</th>
                  <th className="hidden px-2 py-3 text-right font-medium sm:table-cell">Completed</th>
                  <th className="hidden px-5 py-3 text-right font-medium sm:table-cell">Volume</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <motion.tr
                    key={r.address}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/50 transition-colors hover:bg-bg-subtle"
                  >
                    <td className="px-5 py-3">
                      <span
                        className={cx(
                          'inline-flex h-7 w-7 items-center justify-center rounded-full font-display text-sm font-bold',
                          i < 3 ? 'text-bg' : 'text-text-secondary'
                        )}
                        style={i < 3 ? { backgroundColor: MEDAL[i] } : {}}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <Link href={`/profile/${r.address}`} className="flex items-center gap-2.5">
                        <Avatar address={r.address} size={32} />
                        <AddressDisplay address={r.address} showExplorer={false} />
                      </Link>
                    </td>
                    <td className="px-2 py-3">
                      <TierBadge tier={r.profile!.tier} size="sm" />
                    </td>
                    <td className="px-2 py-3 text-right font-display font-bold text-text">
                      {String(r.profile!.trustScore)}
                    </td>
                    <td className="hidden px-2 py-3 text-right font-mono text-text-secondary sm:table-cell">
                      {String(r.profile!.completedAgreements)}
                    </td>
                    <td className="hidden px-5 py-3 text-right font-mono text-text-secondary sm:table-cell">
                      {formatQUSDC(r.profile!.totalVolumeUSDC, false)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
