'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import {
  Globe,
  Fuel,
  Droplets,
  Wallet,
  PlayCircle,
  Check,
  ExternalLink,
  ArrowRight,
  Rocket,
} from 'lucide-react'
import { PageWrapper } from '@/components/PageWrapper'
import { AddNetworkButton } from '@/components/AddNetworkButton'
import { FaucetButton, AddTokenButton } from '@/components/FaucetButton'
import { useQUSDCBalance } from '@/hooks/useTrustFlow'
import { cx } from '@/lib/utils'

interface Step {
  id: string
  icon: typeof Globe
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    id: 'network',
    icon: Globe,
    title: 'Add QIE Testnet',
    description: 'Add the QIE test network to your wallet so you can interact with TrustFlow.',
  },
  {
    id: 'gas',
    icon: Fuel,
    title: 'Get testnet QIE (gas)',
    description: 'You need a small amount of QIE to pay transaction fees. Free from the faucet.',
  },
  {
    id: 'qusdc',
    icon: Droplets,
    title: 'Get test QUSDC',
    description: 'Mint test stablecoins to your wallet. These are the tokens used for payments.',
  },
  {
    id: 'token',
    icon: Wallet,
    title: 'Add QUSDC to your wallet',
    description: 'Import the QUSDC token so your balance shows in MetaMask.',
  },
  {
    id: 'demo',
    icon: PlayCircle,
    title: 'Try a solo demo',
    description: 'Run through a complete freelancer payment cycle. An automated client funds and approves for you.',
  },
]

export default function StartPage() {
  const { isConnected, chainId } = useAccount()
  const { address } = useAccount()
  const { balance } = useQUSDCBalance(address)

  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  const markDone = (id: string) => setCompleted((prev) => ({ ...prev, [id]: true }))

  // Auto-detect completion
  useEffect(() => {
    if (isConnected && chainId === 1983) {
      markDone('network')
    }
  }, [isConnected, chainId])

  useEffect(() => {
    if (balance !== undefined && balance > 0n) {
      markDone('qusdc')
    }
  }, [balance])

  const completedCount = Object.values(completed).filter(Boolean).length

  return (
    <PageWrapper className="max-w-2xl">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary-light">
            <Rocket size={28} />
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-text">
            Get Started with TrustFlow
          </h1>
          <p className="mt-2 text-text-secondary">
            Five steps to your first on-chain payment agreement. Takes about 3 minutes.
          </p>
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-bg-subtle px-4 py-1.5 text-sm text-text-secondary">
              <span className="font-mono font-semibold text-brand-primary-light">{completedCount}/{STEPS.length}</span>
              steps complete
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-10 space-y-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          const done = completed[step.id]
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className={cx(
                'card p-5 transition-colors',
                done && 'border-success/25 bg-success/5'
              )}
            >
              <div className="flex items-start gap-4">
                <span
                  className={cx(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    done
                      ? 'bg-success/15 text-success'
                      : 'bg-brand-primary/15 text-brand-primary-light'
                  )}
                >
                  {done ? <Check size={20} /> : <Icon size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-text-dim">Step {i + 1}</span>
                    {done && (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                        DONE
                      </span>
                    )}
                  </div>
                  <h3 className="mt-0.5 font-display text-base font-semibold text-text">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">{step.description}</p>

                  <div className="mt-3">
                    {step.id === 'network' && !done && <AddNetworkButton />}
                    {step.id === 'network' && done && (
                      <p className="text-sm text-success">QIE Testnet connected.</p>
                    )}

                    {step.id === 'gas' && (
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href="https://www.qie.digital/faucet"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 font-display text-sm font-semibold text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-text"
                          onClick={() => markDone('gas')}
                        >
                          <ExternalLink size={15} /> Open QIE Faucet
                        </a>
                        <span className="text-xs text-text-dim">
                          Request testnet QIE, then return here
                        </span>
                      </div>
                    )}

                    {step.id === 'qusdc' && !done && <FaucetButton />}
                    {step.id === 'qusdc' && done && (
                      <p className="text-sm text-success">Test QUSDC in your wallet.</p>
                    )}

                    {step.id === 'token' && !done && (
                      <AddTokenButton />
                    )}
                    {step.id === 'token' && done && (
                      <p className="text-sm text-success">QUSDC visible in your wallet.</p>
                    )}

                    {step.id === 'demo' && (
                      <Link
                        href="/demo"
                        className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 font-display text-sm font-semibold text-white transition-transform active:scale-[0.97]"
                        style={{ background: 'var(--gradient-hero)' }}
                      >
                        Start Solo Demo <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {completedCount >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-text-secondary">Ready to explore on your own?</p>
          <div className="mt-3 flex justify-center gap-3">
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 font-display text-sm font-semibold text-text-secondary hover:text-text"
            >
              Create Agreement
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-display text-sm font-semibold text-white"
              style={{ background: 'var(--gradient-hero)' }}
            >
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      )}
    </PageWrapper>
  )
}
