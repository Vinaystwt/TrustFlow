'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'

export function CTASection() {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  return (
    <section className="relative overflow-hidden px-4 py-28 sm:px-6 sm:py-36">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{ background: 'var(--gradient-hero)' }}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true, margin: '-100px' }}
        className="relative mx-auto max-w-3xl text-center"
      >
        <h2
          className="font-display font-bold tracking-tight text-text"
          style={{ fontSize: 'clamp(36px, 6vw, 64px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          Start building your on-chain credit today.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-text-secondary sm:text-xl">
          Free during beta. No setup. No KYC. Just connect your wallet.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {isConnected ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-4 font-display text-base font-semibold text-white transition-transform active:scale-[0.97]"
              style={{ background: 'var(--gradient-hero)' }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <button
              onClick={openConnectModal}
              className="inline-flex items-center gap-2 rounded-xl px-7 py-4 font-display text-base font-semibold text-white transition-transform active:scale-[0.97]"
              style={{ background: 'var(--gradient-hero)' }}
            >
              Connect Wallet
            </button>
          )}
          <Link
            href="/docs"
            className="font-display text-base font-semibold text-text-secondary transition-colors hover:text-text"
          >
            Read the docs →
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
