import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Create connectors array with multiple options
const connectors = [];

// Add injected connector for MetaMask, Coinbase Wallet, etc.
connectors.push(
  injected({
    target: () => ({
      id: 'injected',
      name: 'Injected Wallet',
      provider: typeof window !== 'undefined' ? window.ethereum : undefined,
    }),
  })
);

// Add specific MetaMask connector
if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
  connectors.push(
    injected({
      target: 'metaMask',
    })
  );
}

// Add Coinbase Wallet connector
if (typeof window !== 'undefined' && window.ethereum?.isCoinbaseWallet) {
  connectors.push(
    injected({
      target: 'coinbaseWallet',
    })
  );
}

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
