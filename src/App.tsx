import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Check, Loader, ExternalLink, Trash2, Zap, DollarSign, Wifi, WifiOff } from 'lucide-react';
import { ethers } from 'ethers';
import { TokenScanner } from './lib/TokenScanner';
import { ApprovalRevoker } from './lib/ApprovalRevoker';
import { ApprovalCard } from './components/ApprovalCard';
import { TokenApproval } from './types';

const BASE_CHAIN_ID = 8453;

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [approvals, setApprovals] = useState<TokenApproval[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [revokedCount, setRevokedCount] = useState(0);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [error, setError] = useState('');

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
      setError('');
      
      if (!window.ethereum) {
        throw new Error('Please install MetaMask or use a Web3 browser!');
      }

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await web3Provider.send('eth_requestAccounts', []);
      
      if (accounts.length > 0) {
        // Switch to Base network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x2105',
                chainName: 'Base',
                nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org'],
              }],
            });
          }
        }

        const web3Signer = web3Provider.getSigner();
        const address = await web3Signer.getAddress();
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setUserAddress(address);
        setIsConnected(true);

        // Start scanning
        await scanApprovals(web3Provider, address);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
      console.error('Wallet connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scanApprovals = async (web3Provider: ethers.providers.Web3Provider, address: string) => {
    try {
      setIsScanning(true);
      setError('');
      
      const scanner = new TokenScanner(web3Provider, address);
      const foundApprovals = await scanner.scanTokenApprovals();
      
      setApprovals(foundApprovals);
      
      if (foundApprovals.length === 0) {
        setError('No token approvals found. Your wallet is secure! 🎉');
      }
    } catch (err: any) {
      setError(`Failed to scan approvals: ${err.message}`);
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRevokeApproval = async (approval: TokenApproval) => {
    if (!signer) return;
    
    try {
      setIsRevoking(approval.id);
      setError('');

      const revoker = new ApprovalRevoker(signer);
      const gasInfo = await revoker.estimateGas(approval.tokenAddress, approval.spender);
      
      // Confirm with user
      if (gasInfo.usdEstimate > 5) {
        const confirmed = window.confirm(`This will cost approximately $${gasInfo.usdEstimate.toFixed(4)} in gas fees. Continue?`);
        if (!confirmed) {
          setIsRevoking(null);
          return;
        }
      }

      const { transaction } = await revoker.revokeApproval(approval.tokenAddress, approval.spender);
      
      // Wait for confirmation
      await transaction.wait();
      
      // Remove from list and update counters
      setApprovals(prev => prev.filter(a => a.id !== approval.id));
      setRevokedCount(prev => prev + 1);
      
    } catch (err: any) {
      setError(`Failed to revoke approval: ${err.message}`);
      console.error('Revoke error:', err);
    } finally {
      setIsRevoking(null);
    }
  };

  const highRiskApprovals = approvals.filter(a => a.riskLevel === 'high');
  const totalValue = approvals.reduce((acc, approval) => acc + approval.estimatedValue, 0);

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

              {error && !isConnected && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Main App */
          <div className="space-y-6">
            {/* Stats Dashboard */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{approvals.length}</div>
                  <div className="text-xs text-gray-500">Active Approvals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{highRiskApprovals.length}</div>
                  <div className="text-xs text-gray-500">High Risk</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{revokedCount}</div>
                  <div className="text-xs text-gray-500">Revoked</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    ${totalValue > 1000000 ? '1M+' : totalValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">At Risk</div>
                </div>
              </div>
            </div>

            {/* Connected Address */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Scanning Address</p>
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

            {/* High Risk Alert */}
            {highRiskApprovals.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-800">
                    {highRiskApprovals.length} High Risk Approval{highRiskApprovals.length > 1 ? 's' : ''} Detected
                  </span>
                </div>
                <p className="text-red-700 text-sm">
                  These approvals may pose a security risk. Consider revoking them immediately.
                </p>
              </div>
            )}

            {/* Loading State */}
            {isScanning && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-gray-600">Scanning blockchain for token approvals...</p>
                  <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
                </div>
              </div>
            )}

            {/* Approvals List */}
            {!isScanning && approvals.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Token Approvals</h3>
                  <span className="text-sm text-gray-500">Sorted by risk & value</span>
                </div>
                {approvals.map(approval => (
                  <ApprovalCard
                    key={approval.id}
                    approval={approval}
                    onRevoke={handleRevokeApproval}
                    isRevoking={isRevoking === approval.id}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isScanning && approvals.length === 0 && !error && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Secure! 🎉</h3>
                <p className="text-gray-600">No risky token approvals found on your wallet.</p>
              </div>
            )}

            {/* Error Display */}
            {error && isConnected && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Gas Info */}
            {isConnected && !isScanning && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Base Network Advantage</span>
                </div>
                <p className="text-green-700 text-sm">
                  Revoke approvals for ~$0.01 each thanks to Base's ultra-low gas fees. 
                  Total estimated cost for all revokes: ~${(approvals.length * 0.01).toFixed(2)}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Always verify transactions before signing</p>
              <p className="text-xs text-gray-400">
                Built for Base Network • Real blockchain scanning • Live data 🚀
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
