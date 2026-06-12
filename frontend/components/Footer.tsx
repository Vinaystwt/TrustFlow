import Link from 'next/link'
import { Github, Twitter } from 'lucide-react'
import { Logo } from './Logo'
import { TRUSTFLOW_ADDRESS } from '@/lib/contracts'
import { explorerAddress } from '@/lib/chains'

const PRODUCT = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Create Agreement', href: '/create' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Docs', href: '/docs' },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-elevated/50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo size="md" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
              Payments that build credit. Built on QIE.
            </p>
            <div className="mt-4 flex gap-2">
              <a
                href="https://twitter.com/vinaystwt"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-text"
              >
                <Twitter size={16} />
              </a>
              <a
                href="https://github.com/Vinaystwt/TrustFlow"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-text"
              >
                <Github size={16} />
              </a>
            </div>
          </div>

          <FooterCol title="Product" links={PRODUCT} />

          <FooterCol
            title="Resources"
            links={[
              { label: 'How it works', href: '/docs' },
              { label: 'Smart contracts', href: explorerAddress(TRUSTFLOW_ADDRESS), external: true },
              { label: 'QIE Blockchain', href: 'https://www.qie.digital', external: true },
              { label: 'GitHub repo', href: 'https://github.com/Vinaystwt/TrustFlow', external: true },
            ]}
          />

          <div>
            <h4 className="font-display text-sm font-semibold text-text">Built by</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-text-secondary">
              <li>
                <a href="https://twitter.com/vinaystwt" target="_blank" rel="noreferrer" className="hover:text-text">
                  Vinay (@vinaystwt)
                </a>
              </li>
              <li>Deon Labs</li>
              <li>Built for QIE Hackathon 2026</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-text-dim">
            © {new Date().getFullYear()} TrustFlow. All rights reserved.
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Made on QIE Testnet
          </span>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string; external?: boolean }[]
}) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold text-text">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) =>
          l.external ? (
            <li key={l.label}>
              <a href={l.href} target="_blank" rel="noreferrer" className="text-text-secondary hover:text-text">
                {l.label}
              </a>
            </li>
          ) : (
            <li key={l.label}>
              <Link href={l.href} className="text-text-secondary hover:text-text">
                {l.label}
              </Link>
            </li>
          )
        )}
      </ul>
    </div>
  )
}
