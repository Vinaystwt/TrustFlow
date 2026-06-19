'use client'

import { useState } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { Globe, Check, Loader2, AlertCircle } from 'lucide-react'
import { cx } from '@/lib/utils'
import { useContracts } from '@/lib/useContracts'
import { networkByChainId } from '@/lib/chains'

export function AddNetworkButton({ className }: { className?: string }) {
  const { chainId, networkName, explorer, rpcUrl } = useContracts()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleAdd = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      window.open('https://metamask.io/download/', '_blank')
      return
    }
    setStatus('loading')
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${chainId.toString(16)}`,
            chainName: networkName,
            nativeCurrency: { name: 'QIE', symbol: 'QIE', decimals: 18 },
            rpcUrls: [rpcUrl],
            blockExplorerUrls: [explorer],
          },
        ],
      })
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <button
      onClick={handleAdd}
      disabled={status === 'loading'}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 font-display text-sm font-semibold transition-colors',
        status === 'success'
          ? 'border-success/40 text-success'
          : status === 'error'
            ? 'border-danger/40 text-danger'
            : 'text-text-secondary hover:border-brand-primary/40 hover:text-text',
        className
      )}
    >
      {status === 'loading' ? (
        <Loader2 size={15} className="animate-spin" />
      ) : status === 'success' ? (
        <Check size={15} />
      ) : status === 'error' ? (
        <AlertCircle size={15} />
      ) : (
        <Globe size={15} />
      )}
      {status === 'success'
        ? 'Network Added!'
        : status === 'error'
          ? 'Try Again'
          : `Add ${networkName}`}
    </button>
  )
}

/** Banner shown when the wallet is connected but on a chain that is neither QIE network. */
export function WrongNetworkBanner() {
  const { isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { chainId: activeChainId, networkName } = useContracts()

  // Only warn when connected to a chain that is not a recognised QIE network.
  if (!isConnected || networkByChainId(chainId)) return null

  return (
    <div className="border-b border-danger/30 bg-danger/10 px-4 py-2.5 text-center">
      <p className="inline-flex flex-wrap items-center justify-center gap-2 text-sm text-danger">
        <AlertCircle size={15} />
        Wrong network detected. TrustFlow runs on QIE.
        <button
          onClick={() => switchChain?.({ chainId: activeChainId })}
          className="rounded-lg bg-danger/20 px-3 py-1 font-display text-xs font-semibold text-danger hover:bg-danger/30"
        >
          Switch to {networkName}
        </button>
      </p>
    </div>
  )
}
