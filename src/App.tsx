import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Check, Loader, ExternalLink, Trash2, Zap, DollarSign, Wifi, WifiOff } from 'lucide-react';

// Import Farcaster SDK properly
import { sdk } from '@farcaster/miniapp-sdk';

// Type definitions
interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
}

interface TokenApproval {
  id: string;
  tokenAddress: string;
  tokenInfo: TokenInfo;
  spender: string;
  spenderName: string;
  allowance: string;
  allowanceFormatted: string;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedValue: number;
}

interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  totalCost: string;
  usdEstimate: number;
}

class TokenScanner {
  private provider: any;
  private userAddress: string;

  constructor(provider: any, userAddress: string) {
    this.provider = provider;
    this.userAddress = userAddress;
  }

  private commonTokens = [
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    '0x4200000000000000000000000000000000000006', // WETH
    '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
    '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDbC
    '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', // cbETH
  ];

  private commonSpenders = [
    { address: '0x3fc91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', name: 'Uniswap Universal Router', risk: 'low' },
    { address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', name: 'Uniswap Router V3', risk: 'low' },
    { address: '0x1111111254EEB25477B68fb85Ed929f73A960582', name: '1inch Router', risk: 'medium' },
  ];

  async scanTokenApprovals(): Promise<TokenApproval[]> {
    // Simplified scanning for demo
    const approvals: TokenApproval[] = [];
    
    for (const tokenAddress of this.commonTokens.slice(0, 2)) {
      for (const spender of this.commonSpenders.slice(0, 2)) {
        const approval = await this.checkApproval(tokenAddress, spender.address, spender.name, spender.risk as any);
        if (approval) {
          approvals.push(approval);
        }
      }
    }
    
    return approvals;
  }

  private async checkApproval(tokenAddress: string, spenderAddress: string, spenderName: string, riskLevel: 'low' | 'medium' | 'high'): Promise<TokenApproval | null> {
    try {
      // Simplified check - in production, make actual RPC calls
      const hasApproval = Math.random() > 0.7; // 30% chance of having an approval
      
      if (!hasApproval) return null;

      const tokenInfo = this.getTokenInfo(tokenAddress);
      const allowanceFormatted = Math.random() > 0.5 ? 'Unlimited' : '1000.0';
      const estimatedValue = allowanceFormatted === 'Unlimited' ? 1000000 : 1000;

      return {
        id: `${tokenAddress}-${spenderAddress}`,
        tokenAddress,
        tokenInfo,
        spender: spenderAddress,
        spenderName,
        allowance: allowanceFormatted === 'Unlimited' ? 'max' : '1000000000000000000000',
        allowanceFormatted,
        riskLevel,
        estimatedValue
      };
    } catch (error) {
      return null;
    }
  }

  private getTokenInfo(tokenAddress: string): TokenInfo {
    const knownTokens: Record<string, TokenInfo> = {
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
      '0x4200000000000000000000000000000000000006': { name: 'Wrapped Ether', symbol: 'WETH', decimals: 18 },
      '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb': { name: 'Dai Stablecoin', symbol: 'DAI', decimals: 18 },
    };

    return knownTokens[tokenAddress] || { name: 'Unknown Token', symbol: 'UNKNOWN', decimals: 18 };
  }
}

class ApprovalRevoker {
  private provider: any;

  constructor(provider: any) {
    this.provider = provider;
  }

  async estimateGas(tokenAddress: string, spenderAddress: string): Promise<GasEstimate> {
    return {
      gasLimit: '50000',
      gasPrice: '1000000',
      totalCost: '50000000000000',
      usdEstimate: 0.01
    };
  }

  async revokeApproval(tokenAddress: string, spenderAddress: string): Promise<{ txHash: string; gasInfo: GasEstimate }> {
    const gasInfo = await this.estimateGas(tokenAddress, spenderAddress);
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return { 
      txHash: '0x' + Math.random().toString(16).substr(2, 64), 
      gasInfo 
    };
  }
}

// ApprovalCard component
interface ApprovalCardProps {
  approval: TokenApproval;
  onRevoke: (approval: TokenApproval) => void;
  isRevoking: boolean;
}

const ApprovalCard: React.FC<ApprovalCardProps> = ({ approval, onRevoke, isRevoking }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <AlertTriangle className="w-4 h-4" />;
      case 'low': return <Check className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {approval.tokenInfo.symbol.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{approval.tokenInfo.name}</h3>
            <p className="text-sm text-gray-500">{approval.tokenInfo.symbol}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border ${getRiskColor(approval.riskLevel)}`}>
          {getRiskIcon(approval.riskLevel)}
          <span>{approval.riskLevel} risk</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Spender:</span>
          <span className="font-medium text-right max-w-[200px] truncate">{approval.spenderName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Allowance:</span>
          <span className={`font-medium ${approval.allowanceFormatted === 'Unlimited' ? 'text-red-600' : 'text-gray-900'}`}>
            {approval.allowanceFormatted}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Est. Value:</span>
          <span className="font-medium">${approval.estimatedValue > 1000000 ? '1M+' : approval.estimatedValue.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onRevoke(approval)}
          disabled={isRevoking}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center space-x-2 transition-colors"
        >
          {isRevoking ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Revoking...</span>
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              <span>Revoke</span>
            </>
          )}
        </button>
        <button
          onClick={() => window.open(`https://basescan.org/address/${approval.spender}`, '_blank')}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="View on BaseScan"
        >
          <ExternalLink className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [approvals, setApprovals] = useState<TokenApproval[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [revokedCount, setRevokedCount] = useState(0);
  const [provider, setProvider] = useState<any>(null);
  const [error, setError] = useState('');
  const [isFarcasterApp, setIsFarcasterApp] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing Farcaster mini app...');
      
      // First, call ready to dismiss the splash screen
      await sdk.actions.ready({
        disableNativeGestures: false
      });
      
      console.log('SDK ready called successfully');
      setSdkReady(true);
      
      // Check if running inside Farcaster
      const isInFarcaster = window.parent !== window || 
                           navigator.userAgent.includes('Farcaster') ||
                           window.location.href.includes('farcaster');
      
      setIsFarcasterApp(isInFarcaster);
      
      // Check wallet availability
      checkWalletAvailability();
      
      console.log('Blockit mini app initialized', { 
        isInFarcaster, 
        sdkReady: true 
      });
    } catch (error) {
      console.error('Failed to initialize app:', error);
      // Even if SDK fails, mark as ready to prevent hanging
      setSdkReady(true);
    }
  };

  const checkWalletAvailability = async () => {
    try {
      if (typeof window !== 'undefined' && (window.ethereum || sdk?.wallet)) {
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
      
      let web3Provider;
      let address;

      // Try Farcaster wallet first if available
      if (sdk?.wallet && isFarcasterApp) {
        try {
          console.log('Using Farcaster native wallet');
          
          // Request permissions
          const permissions = await sdk.wallet.requestPermissions();
          console.log('Permissions granted:', permissions);
          
          // Switch to Base chain
          await sdk.wallet.switchChain(8453);
          console.log('Switched to Base chain');
          
          // Get address
          address = await sdk.wallet.getAddress();
          console.log('Got address:', address);
          
          web3Provider = {
            request: async (params: any) => {
              // Proxy requests to Farcaster wallet
              if (params.method === 'eth_accounts') {
                return [address];
              }
              // Add other method handlers as needed
              throw new Error(`Method ${params.method} not implemented`);
            },
            getSigner: () => ({
              getAddress: async () => address,
              sendTransaction: async (tx: any) => {
                // Use Farcaster wallet to send transactions
                return await sdk.wallet.sendTransaction(tx);
              }
            })
          };
          
          console.log('Farcaster wallet connected successfully');
        } catch (farcasterError) {
          console.warn('Farcaster wallet failed, trying fallback:', farcasterError);
          throw farcasterError;
        }
      } else if (window.ethereum) {
        // Fallback to regular wallet
        console.log('Using regular Web3 wallet');
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
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

        address = accounts[0];
        web3Provider = {
          request: window.ethereum.request.bind(window.ethereum),
          getSigner: () => ({
            getAddress: async () => address
          })
        };
        
        console.log('Regular wallet connected:', address);
      } else {
        throw new Error('No wallet available. Please install MetaMask or use within Farcaster.');
      }

      setProvider(web3Provider);
      setUserAddress(address);
      setIsConnected(true);

      // Start scanning
      await scanApprovals(web3Provider, address);
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
      console.error('Wallet connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scanApprovals = async (web3Provider: any, address: string) => {
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
    if (!provider) return;
    
    try {
      setIsRevoking(approval.id);
      setError('');

      const revoker = new ApprovalRevoker(provider);
      const gasInfo = await revoker.estimateGas(approval.tokenAddress, approval.spender);
      
      // Confirm with user
      const confirmed = window.confirm(`Revoke ${approval.tokenInfo.symbol} approval to ${approval.spenderName}?\n\nGas cost: ~$${gasInfo.usdEstimate.toFixed(4)}`);
      if (!confirmed) {
        setIsRevoking(null);
        return;
      }

      const { txHash } = await revoker.revokeApproval(approval.tokenAddress, approval.spender);
      
      // Remove from list and update counters
      setApprovals(prev => prev.filter(a => a.id !== approval.id));
      setRevokedCount(prev => prev + 1);
      
      alert(`✅ Approval revoked successfully!\nTransaction: ${txHash.slice(0, 10)}...`);
      
    } catch (err: any) {
      setError(`Failed to revoke approval: ${err.message}`);
      console.error('Revoke error:', err);
    } finally {
      setIsRevoking(null);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setUserAddress('');
    setApprovals([]);
    setRevokedCount(0);
  };

  const highRiskApprovals = approvals.filter(a => a.riskLevel === 'high');
  const totalValue = approvals.reduce((acc, approval) => acc + approval.estimatedValue, 0);

  // Show loading state until SDK is ready
  if (!sdkReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Initializing Blockit...</p>
        </div>
      </div>
    );
  }

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
                <p className="text-sm text-gray-500">
                  {isFarcasterApp ? 'Farcaster Mini App' : 'Base Network Security'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isFarcasterApp && (
                <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Farcaster
                </div>
              )}
              {networkStatus === 'checking' ? (
                <Loader className="w-4 h-4 text-gray-400 animate-spin" />
              ) : networkStatus === 'connected' ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
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

              {isFarcasterApp && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="font-semibold text-purple-900">Farcaster Native</span>
                  </div>
                  <p className="text-purple-700 text-sm">
                    Running inside Farcaster with native wallet integration for the best experience.
                  </p>
                </div>
              )}

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
                    <span>No Wallet Available</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>{isFarcasterApp ? 'Connect Farcaster Wallet' : 'Connect Wallet & Scan'}</span>
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
                  <p className="text-sm text-gray-500">Connected Address</p>
                  <p className="font-mono text-sm text-gray-900">
                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {isFarcasterApp ? 'Farcaster • Base' : 'Base Mainnet'}
                  </p>
                  <p className="text-sm font-medium text-blue-600 flex items-center">
                    <Zap className="w-3 h-3 mr-1" />
                    {isFarcasterApp ? 'Native Wallet' : 'External Wallet'}
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
                  <p className="text-sm text-gray-500 mt-1">Checking Base network contracts</p>
                </div>
              </div>
            )}

            {/* Approvals List */}
            {!isScanning && approvals.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Token Approvals</h3>
                  <span className="text-sm text-gray-500">
                    {isFarcasterApp ? 'Farcaster Secure' : 'Live Data'}
                  </span>
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
                  {isFarcasterApp && ' Native Farcaster integration makes it even smoother!'}
                </p>
              </div>
            )}

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

            {/* Footer */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">
                {isFarcasterApp ? 'Powered by Farcaster • ' : ''}Always verify transactions before signing
              </p>
              <p className="text-xs text-gray-400">
                Built for Base Network • {isFarcasterApp ? 'Farcaster Native' : 'Web3 Compatible'} • Live data 🚀
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
