'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Check } from 'lucide-react'
import { cx } from '@/lib/utils'

export type TxState = 'idle' | 'loading' | 'success' | 'error'

export function TransactionButton({
  state = 'idle',
  onClick,
  disabled,
  children,
  loadingLabel,
  variant = 'primary',
  type = 'button',
  className,
}: {
  state?: TxState
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
  loadingLabel?: string
  variant?: 'primary' | 'danger' | 'ghost'
  type?: 'button' | 'submit'
  className?: string
}) {
  const isBusy = state === 'loading'
  const isDisabled = disabled || isBusy

  const variants: Record<string, string> = {
    primary:
      'bg-trust-accent text-white hover:bg-trust-accent-hover disabled:bg-trust-accent/40',
    danger:
      'bg-trust-danger/15 text-trust-danger border border-trust-danger/40 hover:bg-trust-danger/25 disabled:opacity-40',
    ghost:
      'bg-trust-surface-hover text-trust-text border border-trust-border hover:border-trust-accent/40 disabled:opacity-40',
  }

  return (
    <motion.button
      type={type}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={isDisabled}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-display text-sm font-semibold transition-colors disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
    >
      {state === 'loading' && <Loader2 size={16} className="animate-spin" />}
      {state === 'success' && <Check size={16} />}
      <span>{isBusy && loadingLabel ? loadingLabel : children}</span>
    </motion.button>
  )
}
