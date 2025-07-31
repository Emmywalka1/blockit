import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Create multiple injected connectors for better wallet support
const createInjectedConnectors = () => {
  const connectors = [];
  
  // Primary injected connector - detects any available wallet
  connectors.push(
    injected({
      target: () => {
        if (typeof window === 'undefined') return undefined;
        
        // Check for any ethereum provider
        if ((window as any).ethereum) {
          console.log('🔗 Found ethereum provider');
          return {
            id: 'injected',
            name: 'Wallet',
            provider: (window as any).ethereum,
          };
        }
        
        console.log('❌ No ethereum provider found');
        return undefined;
      },
    })
  );

  // Specific MetaMask connector
  connectors.push(
    injected({
      target: () => {
        if (typeof window === 'undefined') return undefined;
        
        if ((window as any).ethereum?.isMetaMask) {
          console.log('🦊 Found MetaMask');
          return {
            id: 'metamask',
            name: 'MetaMask',
            provider: (window as any).ethereum,
          };
        }
        
        return undefined;
      },
    })
  );

  // Farcaster wallet connector
  connectors.push(
    injected({
      target: () => {
        if (typeof window === 'undefined') return undefined;
        
        // Check if we're in Farcaster context
        const isFarcaster = window.parent !== window || 
                           navigator.userAgent.includes('Farcaster') ||
                           document.referrer.includes('farcaster');
        
        if (isFarcaster && (window as any).ethereum) {
          console.log('🎯 Found Farcaster wallet');
          return {
            id: 'farcaster',
            name: 'Farcaster Wallet',
            provider: (window as any).ethereum,
          };
        }
        
        return undefined;
      },
    })
  );

  // Coinbase Wallet connector
  connectors.push(
    injected({
      target: () => {
        if (typeof window === 'undefined') return undefined;
        
        if ((window as any).ethereum?.isCoinbaseWallet) {
          console.log('🔵 Found Coinbase Wallet');
          return {
            id: 'coinbase',
            name: 'Coinbase Wallet',
            provider: (window as any).ethereum,
          };
        }
        
        return undefined;
      },
    })
  );

  return connectors;
};

export const config = createConfig({
  chains: [base],
  connectors: createInjectedConnectors(),
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
  multiInjectedProviderDiscovery: true,
})

console.log('🔧 Wagmi configured for Base network with smart wallet detection');

export { base as baseChain };
