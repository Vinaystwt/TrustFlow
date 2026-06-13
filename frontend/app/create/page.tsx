'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2, Info, ArrowRight, ArrowLeft, Check, ShieldCheck } from 'lucide-react'
import type { Address } from 'viem'
import { PageWrapper } from '@/components/PageWrapper'
import { TransactionButton } from '@/components/TransactionButton'
import { Avatar } from '@/components/Avatar'
import { useToast } from '@/components/Toast'
import { useCreateAgreement, useGetEnforcedTerms } from '@/hooks/useTrustFlow'
import {
  isValidAddress,
  parseQUSDC,
  friendlyError,
  truncateAddress,
  enforcedTermsSummary,
  cx,
} from '@/lib/utils'

interface MilestoneRow {
  name: string
  amount: string
}

const STEPS = ['Details', 'Milestones', 'Review']

export default function CreatePage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { toast } = useToast()
  const { create, status } = useCreateAgreement()
  const { terms: myTerms } = useGetEnforcedTerms(address)
  const myTier = myTerms?.tier ?? 0

  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [client, setClient] = useState('')
  const [domain, setDomain] = useState('')
  const [milestones, setMilestones] = useState<MilestoneRow[]>([{ name: '', amount: '' }])

  const total = useMemo(
    () => milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0),
    [milestones]
  )

  const clientError =
    client.length > 0 && !isValidAddress(client)
      ? 'Enter a valid 0x address'
      : client.toLowerCase() === address?.toLowerCase()
        ? 'Client must differ from your address'
        : ''

  const step1Valid = title.trim().length > 0 && isValidAddress(client) && !clientError
  const step2Valid = milestones.every((m) => m.name.trim() && parseFloat(m.amount) >= 1)
  const formValid = step1Valid && step2Valid

  const addMilestone = () => {
    if (milestones.length >= 10) return
    setMilestones([...milestones, { name: '', amount: '' }])
  }
  const removeMilestone = (i: number) => {
    if (milestones.length <= 1) return
    setMilestones(milestones.filter((_, idx) => idx !== i))
  }
  const updateMilestone = (i: number, field: keyof MilestoneRow, v: string) =>
    setMilestones(milestones.map((m, idx) => (idx === i ? { ...m, [field]: v } : m)))

  const onSubmit = async () => {
    if (!formValid) return
    toast({ type: 'loading', message: 'Waiting for wallet…' })
    try {
      const { agreementId } = await create({
        title: title.trim(),
        description: description.trim(),
        client: client as Address,
        names: milestones.map((m) => m.name.trim()),
        amounts: milestones.map((m) => parseQUSDC(m.amount)),
        domain: domain.trim(),
      })
      toast({ type: 'success', message: 'Agreement created!' })
      router.push(agreementId !== undefined ? `/agreement/${agreementId}` : '/dashboard')
    } catch (e) {
      toast({ type: 'error', message: friendlyError(e) })
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (mounted && !isConnected) {
    return (
      <PageWrapper className="max-w-xl">
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight">Create an agreement</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Connect your wallet to create a milestone payment agreement.
          </p>
          <button
            onClick={openConnectModal}
            className="mt-6 rounded-xl px-6 py-3 font-display text-sm font-semibold text-white"
            style={{ background: 'var(--gradient-hero)' }}
          >
            Connect Wallet
          </button>
        </div>
      </PageWrapper>
    )
  }

  const labelCls = 'block font-body text-sm font-medium text-text-secondary'
  const inputCls =
    'mt-1.5 w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-text-dim focus:border-brand-primary'

  return (
    <PageWrapper className="max-w-5xl">
      <h1 className="font-display text-3xl font-bold tracking-tight text-text">Create Agreement</h1>
      <p className="mt-1 text-text-secondary">Define milestones and invite your client to fund the work.</p>

      {/* Progress */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cx(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold transition-colors',
                i < step ? 'bg-success text-white' : i === step ? 'text-white' : 'bg-bg-subtle text-text-dim'
              )}
              style={i === step ? { background: 'var(--gradient-hero)' } : {}}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </span>
            <span className={cx('text-sm font-medium', i === step ? 'text-text' : 'text-text-dim')}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Form */}
        <div className="card p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <label className={labelCls}>
                    Agreement Title
                    <input className={inputCls} maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Logo Design Package" />
                  </label>
                  <label className={labelCls}>
                    Description
                    <textarea className={`${inputCls} min-h-[90px] resize-y`} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the scope of work…" />
                  </label>
                  <div>
                    <label className={labelCls}>
                      Client Wallet Address
                      <input className={inputCls} value={client} onChange={(e) => setClient(e.target.value)} placeholder="0x…" spellCheck={false} />
                    </label>
                    {clientError && <p className="mt-1 text-xs text-danger">{clientError}</p>}
                  </div>
                  <label className={labelCls}>
                    Your QIE Domain <span className="text-text-dim">(optional)</span>
                    <input className={inputCls} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g., priya.qie" />
                  </label>
                </div>
              )}

              {step === 1 && (
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-semibold text-text">Milestones</h2>
                    <span className="text-xs text-text-dim">{milestones.length}/10</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {milestones.map((m, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <input className={`${inputCls} flex-1`} value={m.name} onChange={(e) => updateMilestone(i, 'name', e.target.value)} placeholder={`Milestone ${i + 1} name`} />
                        <div className="relative w-36">
                          <input type="number" min={1} className={`${inputCls} pr-16`} value={m.amount} onChange={(e) => updateMilestone(i, 'amount', e.target.value)} placeholder="0" />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-text-dim">QUSDC</span>
                        </div>
                        {milestones.length > 1 && (
                          <button onClick={() => removeMilestone(i)} className="mt-2.5 text-text-dim hover:text-danger" aria-label="Remove">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addMilestone}
                    disabled={milestones.length >= 10}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-display text-xs font-semibold text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-text disabled:opacity-40"
                  >
                    <Plus size={14} /> Add Milestone
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-display text-base font-semibold text-text">Review &amp; create</h2>
                  <div className="rounded-xl bg-bg p-4">
                    <p className="font-display text-lg font-bold text-text">{title || 'Untitled'}</p>
                    {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
                    <div className="mt-3 text-sm text-text-secondary">
                      Client: <span className="font-mono text-text">{truncateAddress(client)}</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-bg p-4">
                    {milestones.map((m, i) => (
                      <div key={i} className="flex items-center justify-between py-1 text-sm">
                        <span className="text-text-secondary">{m.name || `Milestone ${i + 1}`}</span>
                        <span className="font-mono text-text">{(parseFloat(m.amount) || 0).toFixed(2)} QUSDC</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-brand-primary/25 bg-brand-primary/10 p-4">
                    <p className="flex items-center gap-1.5 font-display text-sm font-semibold text-brand-primary-light">
                      <ShieldCheck size={15} /> Your enforced terms
                      {myTerms ? ` · ${myTerms.tierName} (Tier ${myTier})` : ''}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      Based on your current trust tier, agreements your client funds will use these on-chain rules:
                    </p>
                    <p className="mt-1.5 text-xs text-text">{enforcedTermsSummary(myTier)}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
                    <Info size={14} /> +100 Trust points on completion
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-display text-sm font-semibold text-text-secondary transition-colors hover:text-text disabled:opacity-30"
            >
              <ArrowLeft size={16} /> Back
            </button>
            {step < 2 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={(step === 0 && !step1Valid) || (step === 1 && !step2Valid)}
                className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 font-display text-sm font-semibold text-white transition-transform active:scale-[0.97] disabled:opacity-40"
                style={{ background: 'var(--gradient-hero)' }}
              >
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <TransactionButton state={status === 'loading' ? 'loading' : 'idle'} loadingLabel="Creating…" onClick={onSubmit} disabled={!formValid}>
                Create Agreement
              </TransactionButton>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-dim">Live preview</p>
          <div className="card p-5">
            <div className="flex items-center gap-2.5">
              <Avatar address={client || address} size={36} />
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold text-text">{title || 'Agreement title'}</p>
                <p className="text-xs text-text-secondary">
                  with {client && isValidAddress(client) ? truncateAddress(client) : 'client address'}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{m.name || `Milestone ${i + 1}`}</span>
                  <span className="font-mono text-text">{(parseFloat(m.amount) || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="font-display font-semibold text-text">Total</span>
              <span className="font-mono text-lg text-text">{total.toFixed(2)} QUSDC</span>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
