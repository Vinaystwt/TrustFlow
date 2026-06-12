import { Check, X } from 'lucide-react'
import { cx } from '@/lib/utils'

export function ComparisonCard({
  variant,
  title,
  items,
}: {
  variant: 'bad' | 'good'
  title: string
  items: string[]
}) {
  const good = variant === 'good'
  return (
    <div
      className={cx(
        'rounded-card border p-6 sm:p-8',
        good
          ? 'border-success/30 bg-success/[0.06]'
          : 'border-danger/30 bg-danger/[0.06]'
      )}
    >
      <h3
        className={cx(
          'font-display text-xl font-bold tracking-tight',
          good ? 'text-success' : 'text-danger'
        )}
      >
        {title}
      </h3>
      <ul className="mt-5 space-y-3.5">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-3">
            <span
              className={cx(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                good ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
              )}
            >
              {good ? <Check size={13} /> : <X size={13} />}
            </span>
            <span className="text-[15px] leading-relaxed text-text-secondary">
              {it}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
