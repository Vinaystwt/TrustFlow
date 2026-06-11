'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { Address } from 'viem'
import { StatusBadge } from './StatusBadge'
import {
  formatQUSDC,
  truncateAddress,
  type Agreement,
} from '@/lib/utils'

export function AgreementCard({
  agreement,
  currentAddress,
  approvedCount,
}: {
  agreement: Agreement
  currentAddress?: Address
  approvedCount: number
}) {
  const isCreator =
    currentAddress?.toLowerCase() === agreement.creator.toLowerCase()
  const role = isCreator ? 'Freelancer' : 'Client'
  const counterparty = isCreator ? agreement.client : agreement.creator
  const total = Number(agreement.milestoneCount)
  const pct = total > 0 ? Math.round((approvedCount / total) * 100) : 0

  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
      }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(59,130,246,0.08)' }}
    >
      <Link href={`/agreement/${agreement.id}`} className="block">
        <div className="card card-hover p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-semibold tracking-display-md text-trust-text">
                {agreement.title || `Agreement #${agreement.id}`}
              </h3>
              <p className="mt-1 text-xs text-trust-text-secondary">
                <span className="rounded bg-trust-base px-1.5 py-0.5 font-display font-semibold text-trust-text-secondary">
                  {role}
                </span>{' '}
                · with{' '}
                <span className="font-mono text-trust-text-secondary">
                  {truncateAddress(counterparty)}
                </span>
              </p>
            </div>
            <StatusBadge status={agreement.status} />
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-trust-text-dim">
              <span>
                {approvedCount}/{total} milestones
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-trust-base">
              <motion.div
                className="h-full rounded-full bg-trust-progress"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-sm text-trust-text">
              {formatQUSDC(agreement.totalAmount)}
            </span>
            <span className="inline-flex items-center gap-1 font-display text-xs font-semibold text-trust-accent">
              View <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
