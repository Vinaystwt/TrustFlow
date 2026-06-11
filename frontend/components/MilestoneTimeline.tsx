'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Circle,
  Clock,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  X,
} from 'lucide-react'
import { TransactionButton, type TxState } from './TransactionButton'
import {
  formatQUSDC,
  formatDate,
  type Milestone,
  type MilestoneStatus,
} from '@/lib/utils'

export type Role = 'client' | 'freelancer' | 'observer'

const NODE: Record<
  MilestoneStatus,
  { color: string; icon: typeof Circle; label: string }
> = {
  0: { color: '#64748B', icon: Circle, label: 'Pending' },
  1: { color: '#3B82F6', icon: Clock, label: 'Awaiting delivery' },
  2: { color: '#F59E0B', icon: FileCheck2, label: 'Awaiting approval' },
  3: { color: '#10B981', icon: CheckCircle2, label: 'Paid' },
  4: { color: '#EF4444', icon: AlertTriangle, label: 'Disputed' },
}

export function MilestoneTimeline({
  milestones,
  role,
  busyIndex,
  txState,
  onApprove,
  onComplete,
}: {
  milestones: Milestone[]
  role: Role
  busyIndex: number | null
  txState: TxState
  onApprove: (index: number) => void
  onComplete: (index: number, proofURI: string) => void
}) {
  const [modalIndex, setModalIndex] = useState<number | null>(null)
  const [proof, setProof] = useState('')

  const submitProof = () => {
    if (modalIndex === null) return
    onComplete(modalIndex, proof.trim())
    setModalIndex(null)
    setProof('')
  }

  return (
    <div className="relative">
      <ul className="space-y-1">
        {milestones.map((m, i) => {
          const meta = NODE[m.status]
          const Icon = meta.icon
          const isLast = i === milestones.length - 1
          const justApproved = m.status === 3
          const busy = busyIndex === i

          const canComplete = role === 'freelancer' && m.status === 1
          const canApprove = role === 'client' && m.status === 2

          return (
            <li key={i} className="relative flex gap-4 pb-6">
              {!isLast && (
                <span
                  className="absolute left-[15px] top-8 h-full w-px"
                  style={{ backgroundColor: '#1E3050' }}
                />
              )}

              <div className="relative shrink-0">
                {justApproved && (
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{ border: `2px solid ${meta.color}` }}
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                )}
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `${meta.color}22`,
                    color: meta.color,
                  }}
                >
                  <Icon size={16} />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-trust-text">
                      {m.name || `Milestone ${i + 1}`}
                    </p>
                    <p
                      className="text-xs font-medium"
                      style={{ color: meta.color }}
                    >
                      {meta.label}
                      {m.status === 3 && m.approvedAt > 0n && (
                        <span className="text-trust-text-dim">
                          {' '}
                          · {formatDate(m.approvedAt)}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="font-mono text-sm text-trust-text">
                    {formatQUSDC(m.amount)}
                  </span>
                </div>

                {m.proofURI && (
                  <a
                    href={m.proofURI}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 font-mono text-xs text-trust-accent hover:underline"
                  >
                    <ExternalLink size={12} /> View deliverable
                  </a>
                )}

                {(canComplete || canApprove) && (
                  <div className="mt-3">
                    {canComplete && (
                      <TransactionButton
                        variant="primary"
                        state={busy ? txState : 'idle'}
                        loadingLabel="Submitting…"
                        onClick={() => {
                          setModalIndex(i)
                          setProof('')
                        }}
                        className="!px-4 !py-2 text-xs"
                      >
                        Mark Complete
                      </TransactionButton>
                    )}
                    {canApprove && (
                      <TransactionButton
                        variant="primary"
                        state={busy ? txState : 'idle'}
                        loadingLabel="Approving…"
                        onClick={() => onApprove(i)}
                        className="!px-4 !py-2 text-xs"
                      >
                        Approve &amp; Release
                      </TransactionButton>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <AnimatePresence>
        {modalIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalIndex(null)}
          >
            <motion.div
              className="card w-full max-w-md p-6"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold tracking-display-md">
                  Submit deliverable
                </h3>
                <button
                  onClick={() => setModalIndex(null)}
                  className="text-trust-text-dim hover:text-trust-text"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mt-1 text-sm text-trust-text-secondary">
                Link to your completed work for{' '}
                <span className="text-trust-text">
                  {milestones[modalIndex]?.name}
                </span>
                . The client reviews this before approving payment.
              </p>
              <label className="mt-4 block font-body text-sm font-medium text-trust-text-secondary">
                Proof URI
              </label>
              <input
                type="url"
                value={proof}
                autoFocus
                onChange={(e) => setProof(e.target.value)}
                placeholder="https://github.com/... or ipfs://..."
                className="mt-1.5 w-full rounded-xl border border-trust-border bg-trust-base px-3.5 py-2.5 font-mono text-sm text-trust-text outline-none transition-colors placeholder:text-trust-text-dim focus:border-trust-accent"
              />
              <div className="mt-5 flex justify-end gap-2">
                <TransactionButton
                  variant="ghost"
                  onClick={() => setModalIndex(null)}
                  className="!py-2.5"
                >
                  Cancel
                </TransactionButton>
                <TransactionButton
                  variant="primary"
                  onClick={submitProof}
                  disabled={!proof.trim()}
                  className="!py-2.5"
                >
                  Submit &amp; Mark Complete
                </TransactionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
