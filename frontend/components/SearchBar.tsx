'use client'

import { Search, X } from 'lucide-react'
import { cx } from '@/lib/utils'

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cx('relative', className)}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-bg-elevated py-2.5 pl-10 pr-9 text-sm text-text outline-none transition-colors placeholder:text-text-dim focus:border-brand-primary"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
          aria-label="Clear"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}
