import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Check, Loader, ExternalLink, Trash2, Zap, Search, Coins, Activity, Network, TrendingUp, Database, Star } from 'lucide-react';

// REAL wagmi imports for blockchain interaction
import { useAccount, useConnect, useDisconnect } from 'wagmi';

// Farcaster SDK
import { sdk } from '@farcaster/miniapp-sdk';

// Base-focused token discovery hook
import { useBaseTokenDiscovery } from './hooks/useBaseTokenDiscovery';

// Base token discovery card component
interface BaseTokenCardProps {
  token: {
    address: `0x${string}`
    symbol: string
    name: string
    decimals: number
    balance: bigint
    balanceFormatted: string
    hasBalance: boolean
    isBaseNative: boolean
    category: string
    discoveryMethod: string
  }
}

const BaseTokenCard: React.FC<BaseTokenCardProps> = ({ token }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'native': return '⚡';
      case 'stablecoin': return '💰';
      case 'defi': return '🏦';
      case 'meme': return '🐸';
      case 'social': return '💬';
      case 'bridged': return '🌉';
      default: return '💎';
    }
  };

  const getDiscoveryBadge = (method: string) => {
    switch (method) {
      case 'balance': return { text: 'Live Balance', color: 'bg-green-100 text-green-700' };
      case 'transaction': return { text: 'TX History', color: 'bg-blue-100 text-blue-700' };
      case 'known': return { text: 'Base Token', color: 'bg-purple-100 text-purple-700' };
      default: return { text: 'Discovered', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const discovery = getDiscoveryBadge(token.discoveryMethod);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm relative">
          {token.symbol.charAt(0)}
          <div className="absolute -top-1 -right-1 text-xs">
            {getCategoryIcon(token.category)}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-gray-900 text-sm">{token.symbol}</h4>
            {token.isBaseNative && (
              <div className="flex items-center space-x-1 px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                <Network className="w-3 h-3" />
                <span>Base</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{token.name}</p>
          <div className={`px-2 py-0.5 rounded-full text-xs ${discovery.color} inline-block mt-1`}>
            {discovery.text}
          </div>
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
};

// Enhanced Base approval card component
interface BaseApprovalCardProps {
  approval: {
    id: string
    tokenInfo: {
      symbol: string
      name: string
      balanceFormatted: string
      isBaseNative: boolean
      category: string
    }
    spenderInfo: {
      protocol: string
      name: string
      category: string
      website?: string
      isBaseNative: boolean
      tvl?: number
    }
    spender: `0x${string}`
    allowanceFormatted: string
    riskLevel: 'low' | 'medium' | 'high'
    estimatedValue: number
    isUnlimited: boolean
    isBaseNativeToken: boolean
    isBaseNativeProtocol: boolean
  }
  onRevoke: (approval: any) => void
  isRevoking: boolean
}

const BaseApprovalCard: React.FC<BaseApprovalCardProps> = ({ approval, onRevoke, isRevoking }) => {
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
      case 'staking': return '⚡';
      default: return '❓';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold relative">
            {approval.tokenInfo.symbol.charAt(0)}
            {approval.isBaseNativeToken && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                <Network className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{approval.tokenInfo.symbol}</h3>
              {approval.isBaseNativeToken && (
                <span className="px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Base Native</span>
              )}
            </div>
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
            <span className="font-medium text-right max-w-[160px] truncate">
              {approval.spenderInfo.protocol}
            </span>
            {approval.isBaseNativeProtocol && (
              <div className="flex items-center space-x-1 px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                <Network className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Contract:</span>
          <span className="font-medium text-right max-w-[160px] truncate">
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
        {approval.spenderInfo.tvl && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Protocol TVL:</span>
            <span className="font-medium text-green-600">
              ${(approval.spenderInfo.tvl / 1000000).toFixed(0)}M
            </span>
          </div>
        )}
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

// Main Base-Focused Blockit App
function BaseFocusedBlockitApp() {
  const [sdkReady, setSdkReady] = useState(false);
  const [isFarcasterApp, setIsFarcasterApp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  const [showBaseNativeOnly, setShowBaseNativeOnly] = useState(false);

  // REAL wagmi hooks for blockchain interaction
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Base-focused token discovery hook
  const {
    discoveredTokens,
    tokenApprovals,
    discoveryStats,
    discoveryProgress,
    isDiscovering,
    isScanning,
    discoveryError,
    isRevoking,
    revokingApprovalId,
    txHash,
    isConfirming,
    revokeError,
    startDiscovery,
    revokeApproval,
    getTokensWithBalance,
    getBaseNativeTokens,
    getBridgedTokens,
    getApprovalsByRisk,
    getBaseNativeApprovals,
    configSummary,
  } = useBaseTokenDiscovery();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing Base-Focused Blockit mini app...');
      
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
      
      console.log('Base-Focused Blockit initialized', { 
        isMobileDevice, 
        isInFarcaster,
        feature: 'Base Network Token Discovery'
      });
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setSdkReady(true);
    }
  };

  const handleConnect = async () => {
    try {
      if (connectors.length > 0) {
        await connect({ connector: connectors[0] });
      }
    } catch (err: any) {
      console.error('Connection failed:', err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const tokensWithBalance = getTokensWithBalance();
  const baseNativeTokens = getBaseNativeTokens();
  const bridgedTokens = getBridgedTokens();
  const highRiskApprovals = getApprovalsByRisk('high');
  const baseNativeApprovals = getBaseNativeApprovals();
  const totalValue = tokenApprovals.reduce((acc, approval) => acc + approval.estimatedValue, 0);

  const tokensToShow = showBaseNativeOnly ? baseNativeTokens : tokensWithBalance;
  const approvalsToShow = showBaseNativeOnly ? baseNativeApprovals : tokenApprovals;

  if (!sdkReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <Shield className="w-8 h-8 text-white" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <Network className="w-3 h-3 text-white" />
            </div>
          </div>
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Initializing Base-Focused Blockit...</p>
          <p className="text-sm text-gray-500">Base Network Token Discovery System</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center relative">
                <Shield className="w-6 h-6 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <Network className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Blockit Base</h1>
                <p className="text-sm text-gray-500">
                  Base Network Discovery
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isFarcasterApp && (
                <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Farcaster {isMobile ? '📱' : '💻'}
                </div>
              )}
              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                <Network className="w-3 h-3" />
                <span>Base</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {!isConnected ? (
          <div className="space-y-6">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto relative">
                <Search className="w-10 h-10 text-white" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Network className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover Base Tokens</h2>
                <p className="text-gray-600">
                  Advanced Base network token discovery using transaction history, live balances, 
                  and comprehensive Base ecosystem knowledge.
                </p>
              </div>

              {/* Base Network Features */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <Network className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-semibold text-blue-900">
                    Base Network Intelligence 2025
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Database className="w-4 h-4" />
                    <span><strong>Transaction History</strong> - BaseScan API integration</span>
                  </div>
                  <div className="flex items-center space-x-2 text-purple-700">
                    <Star className="w-4 h-4" />
                    <span><strong>Base Native</strong> - Prioritizes Base ecosystem tokens</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-700">
                    <TrendingUp className="w-4 h-4" />
                    <span><strong>Live Discovery</strong> - Real-time balance & approval checking</span>
                  </div>
                  <div className="flex items-center space-x-2 text-orange-700">
                    <Zap className="w-4 h-4" />
                    <span><strong>Ultra-Low Fees</strong> - ~$0.01 gas per transaction</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Scanning {configSummary.totalTokens} tokens × {configSummary.totalProtocols} protocols on Base
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                {isConnecting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Discover My Base Tokens</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enhanced Stats Dashboard */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{tokensWithBalance.length}</div>
                  <div className="text-xs text-gray-500">Total Tokens</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{tokenApprovals.length}</div>
                  <div className="text-xs text-gray-500">Risky Approvals</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{baseNativeTokens.length}</div>
                  <div className="text-xs text-gray-500">Base Native</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{bridgedTokens.length}</div>
                  <div className="text-xs text-gray-500">Bridged</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
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
                
                <div className="space-y-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((discoveryProgress.current / discoveryProgress.total) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Phase: {discoveryProgress.phase}</span>
                    <span>{discoveryProgress.current} / {discoveryProgress.total}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Base Discovery Stats */}
            {discoveryStats && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                  <Network className="w-5 h-5" />
                  <span>Base Discovery Results</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700"><strong>Discovery Methods:</strong></p>
                    <p className="text-xs text-gray-600">
                      Balance: {discoveryStats.discoveryMethods.balance} • 
                      TX History: {discoveryStats.discoveryMethods.transaction} • 
                      Known: {discoveryStats.discoveryMethods.known}
                    </p>
                  </div>
                  <div>
                    <p className="text-purple-700"><strong>Base Ecosystem:</strong></p>
                    <p className="text-xs text-gray-600">
                      Native Tokens: {discoveryStats.baseNativeTokens} • 
                      Native Approvals: {discoveryStats.baseNativeApprovals}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Discovered Tokens Section */}
            {tokensWithBalance.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Coins className="w-5 h-5" />
                    <span>Your Base Tokens ({tokensToShow.length})</span>
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowBaseNativeOnly(!showBaseNativeOnly)}
                      className={`px-2 py-1 text-xs rounded ${
                        showBaseNativeOnly 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Base Only
                    </button>
                    <button
                      onClick={() => setShowTokenDetails(!showTokenDetails)}
                      className="text-blue-600 text-sm hover:text-blue-700"
                    >
                      {showTokenDetails ? 'Hide' : 'Show'} Details
                    </button>
                  </div>
                </div>
                
                {showTokenDetails && (
                  <div className="space-y-2">
                    {tokensToShow.map(token => (
                      <BaseTokenCard key={token.address} token={token} />
                    ))}
                  </div>
                )}
                
                {!showTokenDetails && (
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Base Native:</strong> {baseNativeTokens.map(t => t.symbol).join(', ') || 'None'}
                    </p>
                    <p className="mt-1">
                      <strong>Bridged:</strong> {bridgedTokens.map(t => t.symbol).join(', ') || 'None'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Token Approvals List */}
            {approvalsToShow.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span>Base Approvals Found ({approvalsToShow.length})</span>
                  </h3>
                  <div className="text-sm text-gray-500 text-right">
                    {showBaseNativeOnly ? 'Base Native Only' : 'All Protocols'}
                  </div>
                </div>
                
                {approvalsToShow.map(approval => (
                  <BaseApprovalCard
                    key={approval.id}
                    approval={approval}
                    onRevoke={revokeApproval}
                    isRevoking={revokingApprovalId === approval.id}
                  />
                ))}
              </div>
            )}

            {/* Empty States */}
            {!isDiscovering && !isScanning && tokensWithBalance.length > 0 && approvalsToShow.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {showBaseNativeOnly ? 'Base Native Tokens Secure!' : 'Your Base Tokens Are Secure!'} 🎉
                </h3>
                <p className="text-gray-600 mb-2">No risky approvals found</p>
                {discoveryStats && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm mx-auto">
                    <p className="text-sm text-green-800">
                      ✅ Scanned {discoveryStats.tokensWithBalance} owned tokens
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {discoveryStats.baseNativeTokens} Base native, {discoveryStats.bridgedTokens} bridged
                    </p>
                  </div>
                )}
              </div>
            )}

            {!isDiscovering && !isScanning && tokensWithBalance.length === 0 && discoveredTokens.length > 0 && (
              <div className="text-center py-12">
                <Coins className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ETH Only Base Wallet</h3>
                <p className="text-gray-600 mb-2">No ERC-20 token balances detected on Base</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm mx-auto">
                  <p className="text-sm text-blue-800">
                    ✅ Checked {discoveredTokens.length} Base ecosystem tokens
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Your Base wallet appears to only hold ETH
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {discoveryError && (
              <div className={`border rounded-lg p-4 ${
                discoveryError.includes('secure') || discoveryError.includes('ETH') 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm ${
                  discoveryError.includes('secure') || discoveryError.includes('ETH')
                    ? 'text-green-700' 
                    : 'text-red-700'
                }`}>
                  {discoveryError}
                </p>
              </div>
            )}

            {/* Transaction Status */}
            {txHash && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-700 text-sm">
                  {isConfirming ? (
                    <>⏳ Confirming on Base network...</>
                  ) : (
                    <>📤 Base transaction submitted: {txHash.slice(0, 10)}...</>
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
                onClick={startDiscovery}
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

export default BaseFocusedBlockitApp;
