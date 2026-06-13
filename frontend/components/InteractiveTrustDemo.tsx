'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AnimatedTrustRing } from './AnimatedTrustRing'
import { TIERS, cx } from '@/lib/utils'

const SCENARIOS = [
  {
    label: 'Complete 1 small agreement ($500)',
    score: 105,
    explain:
      'One completed agreement adds 100 points, plus 5 for $500 in volume. You reach Newcomer with a track record forming.',
  },
  {
    label: 'Complete 5 agreements ($5,000 total)',
    score: 550,
    explain:
      'Five completed agreements (500) plus 50 for volume puts you at Trusted. The contract now releases 25% of each milestone upfront on funding.',
  },
  {
    label: 'Get QIE Pass verified',
    score: 750,
    explain:
      'QIE Pass verification adds a flat 200 point bonus on top of your activity. Verified identity is the fastest way to climb the tiers.',
  },
  {
    label: 'Reach Elite tier',
    score: 1000,
    explain:
      'Sustained agreements, volume, and verification push you to Elite. Elite users get auto-claim: get paid even if the client goes silent, 24h after delivery.',
  },
]

export function InteractiveTrustDemo() {
  const [active, setActive] = useState(1)
  const scenario = SCENARIOS[active]

  return (
    <div className="card p-6 sm:p-8">
      <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr]">
        <div className="flex justify-center">
          <AnimatedTrustRing score={scenario.score} size={220} demoMode startFromZero={false} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-text-dim">
            Simulate a scenario
          </p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {SCENARIOS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setActive(i)}
                className={cx(
                  'rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all active:scale-[0.98]',
                  i === active
                    ? 'border-brand-primary bg-brand-primary/10 text-text'
                    : 'border-border bg-bg-subtle text-text-secondary hover:border-border-strong hover:text-text'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <motion.p
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-5 text-[15px] leading-relaxed text-text-secondary"
          >
            {scenario.explain}
          </motion.p>
        </div>
      </div>

      {/* Tier table */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-text-dim">
              <th className="py-2 pr-4 font-medium">Tier</th>
              <th className="py-2 pr-4 font-medium">Score</th>
              <th className="py-2 font-medium">Unlocks</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((t) => (
              <tr key={t.id} className="border-b border-border/50">
                <td className="py-2.5 pr-4">
                  <span className="font-display font-semibold" style={{ color: t.color }}>
                    {t.name}
                  </span>
                </td>
                <td className="py-2.5 pr-4 font-mono text-text-secondary">{t.range}</td>
                <td className="py-2.5 text-text-secondary">{t.benefits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
