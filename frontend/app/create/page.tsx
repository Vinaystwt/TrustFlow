'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Plus, Trash2, Info } from 'lucide-react'
import type { Address } from 'viem'
import { PageWrapper } from '@/components/PageWrapper'
import { TransactionButton } from '@/components/TransactionButton'
import { useToast } from '@/components/Toast'
import { useCreateAgreement } from '@/hooks/useTrustFlow'
import {
  isValidAddress,
  parseQUSDC,
  friendlyError,
} from '@/lib/utils'

interface MilestoneRow {
  name: string
  amount: string
}

export default function CreatePage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { toast } = useToast()
  const { create, status } = useCreateAgreement()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [client, setClient] = useState('')
  const [domain, setDomain] = useState('')
  const [milestones, setMilestones] = useState<MilestoneRow[]>([
    { name: '', amount: '' },
  ])
  const [touched, setTouched] = useState(false)

  const total = useMemo(
    () =>
      milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0),
    [milestones]
  )

  const clientError =
    client.length > 0 && !isValidAddress(client)
      ? 'Enter a valid 0x address'
      : client.toLowerCase() === address?.toLowerCase()
        ? 'Client must differ from your address'
        : ''

  const milestonesValid = milestones.every(
    (m) => m.name.trim() && parseFloat(m.amount) >= 1
  )
  const formValid =
    title.trim().length > 0 &&
    isValidAddress(client) &&
    !clientError &&
    milestonesValid

  const addMilestone = () => {
    if (milestones.length >= 10) return
    setMilestones([...milestones, { name: '', amount: '' }])
  }
  const removeMilestone = (i: number) => {
    if (milestones.length <= 1) return
    setMilestones(milestones.filter((_, idx) => idx !== i))
  }
  const updateMilestone = (i: number, field: keyof MilestoneRow, v: string) => {
    setMilestones(
      milestones.map((m, idx) => (idx === i ? { ...m, [field]: v } : m))
    )
  }

  const onSubmit = async () => {
    setTouched(true)
    if (!formValid) return
    const loadingId = toast({ type: 'loading', message: 'Waiting for wallet…' })
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
      if (agreementId !== undefined) {
        router.push(`/agreement/${agreementId}`)
      } else {
        router.push('/dashboard')
      }
    } catch (e) {
      toast({ type: 'error', message: friendlyError(e) })
    } finally {
      // loading toast auto-replaced; dismiss handled by 5s for others
      void loadingId
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (mounted && !isConnected) {
    return (
      <PageWrapper className="max-w-xl">
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <h1 className="font-display text-2xl font-bold tracking-display-md">
            Create an agreement
          </h1>
          <p className="mt-2 text-sm text-trust-text-secondary">
            Connect your wallet to create a milestone payment agreement.
          </p>
          <button
            onClick={openConnectModal}
            className="mt-6 rounded-xl bg-trust-accent px-6 py-3 font-display text-sm font-semibold text-white hover:bg-trust-accent-hover"
          >
            Connect Wallet
          </button>
        </div>
      </PageWrapper>
    )
  }

  const labelCls =
    'block font-body text-sm font-medium text-trust-text-secondary'
  const inputCls =
    'mt-1.5 w-full rounded-xl border border-trust-border bg-trust-base px-3.5 py-2.5 text-sm text-trust-text outline-none transition-colors placeholder:text-trust-text-dim focus:border-trust-accent'

  return (
    <PageWrapper className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold tracking-display-md text-trust-text">
        Create Agreement
      </h1>
      <p className="mt-1 text-sm text-trust-text-secondary">
        Define milestones and invite your client to fund the work.
      </p>

      <div className="mt-6 space-y-5">
        <div className="card p-5">
          <label className={labelCls}>
            Agreement Title
            <input
              className={inputCls}
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Logo Design Package"
            />
          </label>

          <label className={`${labelCls} mt-4`}>
            Description
            <textarea
              className={`${inputCls} min-h-[90px] resize-y`}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scope of work…"
            />
            <span className="mt-1 block text-right text-xs text-trust-text-dim">
              {description.length}/500
            </span>
          </label>

          <label className={`${labelCls} mt-2`}>
            Client Wallet Address
            <input
              className={inputCls}
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
            />
          </label>
          {clientError && (
            <p className="mt-1 text-xs text-trust-danger">{clientError}</p>
          )}

          <label className={`${labelCls} mt-4`}>
            Your QIE Domain <span className="text-trust-text-dim">(optional)</span>
            <input
              className={inputCls}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g., priya.qie"
            />
          </label>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold tracking-display-md text-trust-text">
              Milestones
            </h2>
            <span className="text-xs text-trust-text-dim">
              {milestones.length}/10
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    className={inputCls}
                    value={m.name}
                    onChange={(e) => updateMilestone(i, 'name', e.target.value)}
                    placeholder={`Milestone ${i + 1} name`}
                  />
                </div>
                <div className="relative w-36">
                  <input
                    type="number"
                    min={1}
                    className={`${inputCls} pr-16`}
                    value={m.amount}
                    onChange={(e) =>
                      updateMilestone(i, 'amount', e.target.value)
                    }
                    placeholder="0"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-trust-text-dim">
                    QUSDC
                  </span>
                </div>
                {milestones.length > 1 && (
                  <button
                    onClick={() => removeMilestone(i)}
                    className="mt-2.5 text-trust-text-dim transition-colors hover:text-trust-danger"
                    aria-label="Remove milestone"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addMilestone}
            disabled={milestones.length >= 10}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-trust-border px-3 py-2 font-display text-xs font-semibold text-trust-text-secondary transition-colors hover:border-trust-accent/40 hover:text-trust-text disabled:opacity-40"
          >
            <Plus size={14} /> Add Milestone
          </button>
        </div>

        {/* Summary */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-trust-text-secondary">Total amount</span>
            <span className="font-mono text-lg text-trust-text">
              {total.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              QUSDC
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-trust-text-secondary">Milestones</span>
            <span className="font-mono text-sm text-trust-text">
              {milestones.length}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-trust-progress/10 px-3 py-2 text-xs text-trust-progress">
            <Info size={14} />
            +100 Trust points on completion
          </div>
        </div>

        {touched && !formValid && (
          <p className="text-xs text-trust-danger">
            Fill in a title, a valid client address, and complete every milestone
            (min 1 QUSDC each).
          </p>
        )}

        <TransactionButton
          state={status === 'loading' ? 'loading' : 'idle'}
          loadingLabel="Creating…"
          onClick={onSubmit}
          disabled={touched && !formValid}
          className="w-full"
        >
          Create Agreement
        </TransactionButton>
      </div>
    </PageWrapper>
  )
}
