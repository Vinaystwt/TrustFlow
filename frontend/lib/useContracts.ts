'use client'

import { useActiveNetwork } from '@/hooks/useActiveNetwork'
import { NETWORKS, type NetworkConfig } from '@/lib/chains'

/**
 * Resolves the contract addresses, chain id, explorer, and feature flags for
 * the currently active network. Every contract read/write should source its
 * address and chainId from here so switching networks reloads data from the
 * correct contract.
 */
export function useContracts(): NetworkConfig {
  const { activeNetwork } = useActiveNetwork()
  return NETWORKS[activeNetwork]
}
