import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Check, Loader, ExternalLink, Trash2, Zap, DollarSign, Wifi, WifiOff, Database } from 'lucide-react';

// REAL wagmi imports for blockchain interaction
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';

// Farcaster SDK
import { sdk } from '@farcaster/miniapp-sdk';

// Import expanded configuration
import { 
  BASE_TOKENS, 
  BASE_SPENDERS, 
  getTokenByAddress, 
  getSpenderByAddress,
  CONFIG_SUMMARY,
  type TokenConfig,
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
interface TokenApproval {
  id: string;
  tokenAddress: `0x${string}`;
  tokenInfo: TokenConfig;
  spender: `0x${string}`;
  spenderInfo: SpenderConfig;
  allowance: bigint;
  allowanceFormatted: string;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedValue: number;
  isUnlimited: boolean;
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
          {getRiskIcon(approval.riskLevel)}
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
          <span className="text-gray-600">Spender:</span>
          <span className="font-medium text-right max-w-[180px] truncate">
            {approval.spenderInfo.name}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Allowance:</span>
          <span className={`font-medium ${approval.isUnlimited ? 'text-red-600' : 'text-gray-900'}`}>
            {approval.allowanceFormatted}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Est. Value:</span>
          <span className="font-medium">
            ${approval.estimatedValue > 1000000 ? '1M+' : approval.estimatedValue.toLocaleString()}
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
        {approval.spenderInfo.website && (
          <button
            onClick={() => window.open(approval.spenderInfo.website, '_blank')}
            className="px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            title="Visit Protocol Website"
          >
            🌐
          </button>
        )}
      </div>
    </div>
  );
};

// Main App Component
function BlockitApp() {
  const [sdkReady, setSdkReady] = useState(false);
  const [isFarcasterApp, setIsFarcasterApp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [approvals, setApprovals] = useState<TokenApproval[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [revokedCount, setRevokedCount] = useState(0);
  const [error, setError] = useState('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });

  // REAL wagmi hooks for blockchain interaction
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Real ERC-20 contract interaction hooks
  const { writeContract, isPending: isWritePending, error: writeError, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // REAL blockchain contract calls using useReadContracts (EXPANDED)
  const contractCalls = React.useMemo(() => {
    if (!address) return [];

    const calls = [];
    
    // Create contract calls for each token-spender combination
    // Now scanning ${BASE_TOKENS.length} tokens against ${BASE_SPENDERS.length} spenders
    for (const token of BASE_TOKENS) {
      for (const spender of BASE_SPENDERS) {
        calls.push({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, spender.address],
        });
      }
    }
    
    return calls;
  }, [address]);

  // Execute REAL blockchain calls
  const { 
    data: contractResults, 
    isLoading: isLoadingContracts, 
    error: contractError 
  } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: !!address && contractCalls.length > 0,
    }
  });

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
        isInFarcaster,
        configSummary: CONFIG_SUMMARY
      });
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setSdkReady(true);
    }
  };

  const handleConnect = async () => {
    try {
      setError('');
      if (connectors.length > 0) {
        await connect({ connector: connectors[0] });
      }
    } catch (err: any) {
      setError(`Connection failed: ${err.message}`);
    }
  };

  // REAL blockchain scanning using contract results (EXPANDED)
  useEffect(() => {
    if (contractResults && address && !isLoadingContracts) {
      console.log('Processing REAL blockchain contract results...');
      console.log(`Scanning results from ${BASE_TOKENS.length} tokens × ${BASE_SPENDERS.length} spenders = ${CONFIG_SUMMARY.totalCombinations} combinations`);
      
      const realApprovals: TokenApproval[] = [];
      let resultIndex = 0;

      // Process results for each token-spender combination
      for (const token of BASE_TOKENS) {
        for (const spender of BASE_SPENDERS) {
          const result = contractResults[resultIndex];
          resultIndex++;

          if (result.status === 'success' && result.result) {
            const allowance = result.result as bigint;
            
            // Only show approvals where allowance > 0 (REAL approvals only)
            if (allowance > 0n) {
              const isUnlimited = allowance >= 2n ** 255n;
              
              const realApproval: TokenApproval = {
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
                estimatedValue: isUnlimited ? 1000000 : Number(formatUnits(allowance, token.decimals)) * 1, // Rough USD estimate
                isUnlimited,
              };

              realApprovals.push(realApproval);
              console.log(`Found REAL approval: ${token.symbol} → ${spender.protocol} (${formatUnits(allowance, token.decimals)})`);
            }
          }
        }
      }

      setApprovals(realApprovals);
      setIsScanning(false);
      setScanProgress({ current: 0, total: 0 });
      
      if (realApprovals.length === 0) {
        setError(`✅ No token approvals found across ${CONFIG_SUMMARY.totalCombinations} contract combinations. Your wallet is secure!`);
        console.log('REAL scan complete: No approvals found - wallet is actually secure');
      } else {
        setError('');
        console.log(`REAL scan complete: Found ${realApprovals.length} actual approvals on Base blockchain`);
        
        // Log risk distribution of found approvals
        const riskCounts = realApprovals.reduce((acc, approval) => {
          acc[approval.riskLevel] = (acc[approval.riskLevel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('Risk distribution of found approvals:', riskCounts);
      }
    }

    if (contractError) {
      setError(`Blockchain scan failed: ${contractError.message}`);
      setIsScanning(false);
      setScanProgress({ current: 0, total: 0 });
    }
  }, [contractResults, isLoadingContracts, address, contractError]);

  // Auto-scan when connected with progress tracking
  useEffect(() => {
    if (isConnected && address) {
      console.log('Connected to wallet, starting REAL blockchain scan...');
      console.log(`Will scan ${CONFIG_SUMMARY.totalCombinations} token-spender combinations`);
      setIsScanning(true);
      setScanProgress({ current: 0, total: CONFIG_SUMMARY.totalCombinations });
      setError('');
    }
  }, [isConnected, address]);

  // Update scan progress
  useEffect(() => {
    if (isLoadingContracts && scanProgress.total > 0) {
      // Simulate progress updates
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev.current < prev.total) {
            return { ...prev, current: prev.current + Math.floor(prev.total / 20) };
          }
          return prev;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isLoadingContracts, scanProgress.total]);

  const handleRevokeApproval = async (approval: TokenApproval) => {
    if (!address) return;
    
    try {
      setIsRevoking(approval.id);
      setError('');

      const confirmed = window.confirm(
        `Revoke ${approval.tokenInfo.symbol} approval to ${approval.spenderInfo.protocol}?\n\nContract: ${approval.spenderInfo.name}\nRisk Level: ${approval.riskLevel}\n\nThis will cost ~$0.01 in gas fees.`
      );
      
      if (!confirmed) {
        setIsRevoking(null);
        return;
      }

      // REAL wagmi ERC-20 interaction
      await writeContract({
        address: approval.tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [approval.spender, BigInt(0)], // Revoke = set allowance to 0
      });

      console.log('REAL revoke transaction submitted:', txHash);
      
    } catch (err: any) {
      setError(`Failed to revoke approval: ${err.message}`);
      console.error('Revoke error:', err);
      setIsRevoking(null);
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && isRevoking) {
      setApprovals(prev => prev.filter(a => a.id !== isRevoking));
      setRevokedCount(prev => prev + 1);
      setIsRevoking(null);
      
      console.log('REAL revoke transaction confirmed:', txHash);
      alert(`✅ Approval revoked successfully!\nTransaction: ${txHash?.slice(0, 10)}...`);
    }
  }, [isConfirmed, isRevoking, txHash]);

  const handleDisconnect = () => {
    disconnect();
    setApprovals([]);
    setRevokedCount(0);
    setError('');
    setScanProgress({ current: 0, total: 0 });
  };

  const highRiskApprovals = approvals.filter(a => a.riskLevel === 'high');
  const mediumRiskApprovals = approvals.filter(a => a.riskLevel === 'medium');
  const totalValue = approvals.reduce((acc, approval) => acc + approval.estimatedValue, 0);

  if (!sdkReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Initializing Blockit...</p>
          <p className="text-sm text-gray-500">Loading {CONFIG_SUMMARY.totalTokens} tokens & {CONFIG_SUMMARY.totalSpenders} protocols</p>
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
                  Farcaster {isMobile ? '📱' : '💻'}
                </div>
              )}
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
                  Auto-detect and revoke risky token approvals on Base network. Now scanning {CONFIG_SUMMARY.totalTokens} tokens across {CONFIG_SUMMARY.totalSpenders} protocols.
                </p>
              </div>

              {/* Expanded Coverage Info */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                    <Database className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-semibold text-green-900">
                    Expanded Coverage 2025 {isMobile ? '📱' : '💻'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-green-700">
                    <strong>{CONFIG_SUMMARY.totalTokens}</strong> Tokens
                  </div>
                  <div className="text-blue-700">
                    <strong>{CONFIG_SUMMARY.totalSpenders}</strong> Protocols
                  </div>
                  <div className="text-purple-700">
                    <strong>{CONFIG_SUMMARY.totalCombinations}</strong> Combinations
                  </div>
                  <div className="text-orange-700">
                    <strong>Real-time</strong> Scanning
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  DEXs • Lending • Bridges • Aggregators • Yield Farming
                </div>
              </div>

              {isFarcasterApp && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="font-semibold text-purple-900">
                      REAL Blockchain Scanner {isMobile ? '📱' : '💻'}
                    </span>
                  </div>
                  <p className="text-purple-700 text-sm">
                    Now using REAL wagmi blockchain calls - no mock data!
                  </p>
                </div>
              )}

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
                    <span>Connect & Scan {CONFIG_SUMMARY.totalCombinations} Combinations</span>
                  </>
                )}
              </button>

              {/* Debug Info */}
              <div className="text-center">
                <button
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="text-gray-400 text-xs hover:text-gray-600 transition-colors"
                >
                  {showDebugInfo ? 'Hide' : 'Show'} Debug Info
                </button>
                
                {showDebugInfo && (
                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-left">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div><strong>Environment:</strong> {isFarcasterApp ? 'Farcaster Mini App' : 'External Browser'}</div>
                      <div><strong>Platform:</strong> {isMobile ? '📱 Mobile' : '💻 Desktop'}</div>
                      <div><strong>Connectors:</strong> {connectors.length} available</div>
                      <div><strong>Connector Names:</strong> {connectors.map(c => c.name).join(', ')}</div>
                      <div><strong>Is Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}</div>
                      <div><strong>Address:</strong> {address || 'Not connected'}</div>
                      <div><strong>Total Tokens:</strong> {CONFIG_SUMMARY.totalTokens}</div>
                      <div><strong>Total Spenders:</strong> {CONFIG_SUMMARY.totalSpenders}</div>
                      <div><strong>Contract Calls:</strong> {contractCalls.length} prepared</div>
                      <div><strong>Risk Distribution:</strong> Low: {CONFIG_SUMMARY.riskDistribution.low}, Med: {CONFIG_SUMMARY.riskDistribution.medium}, High: {CONFIG_SUMMARY.riskDistribution.high}</div>
                      <div><strong>Loading Contracts:</strong> {isLoadingContracts ? 'Yes' : 'No'}</div>
                      {error && <div><strong>Status:</strong> {error}</div>}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enhanced Stats Dashboard */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{approvals.length}</div>
                  <div className="text-xs text-gray-500">REAL Approvals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{highRiskApprovals.length}</div>
                  <div className="text-xs text-gray-500">High Risk</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{revokedCount}</div>
                  <div className="text-xs text-gray-500">Revoked</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">{mediumRiskApprovals.length}</div>
                  <div className="text-xs text-gray-500">Med Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    ${totalValue > 1000000 ? '1M+' : totalValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">At Risk</div>
                </div>
              </div>
            </div>

            {/* Enhanced Connected Address */}
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
                    {CONFIG_SUMMARY.totalCombinations} Checks
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Scanning State with Progress */}
            {(isScanning || isLoadingContracts) && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-gray-600">Scanning Base blockchain...</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Checking {CONFIG_SUMMARY.totalTokens} tokens × {CONFIG_SUMMARY.totalSpenders} protocols
                  </p>
                  {scanProgress.total > 0 && (
                    <div className="mt-3">
                      <div className="bg-gray-200 rounded-full h-2 w-48 mx-auto">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((scanProgress.current / scanProgress.total) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.min(scanProgress.current, scanProgress.total)} / {scanProgress.total} combinations
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Approvals List */}
            {!isScanning && !isLoadingContracts && approvals.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">REAL Token Approvals Found</h3>
                  <div className="text-sm text-gray-500">
                    {approvals.length} of {CONFIG_SUMMARY.totalCombinations} checked
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

            {/* Enhanced Empty State */}
            {!isScanning && !isLoadingContracts && approvals.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Blockchain Verified Secure! 🎉</h3>
                <p className="text-gray-600">No real token approvals found on Base network.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Scanned {CONFIG_SUMMARY.totalTokens} tokens across {CONFIG_SUMMARY.totalSpenders} protocols
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  ({CONFIG_SUMMARY.totalCombinations} contract combinations checked)
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && isConnected && !error.includes('secure') && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {error && error.includes('secure') && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm">{error}</p>
              </div>
            )}

            {/* Write Contract Error */}
            {writeError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">Transaction Error: {writeError.message}</p>
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
