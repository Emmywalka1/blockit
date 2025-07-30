import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'

// Note: For now we'll use a simple injected connector since 
// @farcaster/miniapp-wagmi-connector might not be available
// You can add it later when the package is accessible
export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
  // Start with no connectors for now - wagmi will auto-detect injected wallets
  connectors: [],
})
