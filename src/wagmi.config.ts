import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base],
  connectors: [
    injected({
      target: () => {
        if (typeof window === 'undefined') return undefined;
        
        // Return any available ethereum provider
        if ((window as any).ethereum) {
          console.log('🔗 Found ethereum provider');
          return {
            id: 'injected',
            name: 'Wallet',
            provider: (window as any).ethereum,
          };
        }
        
        return undefined;
      },
    }),
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
})

console.log('🔧 Wagmi configured for Base network');

export { base as baseChain };

console.log('🔧 Wagmi configured for Base network with smart wallet detection');

export { base as baseChain };
