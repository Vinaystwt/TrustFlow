'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { formatUnits, type Address } from 'viem'
import { useContracts } from '@/lib/useContracts'
import { NETWORKS } from '@/lib/chains'

// QIEDEX router + tokens on QIE Mainnet
const QIEDEX_ROUTER = '0x2601a070A12749BC2ee095F17D9fbe904505C2dF' as Address
const WQIE = '0x0087904D95BEe9E5F24dc8852804b547981A9139' as Address
const QUSDC_MAINNET = NETWORKS.mainnet.qusdcAddress

const ROUTER_ABI = [
  {
    name: 'getAmountsOut',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const ONE_QIE = 1_000_000_000_000_000_000n // 1e18
const REFRESH_MS = 30_000

export interface QIEPrice {
  /** USD price of 1 QIE, e.g. 0.0234 */
  usd: number
  /** Formatted string, e.g. "$0.0234" */
  display: string
}

/**
 * Reads the live QIE → QUSDC rate from the QIEDEX router on mainnet.
 * Returns null on testnet, on read failure, or while loading.
 */
export function useQIEPrice(): { price: QIEPrice | null; isLoading: boolean } {
  const { key: networkKey } = useContracts()
  const client = usePublicClient({ chainId: NETWORKS.mainnet.chainId })
  const [price, setPrice] = useState<QIEPrice | null>(null)
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    // Live price only makes sense on mainnet.
    if (networkKey !== 'mainnet' || !client) {
      setPrice(null)
      return
    }

    let active = true
    setLoading(true)

    const read = async () => {
      try {
        const amounts = (await client.readContract({
          address: QIEDEX_ROUTER,
          abi: ROUTER_ABI,
          functionName: 'getAmountsOut',
          args: [ONE_QIE, [WQIE, QUSDC_MAINNET]],
        })) as readonly bigint[]

        const out = amounts?.[amounts.length - 1]
        if (!active) return
        if (out && out > 0n) {
          const usd = Number(formatUnits(out, 6))
          setPrice({
            usd,
            display: `$${usd.toLocaleString('en-US', {
              minimumFractionDigits: usd < 1 ? 4 : 2,
              maximumFractionDigits: usd < 1 ? 4 : 2,
            })}`,
          })
        } else {
          setPrice(null)
        }
      } catch {
        // No liquidity / RPC issue: hide the ticker rather than show a broken value.
        if (active) setPrice(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    read()
    const timer = setInterval(read, REFRESH_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [networkKey, client])

  return { price, isLoading }
}
