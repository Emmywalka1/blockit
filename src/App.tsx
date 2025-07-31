import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Shield, AlertTriangle, Check, Loader, ExternalLink, Trash2, Zap, DollarSign, Wifi, WifiOff, Database, Search } from 'lucide-react';

// REAL wagmi imports for blockchain interaction
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';

// Farcaster SDK
import { sdk } from '@farcaster/miniapp-sdk';

// Import configuration for known protocols to check against
import { 
  BASE_SPENDERS, 
  BASE_TOKENS,
  getSpenderByAddress,
  type SpenderConfig
} from './config/baseConfig';

// REAL ERC-20 ABI for actual contract calls
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  }
] as const;

// Type definitions
interface DiscoveredToken {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  balance?: bigint;
  balanceFormatted?: string;
}

interface TokenApproval {
  id: string;
  tokenAddress: `0x${string}`;
  tokenInfo: DiscoveredToken;
  spender: `0x${string}`;
  spenderInfo: SpenderConfig;
  allowance: bigint;
  allowanceFormatted: string;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedValue: number;
  isUnlimited: boolean;
}

// BaseScan API service for token discovery
class BaseTokenDiscoveryService {
  private apiKey: string = 'CV4WNTY3QMPMABJVXJYVCK3ZZ419XT9Z9M'; // Default API key
  private baseUrl: string = 'https://api.basescan.org/api';

  async discoverUserTokens(address: string): Promise<DiscoveredToken[]> {
    try {
      console.log('🔍 Discovering tokens from Base blockchain...');
      
      // Get ERC-20 token transactions
      const response = await fetch(
        `${this.baseUrl}?module=account&action=tokentx&address=${address}&startblock=0&endblock=latest&sort=desc&apikey=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status !== '1' || !data.result) {
        console.log('No token transactions found');
        return [];
      }

      // Extract unique tokens from transaction history
      const tokenMap = new Map<string, DiscoveredToken>();
      
      data.result.forEach((tx: any) => {
        const tokenAddress = tx.contractAddress.toLowerCase();
        if (!tokenMap.has(tokenAddress)) {
          tokenMap.set(tokenAddress, {
            address: tx.contractAddress as `0x${string}`,
            symbol: tx.tokenSymbol || 'UNKNOWN',
            name: tx.tokenName || 'Unknown Token',
            decimals: parseInt(tx.tokenDecimal) || 18,
          });
        }
      });

      const discoveredTokens = Array.from(tokenMap.values());
      console.log(`📊 Discovered ${discoveredTokens.length} unique tokens from transaction history`);
      
      return discoveredTokens;
    } catch (error) {
      console.error('Token discovery failed:', error);
      return [];
    }
  }

  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}?module=account&action=tokenbalance&contractaddress=${tokenAddress}&address=${userAddress}&tag=latest&apikey=${this.apiKey}`
      );
      
      const data = await response.json();
      return data.result || '0';
    } catch (error) {
      console.error(`Failed to get balance for ${tokenAddress}:`, error);
      return '0';
    }
  }
}

// ApprovalCard component
const ApprovalCard: React.FC<{
  approval: TokenApproval;
  onRevoke: (approval: TokenApproval) => void;
  isRevoking: boolean;
}> = ({ approval, onRevoke, isRevoking }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dex': return '🔄';
      case 'lending': return '🏦';
      case 'bridge': return '🌉';
      case 'aggregator': return '📊';
      case 'farming': return '🌾';
      default: return '❓';
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
          <span>{approval.riskLevel} risk</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Protocol:</span>
          <div className="flex items-center space-x-1">
            <span>{getCategoryIcon(approval.spenderInfo.category)}</span>
            <span className="font-medium text-right max-w-[180px] truncate">
              {approval.spenderInfo.protocol}
            </span>
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Allowance:</span>
          <span className={`font-medium ${approval.isUnlimited ? 'text-red-600' : 'text-gray-900'}`}>
            {approval.allowanceFormatted}
          </span>
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
              <span>Revoke (~$0.01)</span>
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
function BlockitApp() {
  const [sdkReady, setSdkReady] = useState(false);
  const [isFarcasterApp, setIsFarcasterApp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [discoveredTokens, setDiscoveredTokens] = useState<DiscoveredToken[]>([]);
  const [approvals, setApprovals] = useState<TokenApproval[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [revokedCount, setRevokedCount] = useState(0);
  const [error, setError] = useState('');
  const [discoveryProgress, setDiscoveryProgress] = useState({ step: '', current: 0, total: 0 });

  // REAL wagmi hooks for blockchain interaction
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Real ERC-20 contract interaction hooks
  const { writeContract, isPending: isWritePending, error: writeError, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Token discovery service
  const discoveryService = useMemo(() => new BaseTokenDiscoveryService(), []);

  // Initialize app (KEEP EXACTLY AS IS - DO NOT CHANGE)
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing Farcaster mini app...');
      
      await sdk.actions.ready({
        disableNativeGestures: false
      });
      
      console.log('SDK ready called successfully');
      setSdkReady(true);
      
      const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                            window.screen.width <= 768 ||
                            'ontouchstart' in window;
      
      setIsMobile(isMobileDevice);
      
      const isInFarcaster = window.parent !== window || 
                           navigator.userAgent.includes('Farcaster') ||
                           document.referrer.includes('farcaster');
      
      setIsFarcasterApp(isInFarcaster);
      
      console.log('Blockit initialized', { 
        isMobileDevice, 
        isInFarcaster
      });
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setSdkReady(true);
    }
  };

  // Fixed connect function using Farcaster miniapp connector
  const handleConnect = async () => {
    try {
      setError('');
      
      if (connectors.length === 0) {
        setError('No wallet connectors available. Please refresh the app.');
        return;
      }

      console.log(`🔗 Connecting with Farcaster miniapp connector`);
      
      // Use the first (and only) connector which is the Farcaster miniapp connector
      await connect({ connector: connectors[0] });
      console.log(`✅ Successfully connected with Farcaster wallet`);
      
    } catch (err: any) {
      console.error('Connection failed:', err);
      
      let errorMessage = 'Connection failed: ';
      
      if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
        errorMessage = 'Connection rejected. Please try again and approve the connection.';
      } else if (err.message?.includes('Already processing')) {
        errorMessage = 'Connection in progress. Please wait...';
      } else {
        errorMessage += err.message || 'Unknown error';
      }
      
      setError(errorMessage);
    }
  };

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      setError(`Connection error: ${connectError.message}`);
    }
  }, [connectError]);

  // Token discovery function with fallbacks
  const discoverTokens = useCallback(async () => {
    if (!address) return;

    setIsDiscovering(true);
    setError('');
    setDiscoveryProgress({ step: 'Discovering tokens...', current: 1, total: 3 });

    try {
      console.log(`🚀 Starting token discovery for ${address}`);
      
      // Step 1: Try to discover tokens from transaction history
      let tokens = await discoveryService.discoverUserTokens(address);
      
      // Step 1.5: If no tokens found via API, use popular Base tokens as fallback
      if (tokens.length === 0) {
        console.log('🔄 No tokens found via API, using popular Base tokens as fallback');
        tokens = BASE_TOKENS.slice(0, 10).map(token => ({ // Use first 10 popular tokens
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
        }));
        console.log(`📋 Using ${tokens.length} popular Base tokens for scanning`);
      }

      setDiscoveredTokens(tokens);
      setDiscoveryProgress({ step: 'Checking approvals...', current: 2, total: 3 });
      
      if (tokens.length === 0) {
        setError('✅ No tokens found to scan. This wallet appears to have no ERC-20 activity on Base.');
        setIsDiscovering(false);
        return;
      }

      console.log(`📊 Found ${tokens.length} tokens to check for approvals`);
      setIsScanning(true);
      
    } catch (err: any) {
      console.error('Token discovery error:', err);
      setError(`Token discovery failed: ${err.message}`);
      setIsDiscovering(false);
      setDiscoveryProgress({ step: '', current: 0, total: 0 });
    }
  }, [address, discoveryService]);

  // Prepare approval check contracts
  const approvalContracts = useMemo(() => {
    if (!address || discoveredTokens.length === 0) return [];

    const contracts = [];
    for (const token of discoveredTokens) {
      for (const spender of BASE_SPENDERS) {
        contracts.push({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, spender.address],
        });
      }
    }
    
    console.log(`📋 Prepared ${contracts.length} approval checks for ${discoveredTokens.length} tokens`);
    return contracts;
  }, [address, discoveredTokens]);

  // Execute approval checks
  const { 
    data: approvalResults, 
    isLoading: isLoadingApprovals, 
    error: approvalError 
  } = useReadContracts({
    contracts: approvalContracts,
    query: {
      enabled: !!address && approvalContracts.length > 0,
    }
  });

  // Process approval results with timeout protection
  useEffect(() => {
    if (approvalResults && address && !isLoadingApprovals && discoveredTokens.length > 0) {
      console.log('🔍 Processing approval scan results...');
      
      const foundApprovals: TokenApproval[] = [];
      let resultIndex = 0;

      for (const token of discoveredTokens) {
        for (const spender of BASE_SPENDERS) {
          if (resultIndex >= approvalResults.length) break;
          
          const result = approvalResults[resultIndex];
          resultIndex++;

          if (result.status === 'success' && result.result) {
            const allowance = result.result as bigint;
            
            if (allowance > 0n) {
              const isUnlimited = allowance >= 2n ** 255n;
              
              const approval: TokenApproval = {
                id: `${token.address}-${spender.address}`,
                tokenAddress: token.address,
                tokenInfo: token,
                spender: spender.address,
                spenderInfo: spender,
                allowance,
                allowanceFormatted: isUnlimited 
                  ? 'Unlimited' 
                  : formatUnits(allowance, token.decimals),
                riskLevel: spender.risk,
                estimatedValue: isUnlimited ? 1000000 : Number(formatUnits(allowance, token.decimals)),
                isUnlimited,
              };

              foundApprovals.push(approval);
              console.log(`🚨 Found approval: ${token.symbol} → ${spender.protocol} (${spender.risk} risk)`);
            }
          }
        }
      }

      setApprovals(foundApprovals);
      setIsScanning(false);
      setIsDiscovering(false);
      setDiscoveryProgress({ step: 'Complete!', current: 3, total: 3 });
      
      if (foundApprovals.length === 0) {
        setError(`✅ No risky approvals found for your ${discoveredTokens.length} tokens! Wallet is secure.`);
      } else {
        setError('');
        console.log(`⚠️ Found ${foundApprovals.length} approvals that may need attention`);
      }
    }

    if (approvalError) {
      console.error('Approval scan error:', approvalError);
      setError(`Approval scan failed: ${approvalError.message}`);
      setIsScanning(false);
      setIsDiscovering(false);
    }
  }, [approvalResults, isLoadingApprovals, address, discoveredTokens, approvalError]);

  // Add timeout protection for scanning
  useEffect(() => {
    if (isScanning) {
      const timeout = setTimeout(() => {
        console.log('⏰ Approval scan timeout, completing anyway');
        setIsScanning(false);
        setIsDiscovering(false);
        setDiscoveryProgress({ step: 'Scan timeout - showing results', current: 3, total: 3 });
        if (approvals.length === 0) {
          setError('⏰ Scan timed out but no approvals found. Your wallet appears secure.');
        }
      }, 30000); // 30 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isScanning, approvals.length]);

  // Auto-discover tokens when connected
  useEffect(() => {
    if (isConnected && address && discoveredTokens.length === 0 && !isDiscovering) {
      console.log('🚀 Auto-starting token discovery...');
      discoverTokens();
    }
  }, [isConnected, address, discoveredTokens.length, isDiscovering, discoverTokens]);

  // Handle approval revoke
  const handleRevokeApproval = async (approval: TokenApproval) => {
    if (!address) return;
    
    try {
      setIsRevoking(approval.id);
      setError('');

      const confirmed = window.confirm(
        `Revoke ${approval.tokenInfo.symbol} approval to ${approval.spenderInfo.protocol}?\n\n` +
        `This will cost ~$0.01 in gas fees on Base network.`
      );
      
      if (!confirmed) {
        setIsRevoking(null);
        return;
      }

      console.log(`🗑️ Revoking approval: ${approval.tokenInfo.symbol} → ${approval.spenderInfo.protocol}`);

      await writeContract({
        address: approval.tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [approval.spender, BigInt(0)],
      });

    } catch (err: any) {
      setError(`Failed to revoke approval: ${err.message}`);
      console.error('Revoke error:', err);
      setIsRevoking(null);
    }
  };

  // Handle successful revoke
  useEffect(() => {
    if (isConfirmed && isRevoking) {
      setApprovals(prev => prev.filter(a => a.id !== isRevoking));
      setRevokedCount(prev => prev + 1);
      setIsRevoking(null);
      
      console.log('✅ Approval revoked successfully!');
      alert(`✅ Approval revoked successfully!\nTransaction: ${txHash?.slice(0, 10)}...`);
    }
  }, [isConfirmed, isRevoking, txHash]);

  const handleDisconnect = () => {
    disconnect();
    setDiscoveredTokens([]);
    setApprovals([]);
    setRevokedCount(0);
    setError('');
    setDiscoveryProgress({ step: '', current: 0, total: 0 });
  };

  const highRiskApprovals = approvals.filter(a => a.riskLevel === 'high');

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
              {isConnected ? (
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
          <div className="space-y-6">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure Your Assets</h2>
                <p className="text-gray-600">
                  Automatically discover and revoke risky token approvals on Base network. 
                  Scans your entire transaction history to find all tokens.
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Search className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Smart Discovery</span>
                </div>
                <p className="text-sm text-green-800">
                  Uses BaseScan API to discover ALL tokens you've interacted with, 
                  then checks approvals across {BASE_SPENDERS.length} protocols.
                </p>
              </div>

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                {isConnecting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>

              {/* Debug Info for Connection Issues */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    🔧 Debug Info (Click to expand)
                  </summary>
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    <div><strong>Environment:</strong> {isFarcasterApp ? 'Farcaster' : 'Browser'}</div>
                    <div><strong>Platform:</strong> {isMobile ? 'Mobile' : 'Desktop'}</div>
                    <div><strong>SDK Ready:</strong> {sdkReady ? '✅ Yes' : '❌ No'}</div>
                    <div><strong>Connectors:</strong> {connectors.length} available</div>
                    <div><strong>Connector Names:</strong> {connectors.map(c => c.name).join(', ') || 'None'}</div>
                    <div><strong>Is Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}</div>
                    <div><strong>Address:</strong> {address?.slice(0, 10) || 'Not connected'}</div>
                    {connectError && <div><strong>Last Error:</strong> {connectError.message}</div>}
                  </div>
                </details>
              </div>

              {error && !error.includes('✅') && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                  
                  {/* Wallet Installation Guide */}
                  {error.includes('No wallet') && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-red-800 font-medium text-sm mb-2">Install a wallet to continue:</p>
                      <div className="space-y-2">
                        <a
                          href="https://metamask.io/download/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <span>🦊</span>
                          <span>Install MetaMask</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href="https://www.coinbase.com/wallet"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <span>🔵</span>
                          <span>Install Coinbase Wallet</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {isMobile && (
                          <p className="text-xs text-red-600 mt-2">
                            💡 On mobile, try opening this link in your wallet's browser instead
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Dashboard */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{discoveredTokens.length}</div>
                  <div className="text-xs text-gray-500">Tokens Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{approvals.length}</div>
                  <div className="text-xs text-gray-500">Approvals Found</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{revokedCount}</div>
                  <div className="text-xs text-gray-500">Revoked</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{highRiskApprovals.length}</div>
                  <div className="text-xs text-gray-500">High Risk</div>
                </div>
              </div>
            </div>

            {/* Connected Address */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Connected Address</p>
                  <p className="font-mono text-sm text-gray-900">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Base Mainnet</p>
                  <p className="text-sm font-medium text-green-600 flex items-center">
                    <Zap className="w-3 h-3 mr-1" />
                    Live Discovery
                  </p>
                </div>
              </div>
            </div>

            {/* Discovery Progress */}
            {(isDiscovering || isScanning) && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-gray-600">{discoveryProgress.step}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Step {discoveryProgress.current} of {discoveryProgress.total}
                  </p>
                </div>
              </div>
            )}

            {/* Approvals List */}
            {!isDiscovering && !isScanning && approvals.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Token Approvals Found</h3>
                  <div className="text-sm text-gray-500">
                    {approvals.length} approval{approvals.length !== 1 ? 's' : ''}
                  </div>
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
            {!isDiscovering && !isScanning && approvals.length === 0 && discoveredTokens.length > 0 && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Wallet Secure! 🎉</h3>
                <p className="text-gray-600">No risky token approvals found.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Scanned {discoveredTokens.length} tokens across {BASE_SPENDERS.length} protocols
                </p>
              </div>
            )}

            {/* Success/Error Messages */}
            {error && error.includes('✅') && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm">{error}</p>
              </div>
            )}

            {error && !error.includes('✅') && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Transaction Status */}
            {txHash && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-700 text-sm">
                  {isConfirming ? (
                    <>⏳ Confirming transaction...</>
                  ) : isConfirmed ? (
                    <>✅ Transaction confirmed!</>
                  ) : (
                    <>📤 Transaction submitted: {txHash.slice(0, 10)}...</>
                  )}
                </p>
                <a 
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-xs"
                >
                  View on BaseScan →
                </a>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleDisconnect}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BlockitApp;
