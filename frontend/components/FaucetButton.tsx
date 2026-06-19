'use client'

import { useCallback, useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { Droplets, Loader2, Check, ArrowLeftRight } from 'lucide-react'
import { useMintQUSDC, useQUSDCBalance } from '@/hooks/useTrustFlow'
import { useToast } from '@/components/Toast'
import { explorerTx } from '@/lib/chains'
import { formatQUSDC, friendlyError, cx } from '@/lib/utils'
import { useContracts } from '@/lib/useContracts'

const BRIDGE_URL = 'https://bridge.qie.digital/'

function watchAssetParams(qusdcAddress: string) {
  return {
    type: 'ERC20' as const,
    options: {
      address: qusdcAddress,
      symbol: 'QUSDC',
      decimals: 6,
    },
  }
}

/**
 * Request the connected wallet to add QUSDC as a watched token.
 * Uses the wagmi wallet client (EIP-6963 aware) so it targets
 * whichever wallet the user actually connected with.
 */
async function requestWatchAsset(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walletClient: any,
  qusdcAddress: string
): Promise<boolean> {
  try {
    const result = await walletClient.request({
      method: 'wallet_watchAsset',
      params: watchAssetParams(qusdcAddress),
    })
    return !!result
  } catch {
    return false
  }
}

/** Fallback: try raw window.ethereum if walletClient unavailable */
async function requestWatchAssetFallback(qusdcAddress: string): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) return false
  try {
    const result = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: watchAssetParams(qusdcAddress),
    })
    return !!result
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// BridgeButton: shown on mainnet (no faucet) to get QUSDC via the bridge
// ---------------------------------------------------------------------------

function BridgeButton({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <a
      href={BRIDGE_URL}
      target="_blank"
      rel="noreferrer"
      title="QUSDC on mainnet is bridged from real USDC. Get QUSDC by bridging at bridge.qie.digital."
      className={cx(
        'inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 font-display text-xs font-semibold text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-text',
        className
      )}
    >
      <ArrowLeftRight size={14} />
      {compact ? 'Bridge' : 'Bridge USDC → QUSDC'}
    </a>
  )
}

// ---------------------------------------------------------------------------
// AddTokenButton: standalone button for importing QUSDC into wallet
// ---------------------------------------------------------------------------

export function AddTokenButton({ className }: { className?: string }) {
  const { data: walletClient } = useWalletClient()
  const { qusdcAddress } = useContracts()
  const { toast } = useToast()
  const [done, setDone] = useState(false)

  const handle = async () => {
    const ok = walletClient
      ? await requestWatchAsset(walletClient, qusdcAddress)
      : await requestWatchAssetFallback(qusdcAddress)

    if (ok) {
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } else {
      toast({
        type: 'info',
        message: `Could not auto-add token. Add manually: ${qusdcAddress.slice(0, 6)}...${qusdcAddress.slice(-4)} (QUSDC, 6 decimals)`,
      })
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

// ---------------------------------------------------------------------------
// FaucetButton: mint QUSDC then prompt token import (testnet),
// or a bridge link (mainnet)
// ---------------------------------------------------------------------------

export function FaucetButton({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { qusdcAddress, hasFaucet } = useContracts()
  const { balance, refetch } = useQUSDCBalance(address)
  const { mint, status } = useMintQUSDC()
  const { toast } = useToast()
  const [justMinted, setJustMinted] = useState(false)

  const loading = status === 'loading'

  const handleMint = useCallback(async () => {
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

      // Small delay so the wallet's tx-confirmed notification clears first
      await new Promise((r) => setTimeout(r, 1200))

      // Prompt wallet to import QUSDC token
      const ok = walletClient
        ? await requestWatchAsset(walletClient, qusdcAddress)
        : await requestWatchAssetFallback(qusdcAddress)

      if (!ok) {
        toast({
          type: 'info',
          message: `Auto-import failed. Add QUSDC manually: ${qusdcAddress.slice(0, 6)}...${qusdcAddress.slice(-4)}`,
        })
      }

      setTimeout(() => setJustMinted(false), 3000)
    } catch (e) {
      toast({ type: 'error', message: friendlyError(e) })
    }
  }, [address, loading, mint, toast, refetch, walletClient, qusdcAddress])

  if (!address) return null

  // Mainnet: no faucet, point users to the bridge instead.
  if (!hasFaucet) {
    return (
      <div className={cx('flex items-center gap-3', className)}>
        {!compact && balance !== undefined && (
          <span className="font-mono text-sm text-text-secondary">
            {formatQUSDC(balance)}
          </span>
        )}
        <BridgeButton compact={compact} />
      </div>
    )
  }

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
