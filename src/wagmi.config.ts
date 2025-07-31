import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    farcasterMiniApp()
  ]
})

console.log('🔧 Wagmi configured with Farcaster miniapp connector');

console.log('🔧 Wagmi configured for Base network with smart wallet detection');

export { base as baseChain };
