'use client'

import { useContracts } from '@/lib/useContracts'
import { cx } from '@/lib/utils'

/**
 * Small pill showing the active network with a colored dot.
 * Green for mainnet (live), amber for testnet.
 */
export function NetworkBadge({ className }: { className?: string }) {
  const { networkName, key } = useContracts()
  const isMainnet = key === 'mainnet'
  const color = isMainnet ? '#10B981' : '#F59E0B'

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        className
      )}
      style={{
        borderColor: `${color}55`,
        backgroundColor: `${color}14`,
        color,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {networkName}
    </span>
  )
}
