import { defineChain, type Address } from 'viem'

// ---------------------------------------------------------------------------
// Chain definitions
// ---------------------------------------------------------------------------

export const qieMainnet = defineChain({
  id: 1990,
  name: 'QIE Mainnet',
  nativeCurrency: { name: 'QIE', symbol: 'QIE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc1mainnet.qie.digital/'] },
  },
  blockExplorers: {
    default: { name: 'QIE Explorer', url: 'https://mainnet.qie.digital' },
  },
})

export const qieTestnet = defineChain({
  id: 1983,
  name: 'QIE Testnet',
  nativeCurrency: { name: 'QIE', symbol: 'QIE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc1testnet.qie.digital/'] },
  },
  blockExplorers: {
    default: { name: 'QIE Explorer', url: 'https://testnet.qie.digital' },
  },
})

// ---------------------------------------------------------------------------
// Network config (addresses, explorer, feature flags) per network
// ---------------------------------------------------------------------------

export type NetworkKey = 'mainnet' | 'testnet'

export interface NetworkConfig {
  key: NetworkKey
  chainId: number
  networkName: string
  trustFlowAddress: Address
  qusdcAddress: Address
  explorer: string
  rpcUrl: string
  hasFaucet: boolean
  hasRelayer: boolean
}

export const STORAGE_KEY = 'trustflow_active_network'

export const DEFAULT_NETWORK: NetworkKey =
  (process.env.NEXT_PUBLIC_DEFAULT_NETWORK as NetworkKey) || 'mainnet'

export const NETWORKS: Record<NetworkKey, NetworkConfig> = {
  mainnet: {
    key: 'mainnet',
    chainId: 1990,
    networkName: 'QIE Mainnet',
    trustFlowAddress: (process.env.NEXT_PUBLIC_TRUSTFLOW_MAINNET_ADDRESS ||
      '0xB9F38E0180F62e80Be6ca44cE6202316FCcefEC9') as Address,
    qusdcAddress: (process.env.NEXT_PUBLIC_QUSDC_MAINNET_ADDRESS ||
      '0x3F43DA82eC9A4f5285F10FaF1F26EcA7319E5DA5') as Address,
    explorer: 'https://mainnet.qie.digital',
    rpcUrl: 'https://rpc1mainnet.qie.digital/',
    hasFaucet: false,
    hasRelayer: false,
  },
  testnet: {
    key: 'testnet',
    chainId: 1983,
    networkName: 'QIE Testnet',
    trustFlowAddress: (process.env.NEXT_PUBLIC_TRUSTFLOW_TESTNET_ADDRESS ||
      process.env.NEXT_PUBLIC_TRUSTFLOW_ADDRESS ||
      '0xcD0915cb3423F6665C636d723648F78d88B81e52') as Address,
    qusdcAddress: (process.env.NEXT_PUBLIC_QUSDC_TESTNET_ADDRESS ||
      process.env.NEXT_PUBLIC_QUSDC_ADDRESS ||
      '0x1850d2a31CB8669Ba757159B638DE19Af532ba5e') as Address,
    explorer: 'https://testnet.qie.digital',
    rpcUrl: 'https://rpc1testnet.qie.digital/',
    hasFaucet: true,
    hasRelayer: true,
  },
}

export function networkByChainId(chainId?: number): NetworkConfig | undefined {
  if (chainId === NETWORKS.mainnet.chainId) return NETWORKS.mainnet
  if (chainId === NETWORKS.testnet.chainId) return NETWORKS.testnet
  return undefined
}

// ---------------------------------------------------------------------------
// Explorer helpers
//
// These read the active network from localStorage so links across the app
// point at the active network's explorer without threading the network
// through every call site. SSR and server components fall back to the
// default network.
// ---------------------------------------------------------------------------

function activeExplorerBase(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'testnet') return NETWORKS.testnet.explorer
      if (stored === 'mainnet') return NETWORKS.mainnet.explorer
    } catch {
      /* ignore */
    }
  }
  return NETWORKS[DEFAULT_NETWORK].explorer
}

export const EXPLORER_URL = NETWORKS[DEFAULT_NETWORK].explorer

export function explorerTx(hash: string) {
  return `${activeExplorerBase()}/tx/${hash}`
}

export function explorerAddress(address: string) {
  return `${activeExplorerBase()}/address/${address}`
}
