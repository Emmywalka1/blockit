import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base],
  connectors: [
    injected({
      target: () => {
        if (typeof window === 'undefined') return undefined;
        
        // Check for Farcaster wallet first
        if (window.parent !== window || navigator.userAgent.includes('Farcaster')) {
          // In Farcaster, try multiple provider locations
          const provider = (window as any).ethereum || 
                          (window as any).web3?.currentProvider ||
                          (window as any).farcaster?.ethereum;
          
          if (provider) {
            console.log('🎯 Found Farcaster wallet provider');
            return {
              id: 'farcaster',
              name: 'Farcaster Wallet',
              provider: provider,
            };
          }
        }
        
        // Fallback to regular ethereum provider
        if ((window as any).ethereum) {
          console.log('🔗 Found ethereum provider');
          return {
            id: 'injected',
            name: 'Wallet',
            provider: (window as any).ethereum,
          };
        }
        
        console.log('❌ No wallet provider found');
        return undefined;
      },
    }),
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
})

console.log('🔧 Wagmi configured for Base network');

console.log('🔧 Wagmi configured for Base network with smart wallet detection');

export { base as baseChain };
