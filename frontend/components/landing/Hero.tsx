'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { AnimatedTrustRing } from '@/components/AnimatedTrustRing'
import { GradientText } from '@/components/GradientText'
import { TIERS, cx } from '@/lib/utils'

const FLOATERS = [
  { label: 'Milestone approved', amount: '+$500 QUSDC', top: '6%', left: '-8%', delay: 0 },
  { label: 'Trust score +100', amount: 'Tier up: Trusted', top: '70%', left: '-14%', delay: 1.2 },
  { label: 'Agreement completed', amount: 'Logo Design', top: '40%', left: '78%', delay: 0.6 },
]

export function Hero() {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  return (
    <section className="relative overflow-hidden bg-gradient-section-1">
      <div className="mx-auto grid min-h-[90vh] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="eyebrow">Built on QIE Blockchain</p>
          <h1
            className="mt-5 font-display font-bold text-text"
            style={{ fontSize: 'clamp(48px, 8vw, 92px)', lineHeight: 1.02, letterSpacing: '-0.04em' }}
          >
            Payments that build{' '}
            <GradientText animated>credit.</GradientText>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary sm:text-xl">
            Create milestone payment agreements. Every completed payment builds
            your on-chain Trust Score. Higher scores unlock better financial
            terms.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {isConnected ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-display text-base font-semibold text-white transition-transform active:scale-[0.97]"
                style={{ background: 'var(--gradient-hero)' }}
              >
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <button
                onClick={openConnectModal}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-display text-base font-semibold text-white transition-transform active:scale-[0.97]"
                style={{ background: 'var(--gradient-hero)' }}
              >
                Connect Wallet
              </button>
            )}
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-xl border border-border-strong px-6 py-3.5 font-display text-base font-semibold text-text transition-colors hover:border-brand-primary/50"
            >
              Try Demo <ArrowRight size={18} />
            </Link>
          </div>

          <p className="mt-5 text-sm text-text-dim">
            No fees during beta · Live on QIE testnet ·{' '}
            <Link href="/start" className="text-brand-primary-light hover:underline">
              New here? Start guide
            </Link>
          </p>
        </motion.div>

        {/* Right */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          className="relative flex flex-col items-center"
        >
          <div className="relative">
            <AnimatedTrustRing score={750} size={320} startFromZero />
            {FLOATERS.map((f) => (
              <motion.div
                key={f.label}
                className="absolute hidden w-max rounded-xl border border-border bg-bg-elevated/90 px-3 py-2 shadow-lift backdrop-blur sm:block"
                style={{ top: f.top, left: f.left }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: f.delay }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-success" />
                  <div>
                    <p className="text-xs font-semibold text-text">{f.label}</p>
                    <p className="font-mono text-[11px] text-text-secondary">{f.amount}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {TIERS.map((t, i) => (
              <div key={t.id} className="flex items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 font-display text-xs font-semibold"
                  style={{
                    backgroundColor: `${t.color}1F`,
                    color: t.color,
                    boxShadow: t.id === 3 ? `0 0 0 2px ${t.color}` : undefined,
                  }}
                >
                  {t.name}
                </span>
                {i < TIERS.length - 1 && <ArrowRight size={12} className="text-text-dim" />}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
