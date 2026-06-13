'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Droplets, Loader2, Check } from 'lucide-react'
import { useMintQUSDC, useQUSDCBalance } from '@/hooks/useTrustFlow'
import { useToast } from '@/components/Toast'
import { explorerTx } from '@/lib/chains'
import { formatQUSDC, friendlyError, cx } from '@/lib/utils'
import { QUSDC_ADDRESS } from '@/lib/contracts'

/** Prompt MetaMask to add QUSDC as a watched ERC-20 token. */
export async function addQUSDCToWallet(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) return false
  try {
    const result = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: QUSDC_ADDRESS,
          symbol: 'QUSDC',
          decimals: 6,
        },
      },
    })
    return !!result
  } catch {
    return false
  }
}

export function AddTokenButton({ className }: { className?: string }) {
  const [done, setDone] = useState(false)

  const handle = async () => {
    const ok = await addQUSDCToWallet()
    if (ok) {
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    }
  }

  return (
    <button
      onClick={handle}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 font-display text-xs font-semibold transition-colors',
        done
          ? 'border-success/40 text-success'
          : 'text-text-secondary hover:border-brand-primary/40 hover:text-text',
        className
      )}
    >
      {done ? <Check size={14} /> : <Droplets size={14} />}
      {done ? 'Added!' : 'Add QUSDC to Wallet'}
    </button>
  )
}

export function FaucetButton({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { address } = useAccount()
  const { balance, refetch } = useQUSDCBalance(address)
  const { mint, status } = useMintQUSDC()
  const { toast } = useToast()
  const [justMinted, setJustMinted] = useState(false)

  const loading = status === 'loading'

  const handleMint = async () => {
    if (!address || loading) return
    try {
      const hash = await mint(address)
      toast({
        type: 'success',
        message: '1,000 test QUSDC minted to your wallet!',
        href: explorerTx(hash),
      })
      setJustMinted(true)
      refetch()
      // Prompt user to add QUSDC to their wallet after minting
      addQUSDCToWallet()
      setTimeout(() => setJustMinted(false), 3000)
    } catch (e) {
      toast({ type: 'error', message: friendlyError(e) })
    }
  }

  if (!address) return null

  return (
    <div className={cx('flex items-center gap-3', className)}>
      {!compact && balance !== undefined && (
        <span className="font-mono text-sm text-text-secondary">
          {formatQUSDC(balance)}
        </span>
      )}
      <button
        onClick={handleMint}
        disabled={loading}
        className={cx(
          'inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 font-display text-xs font-semibold transition-colors',
          justMinted
            ? 'border-success/40 text-success'
            : 'text-text-secondary hover:border-brand-primary/40 hover:text-text',
          loading && 'opacity-60'
        )}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : justMinted ? (
          <Check size={14} />
        ) : (
          <Droplets size={14} />
        )}
        {compact ? 'Faucet' : justMinted ? 'Minted!' : 'Get 1,000 Test QUSDC'}
      </button>
    </div>
  )
}
