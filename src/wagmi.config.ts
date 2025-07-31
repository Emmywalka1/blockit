import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Try to import Farcaster wagmi connector if available
let farcasterConnector: any = null;
try {
  const farcasterWagmi = require('@farcaster/miniapp-wagmi-connector');
  farcasterConnector = farcasterWagmi.farcasterConnector;
  console.log('✅ Farcaster wagmi connector available');
} catch (error) {
  console.log('📱 Farcaster wagmi connector not available, using injected connector');
}

// Create connectors array
const connectors = [];

// Add Farcaster connector if available
if (farcasterConnector) {
  try {
    connectors.push(farcasterConnector());
    console.log('✅ Added Farcaster connector');
  } catch (error) {
    console.warn('⚠️ Failed to add Farcaster connector:', error);
  }
}

// Always add injected connector as fallback
connectors.push(
  injected({
    target: 'metaMask',
  })
);

export const config = createConfig({
  chains: [base],
  connectors,
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
  // Enable multi-injected provider discovery
  multiInjectedProviderDiscovery: true,
})

console.log(`🔧 Wagmi configured with ${connectors.length} connectors for Base network`);

// Export Base chain for convenience
export { base as baseChain };
