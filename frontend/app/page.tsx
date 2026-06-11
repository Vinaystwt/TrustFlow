'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Shield, TrendingUp, Zap, ArrowRight } from 'lucide-react'

const container = { animate: { transition: { staggerChildren: 0.08 } } }
const item = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const VALUE_PROPS = [
  {
    icon: Shield,
    title: 'Identity verified',
    body: 'Both parties verified via QIE Pass',
  },
  {
    icon: TrendingUp,
    title: 'Progressive trust',
    body: 'Reputation improves with every payment',
  },
  {
    icon: Zap,
    title: 'Instant settlement',
    body: 'Milestone approved, payment released',
  },
]

export default function LandingPage() {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4.25rem)] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-trust-accent/15 text-trust-accent">
            <Shield size={26} />
          </span>
          <h1 className="font-display text-4xl font-bold tracking-display-lg text-trust-text sm:text-5xl">
            TrustFlow
          </h1>
        </div>

        <p className="mt-6 font-display text-2xl font-semibold tracking-display-md text-trust-text sm:text-3xl">
          Payments that build credit
        </p>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-trust-text-secondary">
          Create milestone payment agreements on QIE Blockchain. Every completed
          payment builds your on-chain Trust Score. Higher scores unlock better
          financial terms.
        </p>

        <div className="mt-8">
          {isConnected ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-trust-accent px-7 py-3.5 font-display text-base font-semibold text-white transition-colors hover:bg-trust-accent-hover"
            >
              Go to Dashboard <ArrowRight size={18} />
            </Link>
          ) : (
            <button
              onClick={openConnectModal}
              className="inline-flex items-center gap-2 rounded-xl bg-trust-accent px-7 py-3.5 font-display text-base font-semibold text-white transition-colors hover:bg-trust-accent-hover"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </motion.div>

      <motion.div
        variants={container}
        initial="initial"
        animate="animate"
        className="mt-16 grid w-full gap-4 sm:grid-cols-3"
      >
        {VALUE_PROPS.map((vp) => {
          const Icon = vp.icon
          return (
            <motion.div
              key={vp.title}
              variants={item}
              whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(59,130,246,0.08)' }}
              className="card p-6 text-left"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-trust-accent/15 text-trust-accent">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold tracking-display-md text-trust-text">
                {vp.title}
              </h3>
              <p className="mt-1.5 text-sm text-trust-text-secondary">{vp.body}</p>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
