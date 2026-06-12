import { ReactNode } from 'react'
import { cx } from '@/lib/utils'

export function GradientText({
  children,
  variant = 'hero',
  animated = false,
  className,
}: {
  children: ReactNode
  variant?: 'hero' | 'trust'
  animated?: boolean
  className?: string
}) {
  return (
    <span
      className={cx(
        variant === 'trust' ? 'gradient-text-trust' : 'gradient-text',
        animated && 'gradient-text-animated',
        className
      )}
    >
      {children}
    </span>
  )
}
