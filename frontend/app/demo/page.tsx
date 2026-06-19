'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlayCircle,
  Wallet,
  FileCheck2,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Loader2,
  AlertCircle,
  Rocket,
  ExternalLink,
} from 'lucide-react'
import { PageWrapper } from '@/components/PageWrapper'
import { FaucetButton } from '@/components/FaucetButton'
import { AnimatedTrustRing } from '@/components/AnimatedTrustRing'
import { TierBadge } from '@/components/TierBadge'
import { useToast } from '@/components/Toast'
import {
  useCreateAgreement,
  useCompleteMilestone,
  useGetAgreement,
  useGetMilestones,
  useGetTrustProfile,
  useQUSDCBalance,
} from '@/hooks/useTrustFlow'
import { explorerTx } from '@/lib/chains'
import { formatQUSDC, friendlyError, cx } from '@/lib/utils'
import { useContracts } from '@/lib/useContracts'
import { useActiveNetwork } from '@/hooks/useActiveNetwork'
import type { Address } from 'viem'

const RELAYER_ADDRESS = (process.env.NEXT_PUBLIC_RELAYER_ADDRESS || '') as Address

type DemoStep = 'intro' | 'create' | 'fund' | 'complete' | 'approve' | 'done'

const STEP_META: Record<DemoStep, { icon: typeof PlayCircle; label: string }> = {
  intro: { icon: PlayCircle, label: 'Start' },
  create: { icon: FileCheck2, label: 'Create Agreement' },
  fund: { icon: Wallet, label: 'Client Funds' },
  complete: { icon: FileCheck2, label: 'Deliver Work' },
  approve: { icon: CheckCircle2, label: 'Client Approves' },
  done: { icon: Trophy, label: 'Complete' },
}

const STEPS: DemoStep[] = ['intro', 'create', 'fund', 'complete', 'approve', 'done']

async function callRelayer(action: string, agreementId: string, userAddress: string, milestoneIndex?: number) {
  const res = await fetch('/api/relayer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, agreementId, milestoneIndex, userAddress }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Relayer request failed')
  return data
}

export default function DemoPage() {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { toast } = useToast()
  const { hasRelayer } = useContracts()
  const { setActiveNetwork } = useActiveNetwork()

  const [step, setStep] = useState<DemoStep>('intro')
  const [agreementId, setAgreementId] = useState<bigint | undefined>()
  const [busy, setBusy] = useState(false)
  const [relayerFailed, setRelayerFailed] = useState(false)
  const [txHashes, setTxHashes] = useState<Record<string, string>>({})

  const { create } = useCreateAgreement()
  const { completeMilestone } = useCompleteMilestone()
  const { agreement, refetch: refetchAg } = useGetAgreement(agreementId)
  const { milestones, refetch: refetchMs } = useGetMilestones(agreementId)
  const { profile, refetch: refetchProfile } = useGetTrustProfile(address)
  const { balance } = useQUSDCBalance(address)

  const score = Number(profile?.trustScore ?? 0n)
  const tier = profile?.tier ?? 0

  const stepIndex = STEPS.indexOf(step)

  // --- Step handlers ---

  const handleCreate = useCallback(async () => {
    if (!address || busy) return
    if (!RELAYER_ADDRESS || RELAYER_ADDRESS.length < 10) {
      toast({ type: 'error', message: 'Relayer not configured. Contact the team.' })
      return
    }
    setBusy(true)
    try {
      const { hash, agreementId: newId } = await create({
        title: 'Demo Agreement',
        description: 'Solo demo: automated client funds and approves so you can test the full cycle.',
        client: RELAYER_ADDRESS,
        names: ['Demo Deliverable'],
        amounts: [10_000_000n], // 10 QUSDC
        domain: '',
      })
      if (newId !== undefined) setAgreementId(newId)
      setTxHashes((prev) => ({ ...prev, create: hash }))
      toast({ type: 'success', message: 'Agreement created!', href: explorerTx(hash) })
      setStep('fund')
    } catch (e) {
      toast({ type: 'error', message: friendlyError(e) })
    } finally {
      setBusy(false)
    }
  }, [address, busy, create, toast])

  const handleFund = useCallback(async () => {
    if (!address || !agreementId || busy) return
    setBusy(true)
    try {
      const data = await callRelayer('fund', String(agreementId), address)
      setTxHashes((prev) => ({ ...prev, fund: data.txHash }))
      toast({ type: 'success', message: 'Demo client funded the agreement!' })
      await refetchAg()
      await refetchMs()
      setStep('complete')
    } catch (e: any) {
      setRelayerFailed(true)
      toast({ type: 'error', message: e.message || 'Relayer failed' })
    } finally {
      setBusy(false)
    }
  }, [address, agreementId, busy, toast, refetchAg, refetchMs])

  const handleComplete = useCallback(async () => {
    if (!agreementId || busy) return
    setBusy(true)
    try {
      const hash = await completeMilestone(agreementId, 0, 'https://demo.trustflow.example/proof')
      setTxHashes((prev) => ({ ...prev, complete: hash }))
      toast({ type: 'success', message: 'Milestone marked complete!' })
      setStep('approve')
    } catch (e) {
      toast({ type: 'error', message: friendlyError(e) })
    } finally {
      setBusy(false)
    }
  }, [agreementId, busy, completeMilestone, toast])

  const handleApprove = useCallback(async () => {
    if (!address || !agreementId || busy) return
    setBusy(true)
    try {
      const data = await callRelayer('approve', String(agreementId), address, 0)
      setTxHashes((prev) => ({ ...prev, approve: data.txHash }))
      toast({ type: 'success', message: 'Payment released! Trust score updated.' })
      await refetchProfile()
      await refetchAg()
      setStep('done')
    } catch (e: any) {
      setRelayerFailed(true)
      toast({ type: 'error', message: e.message || 'Relayer failed' })
    } finally {
      setBusy(false)
    }
  }, [address, agreementId, busy, toast, refetchProfile, refetchAg])

  // Auto-advance relayer steps with slight delay for UX
  useEffect(() => {
    if (step === 'fund' && !busy && agreementId && !relayerFailed) {
      const t = setTimeout(handleFund, 1500)
      return () => clearTimeout(t)
    }
  }, [step, busy, agreementId, relayerFailed, handleFund])

  useEffect(() => {
    if (step === 'approve' && !busy && agreementId && !relayerFailed) {
      const t = setTimeout(handleApprove, 1500)
      return () => clearTimeout(t)
    }
  }, [step, busy, agreementId, relayerFailed, handleApprove])

  // --- Render ---

  // Mainnet: the hosted demo client is testnet-only. Show manual instructions.
  if (!hasRelayer) {
    const STEPS_MANUAL = [
      'Open TrustFlow in two browsers (or one normal plus one incognito) with different wallets.',
      'In wallet A, create an agreement and set wallet B’s address as the client.',
      'In wallet B, open the agreement link and fund it with QUSDC.',
      'In wallet A, complete a milestone.',
      'In wallet B, approve. Payment releases to A.',
    ]
    return (
      <PageWrapper className="max-w-2xl">
        <div className="card px-6 py-12">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-amber/15 text-accent-amber">
              <AlertCircle size={28} />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-text">
              Solo demo is testnet-only
            </h1>
            <p className="mt-3 max-w-md text-sm text-text-secondary">
              The solo demo uses a hosted client wallet, which is available on
              testnet only for security reasons. To try TrustFlow on mainnet, use
              two wallets:
            </p>
          </div>

          <ol className="mx-auto mt-6 max-w-lg space-y-3">
            {STEPS_MANUAL.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-primary/15 font-display text-sm font-bold text-brand-primary-light">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-sm text-text-secondary">{s}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActiveNetwork('testnet')}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-display text-sm font-semibold text-white transition-transform active:scale-[0.97]"
              style={{ background: 'var(--gradient-hero)' }}
            >
              Switch to Testnet <ArrowRight size={16} />
            </button>
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-6 py-3 font-display text-sm font-semibold text-text-secondary hover:text-text"
            >
              Create Real Agreement
            </Link>
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (!isConnected) {
    return (
      <PageWrapper className="max-w-xl">
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary-light">
            <PlayCircle size={28} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Solo Demo</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Experience the full freelancer payment cycle with an automated client. Connect your wallet to begin.
          </p>
          <button
            onClick={openConnectModal}
            className="mt-6 rounded-xl px-6 py-3 font-display text-sm font-semibold text-white"
            style={{ background: 'var(--gradient-hero)' }}
          >
            Connect Wallet
          </button>
          <Link href="/start" className="mt-3 text-sm text-text-dim hover:text-text-secondary">
            Need setup help? Start guide
          </Link>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="max-w-2xl">
      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1">
            <div
              className={cx(
                'h-1.5 flex-1 rounded-full transition-colors',
                i <= stepIndex ? 'bg-brand-primary' : 'bg-bg-subtle'
              )}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-text-dim">
        Step {stepIndex + 1} of {STEPS.length}: {STEP_META[step].label}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
          className="mt-8"
        >
          {/* INTRO */}
          {step === 'intro' && (
            <div className="card flex flex-col items-center px-6 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary-light">
                <Rocket size={28} />
              </span>
              <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-text">
                Solo Demo Mode
              </h1>
              <p className="mt-3 max-w-md text-sm text-text-secondary">
                You will act as a freelancer. An automated demo client wallet will fund your
                agreement and approve your work. No second wallet needed.
              </p>
              <div className="mt-4 rounded-xl bg-bg-subtle px-4 py-3 text-left text-sm">
                <p className="font-display font-semibold text-text">How it works:</p>
                <ol className="mt-2 space-y-1 text-text-secondary">
                  <li>1. You create an agreement (10 QUSDC)</li>
                  <li>2. Demo client auto-funds it</li>
                  <li>3. You mark the milestone complete</li>
                  <li>4. Demo client auto-approves</li>
                  <li>5. Payment releases, your trust score grows</li>
                </ol>
              </div>
              {balance !== undefined && balance < 1_000_000n && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-text-dim">You will need some QIE for gas fees.</p>
                </div>
              )}
              <button
                onClick={() => setStep('create')}
                className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-display text-sm font-semibold text-white transition-transform active:scale-[0.97]"
                style={{ background: 'var(--gradient-hero)' }}
              >
                Start Demo <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* CREATE */}
          {step === 'create' && (
            <div className="card flex flex-col items-center px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary-light">
                <FileCheck2 size={24} />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-text">
                Step 1: Create Agreement
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                You (the freelancer) create a 10 QUSDC agreement with the demo client.
              </p>
              <div className="mt-4 w-full max-w-sm rounded-xl bg-bg p-4 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-text-dim">Title</span>
                  <span className="text-text">Demo Agreement</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-text-dim">Milestone</span>
                  <span className="text-text">Demo Deliverable</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-text-dim">Amount</span>
                  <span className="font-mono text-text">10.00 QUSDC</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-text-dim">Client</span>
                  <span className="font-mono text-xs text-text-secondary">
                    {RELAYER_ADDRESS ? `${RELAYER_ADDRESS.slice(0, 8)}...${RELAYER_ADDRESS.slice(-6)}` : 'Not configured'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={busy}
                className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-display text-sm font-semibold text-white transition-transform active:scale-[0.97] disabled:opacity-60"
                style={{ background: 'var(--gradient-hero)' }}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <FileCheck2 size={16} />}
                {busy ? 'Waiting for wallet...' : 'Create Agreement'}
              </button>
            </div>
          )}

          {/* FUND (relayer auto-acts) */}
          {step === 'fund' && (
            <div className="card flex flex-col items-center px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                <Wallet size={24} />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-text">
                Step 2: Client Funds
              </h2>
              {relayerFailed ? (
                <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm">
                  <p className="flex items-center justify-center gap-2 text-danger">
                    <AlertCircle size={16} /> Demo client temporarily unavailable
                  </p>
                  <p className="mt-2 text-text-secondary">
                    You can complete this flow manually with a second wallet.
                    Import the test client key into MetaMask and fund the agreement at{' '}
                    <Link href={`/fund/${agreementId}`} className="text-brand-primary-light hover:underline">
                      /fund/{String(agreementId)}
                    </Link>
                  </p>
                </div>
              ) : (
                <>
                  <p className="mt-2 text-sm text-text-secondary">
                    The demo client is funding your agreement...
                  </p>
                  <Loader2 size={32} className="mt-6 animate-spin text-brand-primary" />
                </>
              )}
            </div>
          )}

          {/* COMPLETE */}
          {step === 'complete' && (
            <div className="card flex flex-col items-center px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <FileCheck2 size={24} />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-text">
                Step 3: Deliver Your Work
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Mark the milestone as complete. In a real scenario, you would attach a link to your deliverable.
              </p>
              {txHashes.fund && (
                <a
                  href={explorerTx(txHashes.fund)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-text-dim hover:text-brand-primary-light"
                >
                  <ExternalLink size={12} /> Funding tx: {txHashes.fund.slice(0, 10)}...
                </a>
              )}
              <button
                onClick={handleComplete}
                disabled={busy}
                className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-display text-sm font-semibold text-white transition-transform active:scale-[0.97] disabled:opacity-60"
                style={{ background: 'var(--gradient-hero)' }}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {busy ? 'Submitting...' : 'Mark Complete'}
              </button>
            </div>
          )}

          {/* APPROVE (relayer auto-acts) */}
          {step === 'approve' && (
            <div className="card flex flex-col items-center px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 size={24} />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-text">
                Step 4: Client Approves
              </h2>
              {relayerFailed ? (
                <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm">
                  <p className="flex items-center justify-center gap-2 text-danger">
                    <AlertCircle size={16} /> Demo client temporarily unavailable
                  </p>
                  <p className="mt-2 text-text-secondary">
                    You can approve manually from a second wallet at{' '}
                    <Link href={`/agreement/${agreementId}`} className="text-brand-primary-light hover:underline">
                      /agreement/{String(agreementId)}
                    </Link>
                  </p>
                </div>
              ) : (
                <>
                  <p className="mt-2 text-sm text-text-secondary">
                    The demo client is approving your milestone and releasing payment...
                  </p>
                  <Loader2 size={32} className="mt-6 animate-spin text-brand-primary" />
                </>
              )}
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div className="card flex flex-col items-center px-6 py-12 text-center">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success"
              >
                <Trophy size={32} />
              </motion.span>
              <h2 className="mt-5 font-display text-2xl font-bold text-text">
                Demo Complete!
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                You completed a full agreement cycle solo. Payment was released and your trust score updated.
              </p>

              <div className="mt-6 flex flex-col items-center gap-4">
                <AnimatedTrustRing score={score} size={140} startFromZero />
                <div className="flex items-center gap-2">
                  <TierBadge tier={tier} />
                  <span className="font-mono text-sm text-text-secondary">{score} points</span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {txHashes.create && (
                  <a href={explorerTx(txHashes.create)} target="_blank" rel="noreferrer" className="rounded-lg bg-bg px-3 py-2 font-mono text-xs text-text-dim hover:text-text-secondary">
                    Create tx ↗
                  </a>
                )}
                {txHashes.fund && (
                  <a href={explorerTx(txHashes.fund)} target="_blank" rel="noreferrer" className="rounded-lg bg-bg px-3 py-2 font-mono text-xs text-text-dim hover:text-text-secondary">
                    Fund tx ↗
                  </a>
                )}
                {txHashes.complete && (
                  <a href={explorerTx(txHashes.complete)} target="_blank" rel="noreferrer" className="rounded-lg bg-bg px-3 py-2 font-mono text-xs text-text-dim hover:text-text-secondary">
                    Complete tx ↗
                  </a>
                )}
                {txHashes.approve && (
                  <a href={explorerTx(txHashes.approve)} target="_blank" rel="noreferrer" className="rounded-lg bg-bg px-3 py-2 font-mono text-xs text-text-dim hover:text-text-secondary">
                    Approve tx ↗
                  </a>
                )}
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl px-5 py-3 font-display text-sm font-semibold text-white"
                  style={{ background: 'var(--gradient-hero)' }}
                >
                  Go to Dashboard <ArrowRight size={16} />
                </Link>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-5 py-3 font-display text-sm font-semibold text-text-secondary hover:text-text"
                >
                  Create Real Agreement
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </PageWrapper>
  )
}
