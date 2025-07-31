import React, { useState, useEffect } from 'react';
import { Shield, Loader, AlertTriangle, Wallet, Network, Settings, BarChart3 } from 'lucide-react';

// REAL wagmi imports for blockchain interaction
import { useAccount, useConnect, useDisconnect, useConnectors } from 'wagmi';

// Import our comprehensive scanning components
import { useBaseTokenDiscovery } from './hooks/useBaseTokenDiscovery';

// Import the SDK properly
import { sdk } from '@farcaster/miniapp-sdk';

// Main Blockit Application Component
function BlockitApp(): React.JSX.Element {
  const [farcasterContext, setFarcasterContext] = useState<any>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Wagmi hooks for wallet connection
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();

  // Use our comprehensive Base token discovery and approval scanner
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
    isRevokePending,
    isConfirming,
    txHash,
    startDiscovery,
    revokeApproval,
    getTokensWithBalance,
    getBaseNativeTokens,
    getBridgedTokens,
    getApprovalsByRisk,
    configSummary
  } = useBaseTokenDiscovery();

  // Initialize Farcaster SDK - EXACTLY as documented
  useEffect(() => {
    // After your app is fully loaded and ready to display
    sdk.actions.ready();
  }, []);

  // Monitor connection state changes
  useEffect(() => {
    if (isConnected && address) {
      console.log('✅ Wallet connected successfully!');
      console.log('Address:', address);
      console.log('Chain:', chain?.name, chain?.id);
    } else if (!isConnected) {
      console.log('❌ Wallet not connected');
    }
  }, [isConnected, address, chain]);

  const handleConnect = async () => {
    try {
      console.log('🔗 Starting wallet connection...');
      console.log('Available connectors:', connectors.map(c => c.name));
      
      if (connectors.length === 0) {
        throw new Error('No wallet connectors available');
      }

      // Try to connect with the first available connector
      // If we're in Farcaster, this should be the Farcaster miniapp connector
      const connector = connectors[0];
      console.log(`🔌 Attempting connection with: ${connector.name}`);
      
      await connect({ connector });
      console.log('✅ Wallet connection initiated');
      
    } catch (err: any) {
      console.error('❌ Wallet connection failed:', err);
      
      // Show detailed error information
      const errorDetails = {
        message: err.message,
        connectors: connectors.length,
        connectorNames: connectors.map(c => c.name),
        userAgent: navigator.userAgent.includes('Farcaster') ? 'Farcaster' : 'Other',
        ethereum: typeof window !== 'undefined' && window.ethereum ? 'Available' : 'Not Available'
      };
      
      console.log('Connection error details:', errorDetails);
      
      const errorMessage = `Connection failed: ${err.message}\n\n` +
                          `Environment: ${errorDetails.userAgent}\n` +
                          `Available connectors: ${errorDetails.connectors}\n` +
                          `Ethereum provider: ${errorDetails.ethereum}\n\n` +
                          `Try refreshing the page or check wallet permissions.`;
                          
      alert(errorMessage);
    }
  };

  const handleDisconnect = () => {
    console.log('🔌 Disconnecting wallet...');
    disconnect();
  };

  const handleManualScan = () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }
    
    console.log('🔍 Starting manual token approval scan...');
    startDiscovery();
  };

  // Get risk summary
  const riskSummary = React.useMemo(() => {
    const high = getApprovalsByRisk('high').length;
    const medium = getApprovalsByRisk('medium').length;
    const low = getApprovalsByRisk('low').length;
    return { high, medium, low, total: high + medium + low };
  }, [tokenApprovals, getApprovalsByRisk]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Blockit</h1>
                <p className="text-sm text-gray-500">Approval Security</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {riskSummary.total > 0 && (
                <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                  {riskSummary.high > 0 ? `${riskSummary.high} HIGH` : `${riskSummary.total} found`}
                </div>
              )}
              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                <Network className="w-3 h-3" />
                <span>Base</span>
              </div>
              <button
                onClick={() => setDebugMode(!debugMode)}
                className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Connection Status */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Wallet className="w-4 h-4" />
              <span>Wallet</span>
            </h3>
            {isConnected && (
              <div className="flex items-center space-x-1 text-green-600 text-sm">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span>Connected</span>
              </div>
            )}
          </div>
          
          {!isConnected ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Connect your wallet to scan for token approvals</p>
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
                    <Wallet className="w-5 h-5" />
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Address:</span>
                <span className="font-mono text-xs">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Network:</span>
                <span className="font-medium">
                  {chain?.name || 'Base'} ({chain?.id || 8453})
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleManualScan}
                  disabled={isDiscovering || isScanning}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isDiscovering || isScanning ? 'Scanning...' : 'Scan Approvals'}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Discovery Progress */}
        {(isDiscovering || isScanning) && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
              <h3 className="font-semibold text-gray-900">Scanning Base Network</h3>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600">{discoveryProgress.step}</p>
              
              {discoveryProgress.total > 0 && (
                <div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((discoveryProgress.current / discoveryProgress.total) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Phase: {discoveryProgress.phase}</span>
                    <span>{discoveryProgress.current} / {discoveryProgress.total}</span>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-blue-600">{configSummary.totalTokens}</div>
                  <div className="text-gray-600">Tokens</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-purple-600">{configSummary.totalProtocols}</div>
                  <div className="text-gray-600">Protocols</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Discovery Stats */}
        {discoveryStats && !isDiscovering && !isScanning && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Scan Results</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{discoveryStats.tokensWithBalance}</div>
                <div className="text-xs text-gray-600">Tokens Owned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{discoveryStats.approvalsFound}</div>
                <div className="text-xs text-gray-600">Approvals Found</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="font-semibold text-red-600">{discoveryStats.riskDistribution.high}</div>
                <div className="text-xs text-gray-600">High Risk</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">{discoveryStats.riskDistribution.medium}</div>
                <div className="text-xs text-gray-600">Medium Risk</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{discoveryStats.riskDistribution.low}</div>
                <div className="text-xs text-gray-600">Low Risk</div>
              </div>
            </div>
          </div>
        )}

        {/* Token Approvals List */}
        {tokenApprovals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Token Approvals ({tokenApprovals.length})</h3>
              <div className="text-sm text-gray-500">
                Tap to revoke
              </div>
            </div>
            
            {tokenApprovals.map((approval) => (
              <div key={approval.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {approval.tokenInfo.symbol.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{approval.tokenInfo.symbol}</h4>
                      <p className="text-sm text-gray-600">{approval.spenderInfo.protocol}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                    approval.riskLevel === 'high' ? 'text-red-600 bg-red-50 border-red-200' :
                    approval.riskLevel === 'medium' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                    'text-green-600 bg-green-50 border-green-200'
                  }`}>
                    {approval.riskLevel} risk
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Allowance:</span>
                    <span className={`font-medium ${approval.isUnlimited ? 'text-red-600' : 'text-gray-900'}`}>
                      {approval.allowanceFormatted}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">{approval.spenderInfo.category}</span>
                  </div>
                  {approval.isBaseNativeToken && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Token:</span>
                      <span className="font-medium text-blue-600">Base Native</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => revokeApproval(approval)}
                  disabled={isRevoking && revokingApprovalId === approval.id}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                    approval.riskLevel === 'high' 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  } disabled:bg-gray-400 flex items-center justify-center space-x-2`}
                >
                  {isRevoking && revokingApprovalId === approval.id ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>{isRevokePending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Revoking...'}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Revoke Approval</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isDiscovering && !isScanning && tokenApprovals.length === 0 && discoveryStats && (
          <div className="text-center py-12">
            <div className="text-green-600 text-6xl mb-4">🛡️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Wallet Secure!</h3>
            <p className="text-gray-600 mb-4">
              No risky token approvals found on Base network
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm mx-auto">
              <p className="text-sm text-green-800">
                ✅ Scanned {discoveryStats.tokensWithBalance} owned tokens
              </p>
              <p className="text-xs text-green-600 mt-1">
                Your Base wallet is secure from approval risks
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {discoveryError && (
          <div className={`border rounded-lg p-4 ${
            discoveryError.includes('secure') || discoveryError.includes('✅')
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`font-medium ${
              discoveryError.includes('secure') || discoveryError.includes('✅') ? 'text-green-800' : 'text-red-800'
            }`}>
              {discoveryError}
            </p>
          </div>
        )}

        {/* Transaction Status */}
        {txHash && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-blue-800 font-medium">Transaction Submitted</p>
            <button
              onClick={() => window.open(`https://basescan.org/tx/${txHash}`, '_blank')}
              className="text-blue-600 hover:text-blue-800 text-sm underline mt-1"
            >
              View on BaseScan: {txHash.slice(0, 10)}...
            </button>
          </div>
        )}

        {/* Debug Information */}
        {debugMode && (
          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Debug Information</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div>Farcaster Context: {farcasterContext ? 'Available' : 'None'}</div>
              <div>Farcaster Wallet: {sdk && sdk.wallet ? 'Available' : 'Not Available'}</div>
              <div>Wagmi Connectors: {connectors.length}</div>
              <div>Connector Names: {connectors.map(c => c.name).join(', ')}</div>
              <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
              <div>Address: {address || 'None'}</div>
              <div>Chain: {chain?.name || 'None'} ({chain?.id || 'Unknown'})</div>
              <div>Window.ethereum: {typeof window !== 'undefined' && window.ethereum ? 'Available' : 'Not Available'}</div>
              <div>Discovery Tokens: {discoveredTokens.length}</div>
              <div>Config: {configSummary.totalTokens} tokens, {configSummary.totalProtocols} protocols</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BlockitApp;
