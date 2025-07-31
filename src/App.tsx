import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Check, Loader, ExternalLink, Trash2, Zap, DollarSign, Wifi, WifiOff, Database, Search, Coins, Activity } from 'lucide-react';

// REAL wagmi imports for blockchain interaction
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';

// Farcaster SDK
import { sdk } from '@farcaster/miniapp-sdk';

// Import spender configuration
import { BASE_SPENDERS, getSpenderByAddress } from './config/baseConfig';

// REAL ERC-20 ABI for actual contract calls
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
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

// Popular Base network tokens to check for balances
const POPULAR_BASE_TOKENS = [
  { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', symbol: 'USDbC', name: 'USD Base Coin', decimals: 6 },
  { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
  { address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', decimals: 18 },
  { address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', decimals: 8 },
  { address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', symbol: 'AERO', name: 'Aerodrome Finance', decimals: 18 },
  { address: '0x4ed4E862860beD51a9570B96d89aF5E1B0Efefed', symbol: 'DEGEN', name: 'Degen', decimals: 18 },
  { address: '0x532f27101965dd16442E59d40670FaF5eBb142E4', symbol: 'BRETT', name: 'Brett', decimals: 18 },
  { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  { address: '0xA88594D404727625A9437C3f886C7643872296AE', symbol: 'WELL', name: 'Moonwell', decimals: 18 },
] as const;

// Type definitions
interface DiscoveredToken {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  balance: bigint;
  balanceFormatted: string;
  hasBalance: boolean;
}

interface TokenApproval {
  id: string;
  tokenAddress: `0x${string}`;
  tokenInfo: DiscoveredToken;
  spender: `0x${string}`;
  spenderInfo: {
    address: `0x${string}`;
    name: string;
    protocol: string;
    risk: 'low' | 'medium' | 'high';
    category: string;
    website?: string;
  };
  allowance: bigint;
  allowanceFormatted: string;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedValue: number;
  isUnlimited: boolean;
}

// TokenCard component for displaying owned tokens
interface TokenCardProps {
  token: DiscoveredToken;
}

const TokenCard: React.FC<TokenCardProps> = ({ token }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-3">
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
        {token.symbol.charAt(0)}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 text-sm">{token.symbol}</h4>
        <p className="text-xs text-gray-500">{token.name}</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-sm text-gray-900">
          {parseFloat(token.balanceFormatted).toFixed(6)}
        </p>
        <p className="text-xs text-gray-500">{token.symbol}</p>
      </div>
    </div>
  </div>
);

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
            <h3 className="font-semibold text-gray-900">{approval.tokenInfo.symbol}</h3>
            <p className="text-sm text-gray-500">Balance: {parseFloat(approval.tokenInfo.balanceFormatted).toFixed(4)}</p>
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
  const [discoveredTokens, setDiscoveredTokens] = useState<DiscoveredToken[]>([]);
  const [tokenApprovals, setTokenApprovals] = useState<TokenApproval[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [revokedCount, setRevokedCount] = useState(0);
  const [error, setError] = useState('');
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState({ step: '', current: 0, total: 0 });

  // REAL wagmi hooks for blockchain interaction
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Real ERC-20 contract interaction hooks
  const { writeContract, isPending: isWritePending, error: writeError, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Step 1: Check balances for popular tokens
  const balanceContracts = React.useMemo(() => {
    if (!address) return [];
    
    return POPULAR_BASE_TOKENS.map(token => ({
      address: token.address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    }));
  }, [address]);

  const { 
    data: balanceResults, 
    isLoading: isLoadingBalances, 
    error: balanceError 
  } = useReadContracts({
    contracts: balanceContracts,
    query: {
      enabled: !!address && balanceContracts.length > 0,
    }
  });

  // Step 2: Check approvals for tokens with balance
  const approvalContracts = React.useMemo(() => {
    if (!address || discoveredTokens.length === 0) return [];
    
    const contracts = [];
    const tokensWithBalance = discoveredTokens.filter(t => t.hasBalance);
    
    // Only check approvals for tokens the user actually owns
    for (const token of tokensWithBalance) {
      for (const spender of BASE_SPENDERS) {
        contracts.push({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, spender.address],
        });
      }
    }
    
    return contracts;
  }, [address, discoveredTokens]);

  const { 
    data: approvalResults, 
    isLoading: isLoadingApprovals, 
    error: approvalError 
  } = useReadContracts({
    contracts: approvalContracts,
    query: {
      enabled: !!address && approvalContracts.length > 0 && discoveredTokens.length > 0,
    }
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing Blockit with Token Discovery...');
      
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
      
      console.log('Blockit initialized with Personal Token Discovery', { 
        isMobileDevice, 
        isInFarcaster,
        tokens: POPULAR_BASE_TOKENS.length,
        spenders: BASE_SPENDERS.length
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

  // Process balance results to discover owned tokens
  useEffect(() => {
    if (balanceResults && address && !isLoadingBalances) {
      console.log('🔍 Processing wallet token discovery...');
      setDiscoveryProgress({ step: 'Analyzing token balances...', current: 1, total: 2 });
      
      const discovered: DiscoveredToken[] = [];
      let tokensWithBalance = 0;

      POPULAR_BASE_TOKENS.forEach((token, index) => {
        const result = balanceResults[index];
        
        if (result.status === 'success' && result.result !== undefined) {
          const balance = result.result as bigint;
          const hasBalance = balance > 0n;
          
          if (hasBalance) {
            tokensWithBalance++;
            console.log(`✅ Found ${token.symbol}: ${formatUnits(balance, token.decimals)}`);
          }

          discovered.push({
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            balance,
            balanceFormatted: formatUnits(balance, token.decimals),
            hasBalance,
          });
        }
      });

      setDiscoveredTokens(discovered);
      setIsDiscovering(false);
      
      console.log(`🎉 Token discovery complete: Found balances in ${tokensWithBalance}/${POPULAR_BASE_TOKENS.length} tokens`);
      
      if (tokensWithBalance === 0) {
        setError('✅ No ERC-20 token balances found - wallet contains only ETH!');
        setDiscoveryProgress({ step: 'Complete - ETH only wallet', current: 2, total: 2 });
      } else {
        // Start approval scanning for owned tokens
        setIsScanning(true);
        setDiscoveryProgress({ step: `Scanning approvals for ${tokensWithBalance} owned tokens...`, current: 2, total: 2 });
        console.log(`🔍 Starting approval scan for ${tokensWithBalance} tokens with balance`);
      }
    }

    if (balanceError) {
      setError(`Token discovery failed: ${balanceError.message}`);
      setIsDiscovering(false);
    }
  }, [balanceResults, isLoadingBalances, address, balanceError]);

  // Process approval results for owned tokens
  useEffect(() => {
    if (approvalResults && address && !isLoadingApprovals && discoveredTokens.length > 0) {
      console.log('🔍 Processing approval scan results for owned tokens...');
      
      const approvals: TokenApproval[] = [];
      const tokensWithBalance = discoveredTokens.filter(t => t.hasBalance);
      let resultIndex = 0;

      // Process results for each owned token-spender combination
      for (const token of tokensWithBalance) {
        for (const spender of BASE_SPENDERS) {
          const result = approvalResults[resultIndex];
          resultIndex++;

          if (result.status === 'success' && result.result) {
            const allowance = result.result as bigint;
            
            // Only show approvals where allowance > 0 (REAL approvals only)
            if (allowance > 0n) {
              const isUnlimited = allowance >= 2n ** 255n;
              const spenderInfo = getSpenderByAddress(spender.address.toLowerCase());
              
              if (spenderInfo) {
                const approval: TokenApproval = {
                  id: `${token.address}-${spender.address}`,
                  tokenAddress: token.address,
                  tokenInfo: token,
                  spender: spender.address,
                  spenderInfo,
                  allowance,
                  allowanceFormatted: isUnlimited 
                    ? 'Unlimited' 
                    : formatUnits(allowance, token.decimals),
                  riskLevel: spenderInfo.risk,
                  estimatedValue: isUnlimited ? 1000000 : Number(formatUnits(allowance, token.decimals)) * 1, // Rough USD estimate
                  isUnlimited,
                };

                approvals.push(approval);
                console.log(`🚨 Found approval: ${token.symbol} → ${spenderInfo.protocol} (${spenderInfo.risk} risk)`);
              }
            }
          }
        }
      }

      setTokenApprovals(approvals);
      setIsScanning(false);
      setDiscoveryProgress({ step: 'Discovery complete!', current: 2, total: 2 });
      
      if (approvals.length === 0) {
        setError(`✅ No risky approvals found for your ${tokensWithBalance.length} tokens! Your wallet is secure.`);
        console.log(`✅ Personal scan complete: No approvals found for owned tokens`);
      } else {
        setError('');
        console.log(`⚠️ Personal scan complete: Found ${approvals.length} approvals across ${tokensWithBalance.length} owned tokens`);
      }
    }

    if (approvalError) {
      setError(`Approval scan failed: ${approvalError.message}`);
      setIsScanning(false);
    }
  }, [approvalResults, isLoadingApprovals, address, discoveredTokens, approvalError]);

  // Auto-start discovery when connected
  useEffect(() => {
    if (isConnected && address && discoveredTokens.length === 0) {
      console.log('🚀 Starting personal token discovery...');
      setIsDiscovering(true);
      setError('');
      setDiscoveryProgress({ step: 'Checking your token balances...', current: 0, total: 2 });
    }
  }, [isConnected, address, discoveredTokens.length]);

  const handleRevokeApproval = async (approval: TokenApproval) => {
    if (!address) return;
    
    try {
      setIsRevoking(approval.id);
      setError('');

      const confirmed = window.confirm(
        `Revoke ${approval.tokenInfo.symbol} approval to ${approval.spenderInfo.protocol}?\n\n` +
        `Your balance: ${approval.tokenInfo.balanceFormatted} ${approval.tokenInfo.symbol}\n` +
        `Current allowance: ${approval.allowanceFormatted}\n` +
        `Risk level: ${approval.riskLevel}\n\n` +
        `This will cost ~$0.01 in gas fees and prevent future access to your tokens.`
      );
      
      if (!confirmed) {
        setIsRevoking(null);
        return;
      }

      console.log(`🗑️ Revoking approval: ${approval.tokenInfo.symbol} → ${approval.spenderInfo.protocol}`);

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
      setTokenApprovals(prev => prev.filter(a => a.id !== isRevoking));
      setRevokedCount(prev => prev + 1);
      setIsRevoking(null);
      
      console.log('REAL revoke transaction confirmed:', txHash);
      alert(`✅ Approval revoked successfully!\n\nTransaction: ${txHash?.slice(0, 10)}...\nView on BaseScan: https://basescan.org/tx/${txHash}`);
    }
  }, [isConfirmed, isRevoking, txHash]);

  const handleDisconnect = () => {
    disconnect();
    setDiscoveredTokens([]);
    setTokenApprovals([]);
    setRevokedCount(0);
    setError('');
    setDiscoveryProgress({ step: '', current: 0, total: 0 });
  };

  const tokensWithBalance = discoveredTokens.filter(t => t.hasBalance);
  const highRiskApprovals = tokenApprovals.filter(a => a.riskLevel === 'high');
  const mediumRiskApprovals = tokenApprovals.filter(a => a.riskLevel === 'medium');
  const totalValue = tokenApprovals.reduce((acc, approval) => acc + approval.estimatedValue, 0);

  if (!sdkReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Initializing Blockit...</p>
          <p className="text-sm text-gray-500">Personal Token Discovery System</p>
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
                <h1 className="text-xl font-bold text-gray-900">Blockit Pro</h1>
                <p className="text-sm text-gray-500">
                  Personal Token Discovery
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
                <Search className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover Your Tokens</h2>
                <p className="text-gray-600">
                  Automatically identify tokens in your wallet and scan only those for risky approvals. 
                  More efficient, more personal, more secure.
                </p>
              </div>

              {/* Enhanced Features List */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                    <Search className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-semibold text-green-900">
                    Smart Discovery System 2025
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center space-x-2 text-green-700">
                    <Coins className="w-4 h-4" />
                    <span><strong>Personal</strong> - Only scans tokens you own</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Zap className="w-4 h-4" />
                    <span><strong>Efficient</strong> - Faster, targeted scanning</span>
                  </div>
                  <div className="flex items-center space-x-2 text-purple-700">
                    <Activity className="w-4 h-4" />
                    <span><strong>Real-time</strong> - Live balance checking</span>
                  </div>
                  <div className="flex items-center space-x-2 text-orange-700">
                    <Shield className="w-4 h-4" />
                    <span><strong>Secure</strong> - ~$0.01 gas per revoke</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Checking {POPULAR_BASE_TOKENS.length} popular Base tokens
                </div>
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
                    <Search className="w-5 h-5" />
                    <span>Connect & Discover My Tokens</span>
                  </>
                )}
              </button>

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
                  <div className="text-2xl font-bold text-blue-600">{tokensWithBalance.length}</div>
                  <div className="text-xs text-gray-500">Tokens Owned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{tokenApprovals.length}</div>
                  <div className="text-xs text-gray-500">Approvals Found</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{revokedCount}</div>
                  <div className="text-xs text-gray-500">Revoked</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{highRiskApprovals.length}</div>
                  <div className="text-xs text-gray-500">High Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    ${totalValue > 1000000 ? '1M+' : totalValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">At Risk</div>
                </div>
              </div>
            </div>

            {/* Discovery Progress */}
            {(isDiscovering || isScanning) && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Loader className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="font-medium text-gray-900">
                    {discoveryProgress.step}
                  </span>
                </div>
                
                {discoveryProgress.total > 0 && (
                  <div className="space-y-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((discoveryProgress.current / discoveryProgress.total) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Step {discoveryProgress.current} of {discoveryProgress.total}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Discovered Tokens Section */}
            {tokensWithBalance.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Coins className="w-5 h-5" />
                    <span>Your Tokens ({tokensWithBalance.length})</span>
                  </h3>
                  <button
                    onClick={() => setShowTokenDetails(!showTokenDetails)}
                    className="text-blue-600 text-sm hover:text-blue-700"
                  >
                    {showTokenDetails ? 'Hide' : 'Show'} Details
                  </button>
                </div>
                
                {showTokenDetails && (
                  <div className="space-y-2">
                    {tokensWithBalance.map(token => (
                      <TokenCard key={token.address} token={token} />
                    ))}
                  </div>
                )}
                
                {!showTokenDetails && (
                  <div className="text-sm text-gray-600">
                    Found balances in: {tokensWithBalance.map(t => t.symbol).join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Token Approvals List */}
            {tokenApprovals.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span>Risky Approvals Found</span>
                  </h3>
                  <div className="text-sm text-gray-500">
                    From your {tokensWithBalance.length} tokens
                  </div>
                </div>
                
                {tokenApprovals.map(approval => (
                  <ApprovalCard
                    key={approval.id}
                    approval={approval}
                    onRevoke={handleRevokeApproval}
                    isRevoking={isRevoking === approval.id}
                  />
                ))}
              </div>
            )}

            {/* Empty State - No Approvals */}
            {!isDiscovering && !isScanning && tokenApprovals.length === 0 && tokensWithBalance.length > 0 && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Tokens Are Secure! 🎉</h3>
                <p className="text-gray-600 mb-2">No risky approvals found</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm mx-auto">
                  <p className="text-sm text-green-800">
                    ✅ Scanned {tokensWithBalance.length} owned tokens
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Personal discovery complete
                  </p>
                </div>
              </div>
            )}

            {/* Empty State - No Tokens */}
            {!isDiscovering && !isScanning && tokensWithBalance.length === 0 && discoveredTokens.length > 0 && (
              <div className="text-center py-12">
                <Coins className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ETH Only Wallet</h3>
                <p className="text-gray-600 mb-2">No ERC-20 token balances detected</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm mx-auto">
                  <p className="text-sm text-blue-800">
                    ✅ Checked {POPULAR_BASE_TOKENS.length} popular tokens
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Your wallet appears to only hold ETH
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className={`border rounded-lg p-4 ${
                error.includes('secure') || error.includes('ETH') 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm ${
                  error.includes('secure') || error.includes('ETH')
                    ? 'text-green-700' 
                    : 'text-red-700'
                }`}>
                  {error}
                </p>
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
                    <>⏳ Confirming revoke transaction...</>
                  ) : isConfirmed ? (
                    <>✅ Transaction confirmed!</>
                  ) : (
                    <>📤 Revoke transaction submitted: {txHash.slice(0, 10)}...</>
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

            {/* Controls */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setDiscoveredTokens([]);
                  setTokenApprovals([]);
                  setError('');
                  setDiscoveryProgress({ step: '', current: 0, total: 0 });
                }}
                disabled={isDiscovering || isScanning}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Rediscover</span>
              </button>
              
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BlockitApp;
