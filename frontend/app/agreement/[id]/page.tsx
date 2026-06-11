'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import {
  Calendar,
  Share2,
  CheckCircle2,
  Wallet,
  ArrowLeft,
} from 'lucide-react'
import { PageWrapper } from '@/components/PageWrapper'
import { StatusBadge } from '@/components/StatusBadge'
import { AddressDisplay } from '@/components/AddressDisplay'
import { MilestoneTimeline, type Role } from '@/components/MilestoneTimeline'
import { TransactionButton } from '@/components/TransactionButton'
import { TrustScoreRing } from '@/components/TrustScoreRing'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import {
  useGetAgreement,
  useGetMilestones,
  useGetTrustProfile,
  useQUSDCAllowance,
  useQUSDCBalance,
  useFundAgreement,
  useApproveMilestone,
  useCompleteMilestone,
  useCancelAgreement,
} from '@/hooks/useTrustFlow'
import { explorerTx } from '@/lib/chains'
import {
  formatQUSDC,
  formatDate,
  friendlyError,
  type Milestone,
} from '@/lib/utils'

export default function AgreementDetailPage() {
  const params = useParams()
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id
  const idValid = idParam !== undefined && /^\d+$/.test(idParam)
  const agreementId = idValid ? BigInt(idParam!) : undefined

  const { address } = useAccount()
  const { toast } = useToast()

  const { agreement, isLoading: aLoading, refetch: refetchA } =
    useGetAgreement(agreementId)
  const { milestones, isLoading: mLoading, refetch: refetchM } =
    useGetMilestones(agreementId)

  const creator = agreement?.creator
  const client = agreement?.client
  const { profile: creatorProfile } = useGetTrustProfile(creator)
  const { profile: clientProfile } = useGetTrustProfile(client)

  const { balance } = useQUSDCBalance(address)
  const { allowance, refetch: refetchAllowance } = useQUSDCAllowance(address)

  const fundFlow = useFundAgreement()
  const approveHook = useApproveMilestone()
  const completeHook = useCompleteMilestone()
  const cancelHook = useCancelAgreement()

  const [busyIndex, setBusyIndex] = useState<number | null>(null)

  const isCreator = address && creator && address.toLowerCase() === creator.toLowerCase()
  const isClient = address && client && address.toLowerCase() === client.toLowerCase()
  const role: Role = isClient ? 'client' : isCreator ? 'freelancer' : 'observer'

  const refetchAll = () => {
    refetchA()
    refetchM()
    refetchAllowance()
  }

  // --- Fund ---
  const onFund = async () => {
    if (!agreement) return
    if (balance !== undefined && balance < agreement.totalAmount) {
      toast({
        type: 'error',
        message: `Insufficient QUSDC. You need ${formatQUSDC(agreement.totalAmount)}.`,
      })
      return
    }
    try {
      const hash = await fundFlow.fund(
        agreement.id,
        agreement.totalAmount,
        allowance ?? 0n
      )
      toast({
        type: 'success',
        message: 'Agreement funded — now active!',
        href: explorerTx(hash),
      })
      refetchAll()
    } catch (e) {
      toast({ type: 'error', message: friendlyError(e) })
    }
  }

  // --- Approve milestone ---
  const onApprove = async (index: number) => {
    if (!agreement) return
    setBusyIndex(index)
    try {
      const hash = await approveHook.approveMilestone(agreement.id, index)
      toast({
        type: 'success',
        message: 'Milestone approved — payment released!',
        href: explorerTx(hash),
      })
      refetchAll()
    } catch (e) {
      toast({ type: 'error', message: friendlyError(e) })
    } finally {
      setBusyIndex(null)
    }
  }

  // --- Complete milestone ---
  const onComplete = async (index: number, proofURI: string) => {
    if (!agreement) return
    setBusyIndex(index)
    try {
      const hash = await completeHook.completeMilestone(
        agreement.id,
        index,
        proofURI
      )
      toast({
        type: 'success',
        message: 'Milestone submitted for approval',
        href: explorerTx(hash),
      })
      refetchAll()
    } catch (e) {
      toast({ type: 'error', message: friendlyError(e) })
    } finally {
      setBusyIndex(null)
    }
  }

  // --- Cancel ---
  const onCancel = async () => {
    if (!agreement) return
    try {
      const hash = await cancelHook.cancelAgreement(agreement.id)
      toast({
        type: 'info',
        message: 'Agreement cancelled',
        href: explorerTx(hash),
      })
      refetchAll()
    } catch (e) {
      toast({ type: 'error', message: friendlyError(e) })
    }
  }

  const shareFundLink = async () => {
    const url = `${window.location.origin}/fund/${idParam}`
    try {
      await navigator.clipboard.writeText(url)
      toast({ type: 'success', message: 'Funding link copied to clipboard' })
    } catch {
      toast({ type: 'info', message: url })
    }
  }

  if (!idValid) {
    return (
      <PageWrapper className="max-w-2xl">
        <div className="card p-8 text-center">
          <p className="font-display text-lg font-semibold">Invalid agreement</p>
          <Link href="/dashboard" className="mt-3 inline-block text-sm text-trust-accent">
            Back to dashboard
          </Link>
        </div>
      </PageWrapper>
    )
  }

  const loading = aLoading || mLoading
  const ms: Milestone[] = milestones ?? []
  const approvedMs = ms.filter((m) => m.status === 3)

  const txStateFor = (hookStatus: string) =>
    hookStatus === 'loading' ? 'loading' : 'idle'

  return (
    <PageWrapper className="max-w-4xl">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-trust-text-secondary transition-colors hover:text-trust-text"
      >
        <ArrowLeft size={15} /> Dashboard
      </Link>

      {loading || !agreement ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      ) : (
        <>
          {/* Header card */}
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-2xl font-bold tracking-display-md text-trust-text">
                    {agreement.title || `Agreement #${agreement.id}`}
                  </h1>
                  <StatusBadge status={agreement.status} />
                </div>
                {agreement.description && (
                  <p className="mt-2 max-w-2xl text-sm text-trust-text-secondary">
                    {agreement.description}
                  </p>
                )}
              </div>
              <button
                onClick={shareFundLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-trust-border px-3 py-2 font-display text-xs font-semibold text-trust-text-secondary transition-colors hover:border-trust-accent/40 hover:text-trust-text"
              >
                <Share2 size={14} /> Share funding link
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase text-trust-text-dim">Freelancer</p>
                <div className="mt-1">
                  <AddressDisplay
                    address={agreement.creator}
                    domain={agreement.creatorDomain || undefined}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-trust-text-dim">Client</p>
                <div className="mt-1">
                  <AddressDisplay address={agreement.client} />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-trust-text-dim">Created</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-trust-text">
                  <Calendar size={13} className="text-trust-text-dim" />
                  {formatDate(agreement.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-trust-text-dim">Total</p>
                <p className="mt-1 font-mono text-sm text-trust-text">
                  {formatQUSDC(agreement.totalAmount)}
                </p>
              </div>
            </div>

            {/* Top-level actions */}
            <div className="mt-5 flex flex-wrap gap-3 border-t border-trust-border pt-5">
              {isClient && agreement.status === 0 && (
                <TransactionButton
                  state={fundFlow.step === 'idle' || fundFlow.step === 'success' || fundFlow.step === 'error' ? 'idle' : 'loading'}
                  loadingLabel={
                    fundFlow.step === 'approving'
                      ? 'Step 1/2: Approving…'
                      : 'Step 2/2: Funding…'
                  }
                  onClick={onFund}
                >
                  Fund Agreement ({formatQUSDC(agreement.totalAmount, false)} QUSDC)
                </TransactionButton>
              )}

              {(agreement.status === 0 || agreement.status === 1) &&
                (isClient || (isCreator && agreement.status === 0)) && (
                  <TransactionButton
                    variant="danger"
                    state={txStateFor(cancelHook.status)}
                    loadingLabel="Cancelling…"
                    onClick={onCancel}
                  >
                    Cancel Agreement
                  </TransactionButton>
                )}

              {role === 'observer' && (
                <p className="text-sm text-trust-text-dim">
                  You are viewing this agreement as an observer.
                </p>
              )}
            </div>
          </div>

          {/* Milestone timeline */}
          <div className="card mt-6 p-6">
            <h2 className="mb-5 font-display text-lg font-semibold tracking-display-md text-trust-text">
              Milestones
            </h2>
            <MilestoneTimeline
              milestones={ms}
              role={role}
              busyIndex={busyIndex}
              txState={
                approveHook.status === 'loading' ||
                completeHook.status === 'loading'
                  ? 'loading'
                  : 'idle'
              }
              onApprove={onApprove}
              onComplete={onComplete}
            />
          </div>

          {/* Payment history */}
          <div className="card mt-6 p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold tracking-display-md text-trust-text">
              <Wallet size={18} className="text-trust-progress" /> Payment History
            </h2>
            {approvedMs.length === 0 ? (
              <p className="text-sm text-trust-text-dim">
                No payments released yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-trust-border text-xs uppercase text-trust-text-dim">
                      <th className="pb-2 pr-4 font-medium">Milestone</th>
                      <th className="pb-2 pr-4 font-medium">Amount</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedMs.map((m, i) => (
                      <tr key={i} className="border-b border-trust-border/50">
                        <td className="py-2.5 pr-4 text-trust-text">
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-trust-progress" />
                            {m.name}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-trust-text">
                          {formatQUSDC(m.amount)}
                        </td>
                        <td className="py-2.5 text-trust-text-secondary">
                          {formatDate(m.approvedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Trust impact */}
          <div className="card mt-6 p-6">
            <h2 className="mb-5 font-display text-lg font-semibold tracking-display-md text-trust-text">
              Trust Impact
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { label: 'Freelancer', addr: agreement.creator, profile: creatorProfile },
                { label: 'Client', addr: agreement.client, profile: clientProfile },
              ].map((p) => {
                const score = Number(p.profile?.trustScore ?? 0n)
                const projected =
                  agreement.status === 2 ? score : Math.min(score + 100, 1000)
                return (
                  <div
                    key={p.label}
                    className="flex items-center gap-4 rounded-xl bg-trust-base p-4"
                  >
                    <TrustScoreRing
                      score={score}
                      tier={p.profile?.tier ?? 0}
                      size="sm"
                    />
                    <div>
                      <p className="text-xs uppercase text-trust-text-dim">
                        {p.label}
                      </p>
                      <p className="mt-0.5 font-mono text-sm text-trust-text">
                        {score} pts
                      </p>
                      {agreement.status !== 2 && (
                        <p className="text-xs text-trust-progress">
                          → {projected} on completion
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  )
}
