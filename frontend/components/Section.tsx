import { ReactNode } from 'react'
import { cx } from '@/lib/utils'

const BG: Record<string, string> = {
  none: '',
  one: 'bg-gradient-section-1',
  two: 'bg-gradient-section-2',
  three: 'bg-gradient-section-3',
}

export function Section({
  children,
  bg = 'none',
  id,
  className,
  inner = 'max-w-7xl',
}: {
  children: ReactNode
  bg?: 'none' | 'one' | 'two' | 'three'
  id?: string
  className?: string
  inner?: string
}) {
  return (
    <section
      id={id}
      className={cx('relative px-4 py-20 sm:px-6 sm:py-28 lg:py-32', BG[bg], className)}
    >
      <div className={cx('mx-auto w-full', inner)}>{children}</div>
    </section>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow mb-4">{children}</p>
}

export function SectionTitle({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h2
      className={cx(
        'font-display font-bold tracking-tight text-text',
        'text-4xl sm:text-5xl lg:text-[56px] lg:leading-[1.05]',
        className
      )}
      style={{ letterSpacing: '-0.03em' }}
    >
      {children}
    </h2>
  )
}

export function SectionSub({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl">
      {children}
    </p>
  )
}
