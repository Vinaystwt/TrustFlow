'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { useActiveNetwork } from '@/hooks/useActiveNetwork'
import { NETWORKS, type NetworkKey } from '@/lib/chains'
import { cx } from '@/lib/utils'

const OPTIONS: {
  key: NetworkKey
  name: string
  badge: string
  color: string
}[] = [
  { key: 'mainnet', name: 'QIE Mainnet', badge: 'Live', color: '#10B981' },
  { key: 'testnet', name: 'QIE Testnet', badge: 'Testnet', color: '#F59E0B' },
]

export function NetworkSwitcher({
  className,
  block = false,
}: {
  className?: string
  block?: boolean
}) {
  const { activeNetwork, setActiveNetwork } = useActiveNetwork()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = OPTIONS.find((o) => o.key === activeNetwork) ?? OPTIONS[0]

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const select = (key: NetworkKey) => {
    if (key !== activeNetwork) setActiveNetwork(key)
    setOpen(false)
  }

  return (
    <div ref={ref} className={cx('relative', block && 'w-full', className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cx(
          'inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 font-display text-xs font-semibold text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-text',
          block && 'w-full justify-between'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: current.color }} />
          {current.name}
        </span>
        <ChevronDown size={14} className={cx('transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cx(
              'absolute right-0 z-50 mt-2 min-w-[210px] overflow-hidden rounded-xl border border-border bg-bg-elevated p-1 shadow-lift',
              block && 'left-0 right-auto w-full'
            )}
            role="listbox"
          >
            {OPTIONS.map((o) => {
              const active = o.key === activeNetwork
              return (
                <li key={o.key}>
                  <button
                    onClick={() => select(o.key)}
                    className={cx(
                      'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-bg-subtle',
                      active ? 'text-text' : 'text-text-secondary'
                    )}
                    role="option"
                    aria-selected={active}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: o.color }} />
                      <span className="font-display font-semibold">{o.name}</span>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: `${o.color}1F`, color: o.color }}
                      >
                        {o.badge}
                      </span>
                    </span>
                    {active && <Check size={14} className="text-brand-primary-light" />}
                  </button>
                  <p className="px-3 pb-1 text-[10px] text-text-dim">
                    Chain {NETWORKS[o.key].chainId}
                  </p>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
