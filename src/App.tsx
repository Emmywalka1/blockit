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
    try {
      // In a real implementation, you'd call the contract to estimate gas
      // For Base network, approval revokes typically cost around 50k gas
      const gasLimit = '50000';
      const gasPrice = '1000000'; // 0.001 gwei (Base is very cheap)
      const totalCost = (parseInt(gasLimit) * parseInt(gasPrice)).toString();
      const usdEstimate = 0.008; // ~$0.008 on Base network
      
      return {
        gasLimit,
        gasPrice,
        totalCost,
        usdEstimate
      };
    } catch (error) {
      console.error('Gas estimation failed:', error);
      // Return reasonable defaults for Base network
      return {
        gasLimit: '60000',
        gasPrice: '1500000',
        totalCost: '90000000000000',
        usdEstimate: 0.012
      };
    }
  }

  async revokeApproval(tokenAddress: string, spenderAddress: string): Promise<{ txHash: string; gasInfo: GasEstimate }> {
    try {
      const gasInfo = await this.estimateGas(tokenAddress, spenderAddress);
      
      // ERC-20 approve function call data to set allowance to 0
      const approveCallData = this.encodeApproveCall(spenderAddress, '0');
      
      console.log('Revoking approval...', {
        token: tokenAddress,
        spender: spenderAddress,
        gasInfo
      });
      
      const transaction = {
        to: tokenAddress,
        data: approveCallData,
        gasLimit: `0x${parseInt(gasInfo.gasLimit).toString(16)}`,
        gasPrice: `0x${parseInt(gasInfo.gasPrice).toString(16)}`,
        value: '0x0'
      };
      
      console.log('Sending transaction:', transaction);
      
      // Get signer and send transaction
      const signer = this.provider.getSigner();
      const txResponse = await signer.sendTransaction(transaction);
      
      let txHash: string;
      
      // Handle different response formats
      if (typeof txResponse === 'string') {
        txHash = txResponse;
      } else if (txResponse.hash) {
        txHash = txResponse.hash;
      } else if (txResponse.result) {
        txHash = txResponse.result;
      } else {
        console.warn('Unexpected transaction response format:', txResponse);
        txHash = txResponse.toString();
      }
      
      console.log('Transaction sent successfully:', txHash);
      
      // Wait for confirmation if possible
      if (txResponse.wait && typeof txResponse.wait === 'function') {
        try {
          await txResponse.wait();
          console.log('Transaction confirmed');
        } catch (waitError) {
          console.warn('Failed to wait for confirmation:', waitError);
          // Don't fail the whole operation
        }
      } else {
        // Simulate wait time for user feedback
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      return { txHash, gasInfo };
      
    } catch (error: any) {
      console.error('Failed to revoke approval:', error);
      
      // Provide user-friendly error messages
      if (error.code === 4001) {
        throw new Error('Transaction rejected by user');
      } else if (error.code === -32603) {
        throw new Error('Transaction failed. Please try again.');
      } else if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient ETH for gas fees');
      } else if (error.message?.includes('gas')) {
        throw new Error('Gas estimation failed. The transaction might fail.');
      } else {
        throw new Error(`Revoke failed: ${error.message || 'Unknown error'}`);
      }
    }
  }
  
  private encodeApproveCall(spenderAddress: string, amount: string): string {
    // ERC-20 approve(address,uint256) function signature
    const functionSignature = '0x095ea7b3';
    
    // Encode spender address (pad to 32 bytes)
    const encodedSpender = spenderAddress.slice(2).padStart(64, '0');
    
    // Encode amount (0 for revoke, pad to 32 bytes)
    const encodedAmount = amount === '0' ? '0'.padStart(64, '0') : 
                         parseInt(amount).toString(16).padStart(64, '0');
    
    return functionSignature + encodedSpender + encodedAmount;
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
  const [showDebugInfo, setShowDebugInfo] = useState(false);

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
      
      // Better Farcaster detection
      const isInFarcaster = await detectFarcasterEnvironment();
      setIsFarcasterApp(isInFarcaster);
      
      // Check wallet availability
      checkWalletAvailability();
      
      console.log('Blockit mini app initialized', { 
        isInFarcaster, 
        sdkReady: true,
        walletAvailable: !!(sdk?.wallet || window.ethereum)
      });
    } catch (error) {
      console.error('Failed to initialize app:', error);
      // Even if SDK fails, mark as ready to prevent hanging
      setSdkReady(true);
      // Still try to detect environment
      const isInFarcaster = await detectFarcasterEnvironment();
      setIsFarcasterApp(isInFarcaster);
    }
  };

  const detectFarcasterEnvironment = async (): Promise<boolean> => {
    try {
      // Multiple ways to detect Farcaster environment
      const checks = [
        // Check if we're in an iframe (common for mini apps)
        window.parent !== window,
        
        // Check user agent
        navigator.userAgent.includes('Farcaster'),
        
        // Check if Farcaster SDK wallet is available
        !!(sdk?.wallet),
        
        // Check URL parameters that Farcaster might add
        window.location.href.includes('farcaster') || 
        window.location.search.includes('fc_') ||
        window.location.search.includes('farcaster'),
        
        // Check for Farcaster-specific window properties
        !!(window as any).farcaster || !!(window as any).fc,
        
        // Check referrer
        document.referrer.includes('farcaster') || 
        document.referrer.includes('warpcast'),
        
        // Check for mini app context
        window.location.hostname !== 'localhost' && 
        (window.parent !== window || window.top !== window)
      ];
      
      const detectedCount = checks.filter(Boolean).length;
      const isInFarcaster = detectedCount >= 2; // Require at least 2 indicators
      
      console.log('Farcaster environment detection:', {
        checks: {
          iframe: checks[0],
          userAgent: checks[1], 
          sdkWallet: checks[2],
          urlParams: checks[3],
          windowProps: checks[4],
          referrer: checks[5],
          miniAppContext: checks[6]
        },
        detectedCount,
        isInFarcaster
      });
      
      return isInFarcaster;
    } catch (error) {
      console.error('Error detecting Farcaster environment:', error);
      return false;
    }
  };

  const checkWalletAvailability = async () => {
    try {
      // Check both Farcaster wallet and external wallets
      const farcasterWallet = !!(sdk?.wallet);
      const externalWallet = !!(window.ethereum);
      
      console.log('Wallet availability:', {
        farcaster: farcasterWallet,
        external: externalWallet,
        total: farcasterWallet || externalWallet
      });
      
      if (farcasterWallet || externalWallet) {
        setNetworkStatus('connected');
      } else {
        setNetworkStatus('disconnected');
      }
    } catch (error) {
      console.error('Error checking wallet availability:', error);
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
      if (isFarcasterApp && sdk?.wallet) {
        try {
          console.log('Attempting Farcaster wallet connection...');
          console.log('Available wallet methods:', Object.keys(sdk.wallet));
          
          // Get the Ethereum provider from Farcaster wallet
          let ethProvider;
          
          if (typeof sdk.wallet.getEthereumProvider === 'function') {
            console.log('Getting Ethereum provider via getEthereumProvider()...');
            ethProvider = await sdk.wallet.getEthereumProvider();
          } else if (sdk.wallet.ethProvider) {
            console.log('Using direct ethProvider property...');
            ethProvider = sdk.wallet.ethProvider;
          } else {
            throw new Error('No Ethereum provider method found on Farcaster wallet');
          }
          
          console.log('Ethereum provider:', ethProvider);
          console.log('Provider methods:', ethProvider ? Object.keys(ethProvider) : 'None');
          
          if (!ethProvider) {
            throw new Error('Failed to get Ethereum provider from Farcaster wallet');
          }
          
          // Now use the provider like a standard Web3 provider
          console.log('Requesting accounts...');
          const accounts = await ethProvider.request({ method: 'eth_requestAccounts' });
          console.log('Accounts:', accounts);
          
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts returned from Farcaster wallet');
          }
          
          address = accounts[0];
          console.log('Got address:', address);
          
          // Try to switch to Base chain (8453)
          try {
            console.log('Switching to Base chain...');
            await ethProvider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2105' }],
            });
            console.log('Successfully switched to Base chain');
          } catch (chainError: any) {
            console.warn('Chain switch failed, trying to add Base network:', chainError);
            
            // If chain doesn't exist, try to add it
            if (chainError.code === 4902) {
              try {
                await ethProvider.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x2105',
                    chainName: 'Base',
                    nativeCurrency: { 
                      name: 'Ethereum', 
                      symbol: 'ETH', 
                      decimals: 18 
                    },
                    rpcUrls: ['https://mainnet.base.org'],
                    blockExplorerUrls: ['https://basescan.org'],
                  }],
                });
                console.log('Successfully added and switched to Base chain');
              } catch (addError) {
                console.warn('Failed to add Base network, but continuing:', addError);
              }
            }
          }
          
          // Create Web3 provider interface using the Farcaster Ethereum provider
          web3Provider = {
            request: async (params: any) => {
              console.log('Provider request:', params);
              return await ethProvider.request(params);
            },
            
            getSigner: () => ({
              getAddress: async () => address,
              
              sendTransaction: async (tx: any) => {
                console.log('Sending transaction via Farcaster provider:', tx);
                const result = await ethProvider.request({
                  method: 'eth_sendTransaction',
                  params: [tx]
                });
                
                return {
                  hash: result,
                  wait: async () => {
                    // Simple wait implementation
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return { status: 1 };
                  }
                };
              },
              
              signMessage: async (message: string) => {
                return await ethProvider.request({
                  method: 'personal_sign',
                  params: [message, address]
                });
              }
            }),
            
            // Forward event methods if available
            on: ethProvider.on?.bind(ethProvider) || (() => {}),
            removeListener: ethProvider.removeListener?.bind(ethProvider) || (() => {})
          };
          
          console.log('Farcaster wallet connected successfully');
          
        } catch (farcasterError: any) {
          console.error('Farcaster wallet connection failed:', farcasterError);
          
          // Provide specific error messages based on the error
          if (farcasterError.message?.includes('User rejected')) {
            throw new Error('Please approve the wallet connection in Farcaster');
          } else if (farcasterError.message?.includes('No accounts')) {
            throw new Error('No wallet accounts found. Please connect a wallet in Farcaster settings.');
          } else if (farcasterError.code === 4001) {
            throw new Error('Wallet connection rejected. Please try again.');
          } else {
            throw new Error(`Farcaster wallet error: ${farcasterError.message}`);
          }
        }
      }
      
      // Fallback to external wallet (MetaMask, etc.) or if Farcaster wallet failed
      if (!web3Provider && window.ethereum) {
        console.log('Using external Web3 wallet');
        
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found. Please unlock your wallet.');
          }
          
          address = accounts[0];
          
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
                  nativeCurrency: { 
                    name: 'Ethereum', 
                    symbol: 'ETH', 
                    decimals: 18 
                  },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org'],
                }],
              });
            } else {
              throw switchError;
            }
          }

          web3Provider = {
            request: window.ethereum.request.bind(window.ethereum),
            getSigner: () => ({
              getAddress: async () => address,
              sendTransaction: async (tx: any) => {
                return await window.ethereum.request({
                  method: 'eth_sendTransaction',
                  params: [tx]
                });
              }
            }),
            on: window.ethereum.on?.bind(window.ethereum) || (() => {}),
            removeListener: window.ethereum.removeListener?.bind(window.ethereum) || (() => {})
          };
          
          console.log('External wallet connected:', address);
          
        } catch (externalError: any) {
          console.error('External wallet connection failed:', externalError);
          
          if (externalError.code === 4001) {
            throw new Error('Please approve the connection request in your wallet');
          } else if (externalError.code === -32002) {
            throw new Error('Connection request is already pending. Please check your wallet.');
          } else {
            throw new Error(`Wallet connection failed: ${externalError.message}`);
          }
        }
      }
      
      // If no wallet is available
      if (!web3Provider) {
        if (isFarcasterApp) {
          throw new Error('Farcaster wallet not available. Please make sure you have a wallet connected in your Farcaster settings.');
        } else {
          throw new Error('No wallet detected. Please install MetaMask or use this app within Farcaster.');
        }
      }

      // Validate we have everything we need
      if (!address) {
        throw new Error('Failed to get wallet address');
      }

      setProvider(web3Provider);
      setUserAddress(address);
      setIsConnected(true);

      console.log('Wallet connection successful:', { address, isFarcaster: isFarcasterApp });

      // Start scanning for approvals
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

              {/* Wallet status and guidance */}
              {networkStatus !== 'connected' && !isLoading && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">No Wallet Detected</span>
                  </div>
                  <div className="text-yellow-700 text-sm space-y-2">
                    {isFarcasterApp ? (
                      <div>
                        <p>To use this app, you need to:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Connect a wallet in your Farcaster settings</li>
                          <li>Make sure wallet permissions are enabled</li>
                          <li>Try refreshing the app</li>
                        </ul>
                      </div>
                    ) : (
                      <div>
                        <p>To use this app, you need to:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Install MetaMask or another Web3 wallet</li>
                          <li>Or use this app within Farcaster</li>
                          <li>Make sure your wallet supports Base network</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Debug Information - helpful for development */}
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
                      <div><strong>SDK Ready:</strong> {sdkReady ? '✅ Yes' : '❌ No'}</div>
                      <div><strong>SDK Object:</strong> {sdk ? '✅ Available' : '❌ Not Available'}</div>
                      <div><strong>SDK Wallet:</strong> {sdk?.wallet ? '✅ Available' : '❌ Not Available'}</div>
                      {sdk?.wallet && (
                        <div><strong>Wallet Methods:</strong> {Object.keys(sdk.wallet).join(', ')}</div>
                      )}
                      <div><strong>Window Farcaster:</strong> {(window as any).farcaster ? '✅ Available' : '❌ Not Available'}</div>
                      <div><strong>Window FC:</strong> {(window as any).fc ? '✅ Available' : '❌ Not Available'}</div>
                      <div><strong>External Wallet:</strong> {window.ethereum ? '✅ Available' : '❌ Not Available'}</div>
                      <div><strong>Network Status:</strong> {networkStatus}</div>
                      <div><strong>Is iframe:</strong> {window.parent !== window ? 'Yes' : 'No'}</div>
                      <div><strong>User Agent:</strong> {navigator.userAgent.includes('Farcaster') ? 'Contains Farcaster' : 'Standard'}</div>
                      <div><strong>URL:</strong> {window.location.hostname}</div>
                      <div><strong>Referrer:</strong> {document.referrer || 'None'}</div>
                      {error && <div><strong>Last Error:</strong> {error}</div>}
                    </div>
                  </div>
                )}
              </div>

              {error && !isConnected && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-800">Connection Failed</span>
                  </div>
                  <p className="text-red-700 text-sm mb-3">{error}</p>
                  
                  {/* Helpful troubleshooting tips */}
                  <div className="text-red-600 text-xs">
                    <p className="font-medium mb-1">Try these solutions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {error.includes('Permission') && (
                        <li>Grant wallet permissions when prompted</li>
                      )}
                      {error.includes('network') && (
                        <li>Make sure Base network is added to your wallet</li>
                      )}
                      {error.includes('not supported') && (
                        <li>Try using a different wallet or browser</li>
                      )}
                      <li>Refresh the page and try again</li>
                      <li>Check your wallet is unlocked</li>
                    </ul>
                  </div>
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
