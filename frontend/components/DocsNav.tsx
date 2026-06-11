'use client'

import { useEffect, useState } from 'react'
import { cx } from '@/lib/utils'

export interface DocSection {
  id: string
  label: string
}

export function DocsNav({ sections }: { sections: DocSection[] }) {
  const [active, setActive] = useState(sections[0]?.id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  const go = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <nav className="sticky top-24 hidden w-52 shrink-0 lg:block">
      <p className="mb-3 px-3 font-display text-xs font-semibold uppercase tracking-wide text-trust-text-dim">
        On this page
      </p>
      <ul className="space-y-0.5">
        {sections.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => go(s.id)}
              className={cx(
                'block w-full rounded-lg px-3 py-1.5 text-left font-body text-sm transition-colors',
                active === s.id
                  ? 'bg-trust-surface font-semibold text-trust-accent'
                  : 'text-trust-text-secondary hover:text-trust-text'
              )}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
