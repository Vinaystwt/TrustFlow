'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Logo } from './Logo'
import { FaucetButton } from './FaucetButton'
import { NetworkSwitcher } from './NetworkSwitcher'
import { cx } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/create', label: 'Create' },
  { href: '/demo', label: 'Demo' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/docs', label: 'Docs' },
]

export function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="TrustFlow home">
          <Logo size="md" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                'relative px-3 py-2 font-display text-sm font-semibold transition-colors',
                isActive(item.href)
                  ? 'text-text'
                  : 'text-text-secondary hover:text-text'
              )}
            >
              {item.label}
              {isActive(item.href) && (
                <motion.span
                  layoutId="nav-dot"
                  className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-primary"
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <FaucetButton compact />
          </div>
          <div className="hidden sm:block">
            <NetworkSwitcher />
          </div>
          <div className="hidden sm:block">
            <ConnectButton
              accountStatus="address"
              chainStatus="none"
              showBalance={false}
            />
          </div>
          <button
            className="text-text-secondary md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cx(
                    'rounded-lg px-3 py-2 font-display text-sm font-semibold',
                    isActive(item.href)
                      ? 'bg-bg-subtle text-text'
                      : 'text-text-secondary'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2">
                <NetworkSwitcher block />
              </div>
              <div className="mt-2">
                <ConnectButton
                  accountStatus="address"
                  chainStatus="none"
                  showBalance={false}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
