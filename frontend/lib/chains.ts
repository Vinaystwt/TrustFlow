import { defineChain } from 'viem'

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

export const EXPLORER_URL = qieTestnet.blockExplorers.default.url

export function explorerTx(hash: string) {
  return `${EXPLORER_URL}/tx/${hash}`
}

export function explorerAddress(address: string) {
  return `${EXPLORER_URL}/address/${address}`
}
