'use client'

import Link from 'next/link'
import {
  FilePlus2,
  Wallet,
  PackageCheck,
  CheckCircle2,
  TrendingUp,
  XCircle,
  BadgeCheck,
  Banknote,
  Activity,
} from 'lucide-react'
import type { ProtocolEvent } from '@/hooks/useEvents'
import { explorerTx } from '@/lib/chains'
import { truncateAddress, formatQUSDC, cx } from '@/lib/utils'
import { Skeleton } from './Skeleton'

interface Rendered {
  icon: typeof Activity
  color: string
  text: string
  href?: string
}

function render(e: ProtocolEvent): Rendered {
  const a = e.args
  const id = a.agreementId !== undefined ? String(a.agreementId) : undefined
  const agHref = id ? `/agreement/${id}` : undefined
  switch (e.eventName) {
    case 'AgreementCreated':
      return {
        icon: FilePlus2,
        color: '#6366F1',
        text: `Agreement "${(a.title as string) || `#${id}`}" created`,
        href: agHref,
      }
    case 'AgreementFunded':
      return {
        icon: Wallet,
        color: '#06B6D4',
        text: `Agreement #${id} funded (${formatQUSDC(a.totalAmount as bigint)})`,
        href: agHref,
      }
    case 'MilestoneCompleted':
      return { icon: PackageCheck, color: '#F59E0B', text: `Milestone delivered on #${id}`, href: agHref }
    case 'MilestoneApproved':
      return {
        icon: CheckCircle2,
        color: '#10B981',
        text: `Milestone approved on #${id} (${formatQUSDC(a.amount as bigint)})`,
        href: agHref,
      }
    case 'PaymentReleased':
      return {
        icon: Banknote,
        color: '#10B981',
        text: `Payment of ${formatQUSDC(a.amount as bigint)} released`,
        href: agHref,
      }
    case 'TrustScoreUpdated':
      return {
        icon: TrendingUp,
        color: '#A855F7',
        text: `${truncateAddress(a.user as string)} score is now ${String(a.newScore)}`,
        href: `/profile/${a.user as string}`,
      }
    case 'AgreementCompleted':
      return { icon: CheckCircle2, color: '#22C55E', text: `Agreement #${id} completed`, href: agHref }
    case 'AgreementCancelled':
      return { icon: XCircle, color: '#EF4444', text: `Agreement #${id} cancelled`, href: agHref }
    case 'QiePassVerified':
      return {
        icon: BadgeCheck,
        color: '#10B981',
        text: `${truncateAddress(a.user as string)} verified with QIE Pass`,
        href: `/profile/${a.user as string}`,
      }
    default:
      return { icon: Activity, color: '#94A3B8', text: e.eventName }
  }
}

export function ActivityFeed({
  events,
  loading,
  limit = 10,
  emptyText = 'No activity yet.',
}: {
  events: ProtocolEvent[]
  loading?: boolean
  limit?: number
  emptyText?: string
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    )
  }

  const shown = events.slice(0, limit)
  if (shown.length === 0) {
    return <p className="text-sm text-text-dim">{emptyText}</p>
  }

  return (
    <ul className="space-y-1">
      {shown.map((e, i) => {
        const r = render(e)
        const Icon = r.icon
        const body = (
          <div className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-bg-subtle">
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${r.color}22`, color: r.color }}
            >
              <Icon size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text">{r.text}</p>
              <a
                href={explorerTx(e.txHash)}
                target="_blank"
                rel="noreferrer"
                onClick={(ev) => ev.stopPropagation()}
                className="font-mono text-xs text-text-dim hover:text-brand-primary-light"
              >
                {truncateAddress(e.txHash)} ↗
              </a>
            </div>
          </div>
        )
        return (
          <li key={`${e.txHash}-${e.logIndex}-${i}`}>
            {r.href ? (
              <Link href={r.href} className={cx('block')}>
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        )
      })}
    </ul>
  )
}
