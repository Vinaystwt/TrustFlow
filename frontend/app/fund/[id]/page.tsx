'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Shield, CheckCircle2, ArrowRight } from 'lucide-react'
import { TransactionButton } from '@/components/TransactionButton'
import { AddressDisplay } from '@/components/AddressDisplay'
import { StatusBadge } from '@/components/StatusBadge'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import {
  useGetAgreement,
  useGetMilestones,
  useQUSDCBalance,
  useQUSDCAllowance,
  useFundAgreement,
} from '@/hooks/useTrustFlow'
import { explorerTx } from '@/lib/chains'
import { formatQUSDC, friendlyError, type Milestone } from '@/lib/utils'

export default function FundPage() {
  const params = useParams()
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id
  const idValid = idParam !== undefined && /^\d+$/.test(idParam)
  const agreementId = idValid ? BigInt(idParam!) : undefined

  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { toast } = useToast()

  const { agreement, isLoading, refetch } = useGetAgreement(agreementId)
  const { milestones } = useGetMilestones(agreementId)
  const { balance } = useQUSDCBalance(address)
  const { allowance, refetch: refetchAllowance } = useQUSDCAllowance(address)
  const fundFlow = useFundAgreement()

  const [done, setDone] = useState(false)

  const ms: Milestone[] = milestones ?? []
  const isClient =
    address && agreement && address.toLowerCase() === agreement.client.toLowerCase()
  const sufficient =
    agreement && balance !== undefined ? balance >= agreement.totalAmount : false

  const onFund = async () => {
    if (!agreement) return
    try {
      const hash = await fundFlow.fund(
        agreement.id,
        agreement.totalAmount,
        allowance ?? 0n
      )
      toast({ type: 'success', message: 'Agreement funded!', href: explorerTx(hash) })
      setDone(true)
      refetch()
      refetchAllowance()
    } catch (e) {
      toast({ type: 'error', message: friendlyError(e) })
    }
  }

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-10 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-trust-accent/15 text-trust-accent">
            <Shield size={20} />
          </span>
          <span className="font-display text-xl font-bold tracking-display-md">
            TrustFlow
          </span>
        </div>

        {!idValid ? (
          <div className="card p-8 text-center">
            <p className="font-display text-lg font-semibold">Invalid link</p>
          </div>
        ) : done || (agreement && agreement.status !== 0) ? (
          <div className="card flex flex-col items-center p-10 text-center">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-trust-progress/15 text-trust-progress"
            >
              <CheckCircle2 size={34} />
            </motion.span>
            <h1 className="mt-5 font-display text-xl font-bold tracking-display-md">
              {agreement && agreement.status === 1
                ? 'Agreement is now active!'
                : agreement && agreement.status >= 2
                  ? 'This agreement is already funded'
                  : 'Agreement is now active!'}
            </h1>
            <p className="mt-2 text-sm text-trust-text-secondary">
              Funds are held in escrow and released as milestones are approved.
            </p>
            <Link
              href={`/agreement/${idParam}`}
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-trust-accent px-5 py-3 font-display text-sm font-semibold text-white hover:bg-trust-accent-hover"
            >
              View agreement <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-center font-display text-2xl font-bold tracking-display-md">
              You&apos;ve been invited to fund an agreement
            </h1>

            <div className="card mt-6 p-6">
              {isLoading || !agreement ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-24 w-full rounded-card" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold tracking-display-md">
                      {agreement.title || `Agreement #${agreement.id}`}
                    </h2>
                    <StatusBadge status={agreement.status} />
                  </div>
                  {agreement.description && (
                    <p className="mt-2 text-sm text-trust-text-secondary">
                      {agreement.description}
                    </p>
                  )}

                  <div className="mt-4 text-sm">
                    <span className="text-trust-text-dim">Freelancer: </span>
                    <AddressDisplay
                      address={agreement.creator}
                      domain={agreement.creatorDomain || undefined}
                    />
                  </div>

                  <div className="mt-4 space-y-2 border-t border-trust-border pt-4">
                    {ms.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-trust-text-secondary">{m.name}</span>
                        <span className="font-mono text-trust-text">
                          {formatQUSDC(m.amount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-trust-border pt-4">
                    <span className="font-display font-semibold text-trust-text">
                      Total
                    </span>
                    <span className="font-mono text-lg text-trust-text">
                      {formatQUSDC(agreement.totalAmount)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-5">
              {!isConnected ? (
                <button
                  onClick={openConnectModal}
                  className="w-full rounded-xl bg-trust-accent px-6 py-3.5 font-display text-base font-semibold text-white hover:bg-trust-accent-hover"
                >
                  Connect Wallet &amp; Fund
                </button>
              ) : !isClient ? (
                <div className="card border-trust-warning/40 p-4 text-center text-sm text-trust-warning">
                  This wallet is not the designated client for this agreement.
                  <div className="mt-3 flex justify-center">
                    <ConnectButton accountStatus="address" chainStatus="none" showBalance={false} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-trust-base px-4 py-3 text-sm">
                    <span className="text-trust-text-secondary">Your balance</span>
                    <span className="font-mono text-trust-text">
                      {formatQUSDC(balance)}
                    </span>
                  </div>
                  {sufficient ? (
                    <TransactionButton
                      state={
                        fundFlow.step === 'approving' || fundFlow.step === 'funding'
                          ? 'loading'
                          : 'idle'
                      }
                      loadingLabel={
                        fundFlow.step === 'approving'
                          ? 'Step 1/2: Approving…'
                          : 'Step 2/2: Funding…'
                      }
                      onClick={onFund}
                      className="w-full"
                    >
                      Fund {agreement ? formatQUSDC(agreement.totalAmount) : ''}
                    </TransactionButton>
                  ) : (
                    <button
                      disabled
                      className="w-full cursor-not-allowed rounded-xl bg-trust-danger/15 px-6 py-3.5 font-display text-sm font-semibold text-trust-danger"
                    >
                      Insufficient balance
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
