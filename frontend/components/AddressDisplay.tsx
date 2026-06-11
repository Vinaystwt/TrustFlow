'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { truncateAddress, cx } from '@/lib/utils'
import { explorerAddress } from '@/lib/chains'

export function AddressDisplay({
  address,
  domain,
  showExplorer = true,
  className,
}: {
  address?: string
  domain?: string
  showExplorer?: boolean
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  if (!address) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <span className={cx('group inline-flex items-center gap-1.5', className)}>
      {domain ? (
        <span
          className="font-mono text-sm text-trust-text"
          title={address}
        >
          {domain}
        </span>
      ) : (
        <span
          className="font-mono text-sm text-trust-text"
          title={address}
        >
          {truncateAddress(address)}
        </span>
      )}
      <button
        onClick={copy}
        className="text-trust-text-dim transition-colors hover:text-trust-accent"
        aria-label="Copy address"
        type="button"
      >
        {copied ? <Check size={13} className="text-trust-progress" /> : <Copy size={13} />}
      </button>
      {showExplorer && (
        <a
          href={explorerAddress(address)}
          target="_blank"
          rel="noreferrer"
          className="text-trust-text-dim transition-colors hover:text-trust-accent"
          aria-label="View on explorer"
        >
          <ExternalLink size={13} />
        </a>
      )}
    </span>
  )
}
