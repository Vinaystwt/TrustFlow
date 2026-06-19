'use client'

import { ReactNode, useState } from 'react'
import { WagmiProvider, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { qieMainnet, qieTestnet } from '@/lib/chains'
import { NetworkProvider } from '@/hooks/useActiveNetwork'

// ---------------------------------------------------------------------------
// getDefaultConfig sets up wagmi with:
//   - EIP-6963 multi-injected-provider discovery (each installed wallet gets
//     its own named entry: MetaMask, Rabby, Brave, etc.)
//   - WalletConnect v2 fallback for mobile / remote wallets
//   - Coinbase Wallet SDK
//   - Safe connector
// This replaces the manual connectorsForWallets setup that used the MetaMask
// SDK connector, which hung instead of popping up the extension.
// ---------------------------------------------------------------------------

const wagmiConfig = getDefaultConfig({
  appName: 'TrustFlow',
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    '5233990d7a53451d12de1cdb03910795',
  chains: [qieMainnet, qieTestnet],
  transports: {
    [qieMainnet.id]: http('https://rpc1mainnet.qie.digital/'),
    [qieTestnet.id]: http('https://rpc1testnet.qie.digital/'),
  },
  ssr: true,
})

const rkTheme = darkTheme({
  accentColor: '#3B82F6',
  accentColorForeground: '#ffffff',
  borderRadius: 'medium',
  overlayBlur: 'small',
})

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          <RainbowKitProvider theme={rkTheme} modalSize="compact">
            {children}
          </RainbowKitProvider>
        </NetworkProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
