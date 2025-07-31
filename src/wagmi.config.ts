import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Try to import Farcaster connectors with better error handling
let farcasterConnector: any = null;

try {
  // Dynamic import approach for better compatibility
  if (typeof window !== 'undefined') {
    // Check if we're in a Farcaster environment
    const isFarcaster = window.parent !== window || 
                       navigator.userAgent.includes('Farcaster') ||
                       document.referrer.includes('farcaster') ||
                       (window as any).ethereum?.isFarcaster;
    
    if (isFarcaster) {
      console.log('🎯 Detected Farcaster environment');
    }
  }
} catch (error) {
  console.log('📱 Farcaster connector not available:', error);
}

// Create connectors with better fallback logic
export const config = createConfig({
  chains: [base],
  connectors: [
    // Injected connector with smart detection
    injected({
      target() {
        // Return available providers in order of preference
        if (typeof window === 'undefined') return undefined;
        
        const providers = [];
        
        // Check for Farcaster wallet first
        if ((window as any).ethereum?.isFarcaster) {
          providers.push({
            id: 'farcaster',
            name: 'Farcaster Wallet',
            provider: (window as any).ethereum,
          });
        }
        
        // Check for MetaMask
        if ((window as any).ethereum?.isMetaMask) {
          providers.push({
            id: 'metamask', 
            name: 'MetaMask',
            provider: (window as any).ethereum,
          });
        }
        
        // Check for Coinbase Wallet
        if ((window as any).ethereum?.isCoinbaseWallet) {
          providers.push({
            id: 'coinbase',
            name: 'Coinbase Wallet', 
            provider: (window as any).ethereum,
          });
        }
        
        // Fallback to generic injected
        if ((window as any).ethereum) {
          providers.push({
            id: 'injected',
            name: 'Wallet',
            provider: (window as any).ethereum,
          });
        }
        
        console.log(`🔗 Found ${providers.length} wallet providers`);
        return providers[0]; // Return the first (highest priority) provider
      },
    }),
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
  multiInjectedProviderDiscovery: true,
})

console.log('🔧 Wagmi configured for Base network with smart wallet detection');

export { base as baseChain };
