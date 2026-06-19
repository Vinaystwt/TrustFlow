'use client'

import { ArrowLeftRight, ExternalLink } from 'lucide-react'
import { useQIEPrice } from '@/hooks/useQIEPrice'
import { cx } from '@/lib/utils'

/**
 * Live QIE price from the QIEDEX router (mainnet only).
 * Renders nothing on testnet or when no price is available.
 */
export function QIEPriceTicker({ className }: { className?: string }) {
  const { price } = useQIEPrice()

  if (!price) return null

  return (
    <a
      href="https://www.dex.qie.digital"
      target="_blank"
      rel="noreferrer"
      className={cx(
        'group inline-flex items-center gap-2.5 rounded-xl border border-border bg-bg-elevated/60 px-4 py-2.5 transition-colors hover:border-brand-primary/40',
        className
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-amber/15 text-accent-amber">
        <ArrowLeftRight size={15} />
      </span>
      <span className="text-left">
        <span className="flex items-center gap-1.5 font-display text-sm font-bold text-text">
          1 QIE ≈ {price.display}
          <ExternalLink size={12} className="text-text-dim transition-colors group-hover:text-brand-primary-light" />
        </span>
        <span className="text-[11px] text-text-dim">via QIEDEX</span>
      </span>
    </a>
  )
}
