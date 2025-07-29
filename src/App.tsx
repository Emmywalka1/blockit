import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Check, Loader, ExternalLink, Trash2, Zap, DollarSign, Wifi, WifiOff } from 'lucide-react';

// Base network configuration
const BASE_CHAIN_ID = 8453;
const BASE_RPC_URL = 'https://mainnet.base.org';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Check wallet availability on component mount
  useEffect(() => {
    checkWalletAvailability();
  }, []);

  const checkWalletAvailability = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        setNetworkStatus('connected');
      } else {
        setNetworkStatus('disconnected');
      }
    } catch (error) {
      setNetworkStatus('disconnected');
    }
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      
      if (!window.ethereum) {
        alert('Please install MetaMask or use a Web3 browser!');
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setUserAddress(accounts[0]);
        setIsConnected(true);
        
        // Try to switch to Base network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }], // Base chain ID
          });
        } catch (switchError: any) {
          // Add Base network if not found
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x2105',
                chainName: 'Base',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org'],
              }],
            });
          }
        }
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setUserAddress('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Blockit</h1>
                <p className="text-sm text-gray-500">Base Network Security</p>
              </div>
            </div>
            
            {/* Network Status */}
            <div className="flex items-center space-x-2">
              {networkStatus === 'checking' ? (
                <Loader className="w-4 h-4 text-gray-400 animate-spin" />
              ) : networkStatus === 'connected' ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-gray-500">
                {networkStatus === 'connected' ? 'Web3 Ready' : 'No Web3'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {!isConnected ? (
          /* Connection Screen */
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  ✅ App Loaded Successfully!
                </h2>
                <p className="text-gray-600 mb-4">
                  React app with Lucide icons working properly! 🚀
                </p>
              </div>
            </div>

            {/* Hero Section */}
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure Your Assets</h2>
                <p className="text-gray-600">
                  Auto-detect and revoke risky token approvals on Base network. Keep your funds safe from malicious contracts.
                </p>
              </div>

              {/* Base Network Benefits */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Base Network Benefits:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-center">
                    <DollarSign className="w-3 h-3 mr-2" />
                    Ultra-low gas fees (~$0.01 per revoke)
                  </li>
                  <li className="flex items-center">
                    <Zap className="w-3 h-3 mr-2" />
                    Fast transaction confirmation
                  </li>
                  <li className="flex items-center">
                    <Shield className="w-3 h-3 mr-2" />
                    Ethereum-compatible security
                  </li>
                </ul>
              </div>

              {/* Connect Button */}
              <button
                onClick={connectWallet}
                disabled={isLoading || networkStatus !== 'connected'}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : networkStatus !== 'connected' ? (
                  <>
                    <WifiOff className="w-5 h-5" />
                    <span>No Web3 Wallet</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Connect Wallet & Scan</span>
                  </>
                )}
              </button>

              {networkStatus !== 'connected' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-700 text-sm">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    Please install MetaMask or use a Web3 browser to continue.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Connected State */
          <div className="space-y-6">
            {/* Connected Status */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Connected Address</p>
                  <p className="font-mono text-sm text-gray-900">
                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Network</p>
                  <p className="text-sm font-medium text-blue-600 flex items-center">
                    <Zap className="w-3 h-3 mr-1" />
                    Base Mainnet
                  </p>
                </div>
              </div>
            </div>

            {/* Scan Coming Soon */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🔍 Token Approval Scanner
              </h3>
              <p className="text-gray-600 mb-4">
                Ready to scan for token approvals! Full scanning functionality coming next.
              </p>
              <button
                onClick={() => alert('🚀 Wallet connected! Token scanning will be added next.')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Test Scan (Demo)
              </button>
            </div>

            {/* Disconnect */}
            <div className="text-center">
              <button
                onClick={disconnect}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center space-x-1 mx-auto"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Disconnect Wallet</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-200 mt-6">
          <p className="text-xs text-gray-500 mb-1">
            Always verify transactions before signing
          </p>
          <p className="text-xs text-gray-400">
            Built for Base Network • Real blockchain integration • Icons working! ✨
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
