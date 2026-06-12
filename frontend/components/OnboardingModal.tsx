'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { BadgeCheck, FilePlus2, Trophy, ArrowRight, X } from 'lucide-react'
import { LogoAnimated } from './Logo'

const QIE_PASS_URL = 'https://www.qie.digital'

export function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)

  const finish = () => {
    try {
      window.localStorage.setItem('trustflow_onboarded', 'true')
    } catch {
      /* storage unavailable */
    }
    onClose()
  }

  const steps = [
    {
      icon: <LogoAnimated size="xl" />,
      title: 'Welcome to TrustFlow',
      body: "Let's set up your reputation. Every payment you complete builds an on-chain Trust Score you own.",
      primary: { label: 'Get started', action: () => setStep(1) },
      secondary: null,
    },
    {
      icon: (
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success">
          <BadgeCheck size={32} />
        </span>
      ),
      title: 'Verify your identity',
      body: 'Get QIE Pass verified for a +200 trust score bonus. Verified identity is the fastest way to climb the tiers.',
      primary: {
        label: 'Verify Now',
        action: () => {
          window.open(QIE_PASS_URL, '_blank')
          setStep(2)
        },
      },
      secondary: { label: 'Skip for now', action: () => setStep(2) },
    },
    {
      icon: (
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary-light">
          <FilePlus2 size={32} />
        </span>
      ),
      title: 'Create your first agreement',
      body: 'Start building your credit. Define milestones, share the funding link, and get paid as you deliver.',
      primary: { label: 'Create Agreement', href: '/create', action: finish },
      secondary: { label: 'Browse Leaderboard', href: '/leaderboard', action: finish },
    },
  ]

  const s = steps[step]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="card relative w-full max-w-md p-8 text-center"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <button
            onClick={finish}
            className="absolute right-4 top-4 text-text-dim hover:text-text"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex justify-center">{s.icon}</div>
          <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-text">
            {s.title}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
            {s.body}
          </p>

          <div className="mt-7 flex flex-col gap-2.5">
            {s.primary.href ? (
              <Link
                href={s.primary.href}
                onClick={s.primary.action}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-display text-sm font-semibold text-white"
                style={{ background: 'var(--gradient-hero)' }}
              >
                {s.primary.label} <ArrowRight size={16} />
              </Link>
            ) : (
              <button
                onClick={s.primary.action}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-display text-sm font-semibold text-white"
                style={{ background: 'var(--gradient-hero)' }}
              >
                {s.primary.label} <ArrowRight size={16} />
              </button>
            )}
            {s.secondary &&
              (s.secondary.href ? (
                <Link
                  href={s.secondary.href}
                  onClick={s.secondary.action}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 font-display text-sm font-semibold text-text-secondary hover:text-text"
                >
                  <Trophy size={15} /> {s.secondary.label}
                </Link>
              ) : (
                <button
                  onClick={s.secondary.action}
                  className="rounded-xl px-5 py-2.5 font-display text-sm font-semibold text-text-secondary hover:text-text"
                >
                  {s.secondary.label}
                </button>
              ))}
          </div>

          <div className="mt-6 flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === step ? 20 : 6,
                  backgroundColor: i === step ? '#6366F1' : '#242C45',
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
