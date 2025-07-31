import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base],
  connectors: [
    injected()
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
})

console.log('🔧 Wagmi configured for Base network');

console.log('🔧 Wagmi configured for Base network with smart wallet detection');

export { base as baseChain };
