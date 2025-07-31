import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Import Farcaster miniapp wagmi connector properly
let farcasterMiniAppConnector: any = null;
try {
  // Try the main miniapp connector first
  const farcasterWagmi = require('@farcaster/miniapp-wagmi-connector');
  farcasterMiniAppConnector = farcasterWagmi.farcasterMiniApp;
  console.log('✅ Farcaster miniapp wagmi connector loaded');
} catch (error) {
  try {
    // Try the frame connector as fallback
    const frameWagmi = require('@farcaster/frame-wagmi-connector');
    farcasterMiniAppConnector = frameWagmi.farcasterFrame;
    console.log('✅ Farcaster frame wagmi connector loaded as fallback');
  } catch (frameError) {
    console.log('📱 No Farcaster wagmi connectors available');
  }
}

// Create connectors array with proper priority
const connectors = [];

// Add Farcaster miniapp connector first (HIGHEST PRIORITY)
if (farcasterMiniAppConnector) {
  try {
    connectors.push(farcasterMiniAppConnector({
      // Optional: Add any specific configuration
      metadata: {
        name: 'Blockit',
        description: 'Token Approval Security',
        url: 'https://blockit-two.vercel.app',
        icons: ['https://blockit-two.vercel.app/favicon.png']
      }
    }));
    console.log('✅ Added Farcaster miniapp connector');
  } catch (error) {
    console.warn('⚠️ Failed to add Farcaster miniapp connector:', error);
  }
}

// Add injected wallet connectors as fallbacks
connectors.push(
  injected({
    target: () => {
      // Check if we're in Farcaster environment first
      if (typeof window !== 'undefined' && (window as any).ethereum?.isFarcaster) {
        return {
          id: 'farcaster',
          name: 'Farcaster Wallet',
          provider: (window as any).ethereum,
        };
      }
      
      // Check for MetaMask
      if (typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask) {
        return {
          id: 'metamask',
          name: 'MetaMask',
          provider: (window as any).ethereum,
        };
      }
      
      // Default injected
      return {
        id: 'injected',
        name: 'Injected Wallet',
        provider: typeof window !== 'undefined' ? (window as any).ethereum : undefined,
      };
    },
  })
);

export const config = createConfig({
  chains: [base],
  connectors,
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
  // Enable better provider discovery
  multiInjectedProviderDiscovery: true,
  // Add SSR support
  ssr: true,
})

console.log(`🔧 Wagmi configured with ${connectors.length} connectors for Base network`);
console.log('Available connectors:', connectors.map((c: any) => c.name || c.id));

// Export Base chain for convenience
export { base as baseChain };
