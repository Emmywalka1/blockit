import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Try to import Farcaster miniapp wagmi connector
let farcasterMiniAppConnector: any = null;
try {
  const farcasterWagmi = require('@farcaster/miniapp-wagmi-connector');
  farcasterMiniAppConnector = farcasterWagmi.farcasterMiniApp;
  console.log('✅ Farcaster miniapp wagmi connector loaded');
} catch (error) {
  console.log('📱 Farcaster miniapp wagmi connector not available');
}

// Create connectors array
const connectors = [];

// Add Farcaster miniapp connector if available (PRIORITY)
if (farcasterMiniAppConnector) {
  try {
    connectors.push(farcasterMiniAppConnector());
    console.log('✅ Added Farcaster miniapp connector');
  } catch (error) {
    console.warn('⚠️ Failed to add Farcaster miniapp connector:', error);
  }
}

// Add injected connector as fallback
connectors.push(
  injected({
    target: () => ({
      id: 'injected',
      name: 'Injected Wallet',
      provider: typeof window !== 'undefined' ? window.ethereum : undefined,
    }),
  })
);

// Add MetaMask specifically
if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
  connectors.push(
    injected({
      target: 'metaMask',
    })
  );
}

export const config = createConfig({
  chains: [base],
  connectors,
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
  multiInjectedProviderDiscovery: true,
})

console.log(`🔧 Wagmi configured with ${connectors.length} connectors for Base network`);

// Export Base chain for convenience
export { base as baseChain };
