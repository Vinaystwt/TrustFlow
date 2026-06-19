'use client'

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useSwitchChain } from 'wagmi'
import {
  DEFAULT_NETWORK,
  NETWORKS,
  STORAGE_KEY,
  type NetworkKey,
} from '@/lib/chains'

interface NetworkContextValue {
  activeNetwork: NetworkKey
  setActiveNetwork: (next: NetworkKey) => void
  ready: boolean
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined)

export function NetworkProvider({ children }: { children: ReactNode }) {
  // Start from the default so SSR and first client render match, then hydrate
  // the persisted choice from localStorage after mount.
  const [activeNetwork, setActive] = useState<NetworkKey>(DEFAULT_NETWORK)
  const [ready, setReady] = useState(false)
  const { switchChain } = useSwitchChain()

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as NetworkKey | null
      if (stored === 'mainnet' || stored === 'testnet') {
        setActive(stored)
      }
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [])

  const setActiveNetwork = useCallback(
    (next: NetworkKey) => {
      setActive(next)
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      // Ask the wallet to switch to the matching chain so writes land on the
      // active network. Silently ignored if no wallet is connected.
      try {
        switchChain?.({ chainId: NETWORKS[next].chainId })
      } catch {
        /* ignore */
      }
    },
    [switchChain]
  )

  return createElement(
    NetworkContext.Provider,
    { value: { activeNetwork, setActiveNetwork, ready } },
    children
  )
}

export function useActiveNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext)
  if (!ctx) {
    // Fallback when used outside the provider (e.g. isolated tests).
    return {
      activeNetwork: DEFAULT_NETWORK,
      setActiveNetwork: () => {},
      ready: true,
    }
  }
  return ctx
}
