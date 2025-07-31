import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits } from 'viem'
import { 
  BASE_ECOSYSTEM_TOKENS, 
  BASE_ECOSYSTEM_PROTOCOLS, 
  getBaseTokenByAddress, 
  getBaseProtocolByAddress,
  BASE_CONFIG_SUMMARY,
  type BaseTokenConfig,
  type BaseProtocolConfig
} from '../config/baseConfig'

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
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
] as const

interface DiscoveredBaseToken {
  address: `0x${string}`
  symbol: string
  name: string
  decimals: number
  balance: bigint
  balanceFormatted: string
  hasBalance: boolean
  isBaseNative: boolean
  category: string
  discoveryMethod: 'balance' | 'transaction' | 'known'
}

interface BaseTokenApproval {
  id: string
  tokenAddress: `0x${string}`
  tokenInfo: DiscoveredBaseToken
  spender: `0x${string}`
  spenderInfo: BaseProtocolConfig
  allowance: bigint
  allowanceFormatted: string
  riskLevel: 'low' | 'medium' | 'high'
  estimatedValue: number
  isUnlimited: boolean
  isBaseNativeToken: boolean
  isBaseNativeProtocol: boolean
}

interface BaseDiscoveryStats {
  totalTokensChecked: number
  tokensWithBalance: number
  baseNativeTokens: number
  bridgedTokens: number
  approvalsFound: number
  baseNativeApprovals: number
  totalValueAtRisk: number
  riskDistribution: {
    high: number
    medium: number
    low: number
  }
  categoryDistribution: Record<string, number>
  discoveryMethods: {
    balance: number
    transaction: number
    known: number
  }
}

// BaseScan API integration for transaction-based token discovery
class BaseTokenDiscoveryService {
  private baseScanApiKey: string
  private baseRpcUrl: string = 'https://mainnet.base.org'

  constructor(apiKey?: string) {
    this.baseScanApiKey = apiKey || 'CV4WNTY3QMPMABJVXJYVCK3ZZ419XT9Z9M' // Fallback key
  }

  // Discover tokens through transaction history using BaseScan API
  async discoverTokensFromTransactions(address: string): Promise<DiscoveredBaseToken[]> {
    try {
      console.log('🔍 Discovering tokens from Base transaction history...')
      
      // Get ERC-20 token transactions from BaseScan
      const tokenTxUrl = `https://api.basescan.org/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=latest&sort=desc&apikey=${this.baseScanApiKey}`
      
      const response = await fetch(tokenTxUrl)
      const data = await response.json()
      
      if (data.status !== '1' || !data.result) {
        console.log('No token transactions found or API error')
        return []
      }

      // Extract unique token addresses from transactions
      const uniqueTokens = new Map<string, any>()
      
      data.result.forEach((tx: any) => {
        const tokenAddress = tx.contractAddress.toLowerCase()
        if (!uniqueTokens.has(tokenAddress)) {
          uniqueTokens.set(tokenAddress, {
            address: tx.contractAddress as `0x${string}`,
            symbol: tx.tokenSymbol || 'UNKNOWN',
            name: tx.tokenName || 'Unknown Token',
            decimals: parseInt(tx.tokenDecimal) || 18,
            balance: BigInt(0), // Will be fetched separately
            balanceFormatted: '0',
            hasBalance: false,
            isBaseNative: this.isBaseNativeToken(tx.contractAddress),
            category: this.categorizeToken(tx.contractAddress, tx.tokenSymbol),
            discoveryMethod: 'transaction' as const
          })
        }
      })

      console.log(`📊 Discovered ${uniqueTokens.size} unique tokens from transaction history`)
      return Array.from(uniqueTokens.values())
    } catch (error) {
      console.error('Error discovering tokens from transactions:', error)
      return []
    }
  }

  // Get current token balances using BaseScan API
  async getTokenBalances(address: string, tokenAddresses: string[]): Promise<Record<string, string>> {
    try {
      const balances: Record<string, string> = {}
      
      // BaseScan API allows batch balance checking
      for (const tokenAddress of tokenAddresses) {
        const balanceUrl = `https://api.basescan.org/api?module=account&action=tokenbalance&contractaddress=${tokenAddress}&address=${address}&tag=latest&apikey=${this.baseScanApiKey}`
        
        try {
          const response = await fetch(balanceUrl)
          const data = await response.json()
          
          if (data.status === '1' && data.result) {
            balances[tokenAddress.toLowerCase()] = data.result
          }
        } catch (err) {
          console.warn(`Failed to get balance for ${tokenAddress}:`, err)
        }
        
        // Rate limiting - BaseScan allows 5 calls/second
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      return balances
    } catch (error) {
      console.error('Error fetching token balances:', error)
      return {}
    }
  }

  // Get comprehensive token information for an address
  async getAddressTokenInfo(address: string): Promise<any[]> {
    try {
      const url = `https://api.basescan.org/api?module=account&action=addresstokenbalance&address=${address}&page=1&offset=100&apikey=${this.baseScanApiKey}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.status === '1' && data.result) {
        return data.result
      }
      
      return []
    } catch (error) {
      console.error('Error fetching address token info:', error)
      return []
    }
  }

  private isBaseNativeToken(address: string): boolean {
    const token = getBaseTokenByAddress(address)
    return token?.isBaseNative || false
  }

  private categorizeToken(address: string, symbol: string): string {
    const knownToken = getBaseTokenByAddress(address)
    if (knownToken) return knownToken.category

    // Categorize by symbol patterns
    if (['USDC', 'USDT', 'DAI', 'DOLA'].includes(symbol)) return 'stablecoin'
    if (['WETH', 'ETH', 'cbETH', 'cbBTC'].includes(symbol)) return 'native'
    if (['DEGEN', 'BRETT', 'TOSHI', 'HIGHER'].includes(symbol)) return 'meme'
    if (['AERO', 'WELL', 'BSWAP', 'SEAM'].includes(symbol)) return 'defi'
    
    return 'other'
  }
}

export function useBaseTokenDiscovery() {
  const { address } = useAccount()
  const [discoveredTokens, setDiscoveredTokens] = useState<DiscoveredBaseToken[]>([])
  const [tokenApprovals, setTokenApprovals] = useState<BaseTokenApproval[]>([])
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [discoveryError, setDiscoveryError] = useState<string | null>(null)
  const [discoveryStats, setDiscoveryStats] = useState<BaseDiscoveryStats | null>(null)
  const [discoveryProgress, setDiscoveryProgress] = useState({ 
    step: '', 
    current: 0, 
    total: 0,
    phase: 'idle' as 'idle' | 'discovering' | 'balances' | 'approvals' | 'complete'
  })

  // Revoke functionality
  const { writeContract, isPending: isRevokePending, error: revokeError, data: txHash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })
  const [revokingApprovalId, setRevokingApprovalId] = useState<string | null>(null)

  // Initialize discovery service
  const discoveryService = useMemo(() => new BaseTokenDiscoveryService(), [])

  // Step 1: Combined token discovery (known tokens + transaction history)
  const discoverAllTokens = useCallback(async () => {
    if (!address) return []

    console.log('🚀 Starting comprehensive Base token discovery...')
    setDiscoveryProgress({ step: 'Discovering tokens...', current: 1, total: 4, phase: 'discovering' })

    try {
      // Method 1: Check balances for known Base ecosystem tokens
      console.log('📊 Checking known Base ecosystem tokens...')
      const knownTokensWithBalances: DiscoveredBaseToken[] = []
      
      // Method 2: Discover through transaction history
      console.log('🔍 Analyzing transaction history...')
      const transactionTokens = await discoveryService.discoverTokensFromTransactions(address)
      
      // Method 3: Get comprehensive token info from BaseScan
      console.log('📋 Getting comprehensive token information...')
      const addressTokenInfo = await discoveryService.getAddressTokenInfo(address)
      
      // Combine all discovery methods
      const allTokens = new Map<string, DiscoveredBaseToken>()
      
      // Add known Base ecosystem tokens
      BASE_ECOSYSTEM_TOKENS.forEach(token => {
        allTokens.set(token.address.toLowerCase(), {
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          balance: BigInt(0),
          balanceFormatted: '0',
          hasBalance: false,
          isBaseNative: token.isBaseNative,
          category: token.category,
          discoveryMethod: 'known'
        })
      })

      // Add tokens from transaction history
      transactionTokens.forEach(token => {
        if (!allTokens.has(token.address.toLowerCase())) {
          allTokens.set(token.address.toLowerCase(), token)
        }
      })

      // Add tokens from BaseScan address info
      addressTokenInfo.forEach((tokenInfo: any) => {
        const address = tokenInfo.TokenAddress.toLowerCase()
        if (!allTokens.has(address)) {
          const token = getBaseTokenByAddress(tokenInfo.TokenAddress)
          allTokens.set(address, {
            address: tokenInfo.TokenAddress as `0x${string}`,
            symbol: tokenInfo.TokenSymbol || 'UNKNOWN',
            name: tokenInfo.TokenName || 'Unknown Token',
            decimals: parseInt(tokenInfo.TokenDivisor) || 18,
            balance: BigInt(tokenInfo.TokenQuantity || '0'),
            balanceFormatted: formatUnits(BigInt(tokenInfo.TokenQuantity || '0'), parseInt(tokenInfo.TokenDivisor) || 18),
            hasBalance: BigInt(tokenInfo.TokenQuantity || '0') > 0n,
            isBaseNative: token?.isBaseNative || false,
            category: token?.category || 'other',
            discoveryMethod: 'balance'
          })
        } else {
          // Update balance for existing token
          const existingToken = allTokens.get(address)!
          existingToken.balance = BigInt(tokenInfo.TokenQuantity || '0')
          existingToken.balanceFormatted = formatUnits(BigInt(tokenInfo.TokenQuantity || '0'), existingToken.decimals)
          existingToken.hasBalance = BigInt(tokenInfo.TokenQuantity || '0') > 0n
        }
      })

      const discoveredTokens = Array.from(allTokens.values())
      console.log(`🎉 Total token discovery complete: ${discoveredTokens.length} tokens found`)
      
      return discoveredTokens
    } catch (error) {
      console.error('Token discovery failed:', error)
      throw error
    }
  }, [address, discoveryService])

  // Step 2: Check balances for discovered tokens using wagmi
  const balanceContracts = useMemo(() => {
    if (!address || discoveredTokens.length === 0) return []
    
    return discoveredTokens.map(token => ({
      address: token.address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    }))
  }, [address, discoveredTokens])

  const { 
    data: balanceResults, 
    isLoading: isLoadingBalances, 
    error: balanceError 
  } = useReadContracts({
    contracts: balanceContracts,
    query: {
      enabled: !!address && balanceContracts.length > 0,
    }
  })

  // Step 3: Check approvals for tokens with balance
  const approvalContracts = useMemo(() => {
    if (!address || discoveredTokens.length === 0) return []
    
    const contracts = []
    const tokensWithBalance = discoveredTokens.filter(t => t.hasBalance)
    
    // Only check approvals for tokens the user actually owns
    for (const token of tokensWithBalance) {
      for (const protocol of BASE_ECOSYSTEM_PROTOCOLS) {
        contracts.push({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, protocol.address],
        })
      }
    }
    
    return contracts
  }, [address, discoveredTokens])

  const { 
    data: approvalResults, 
    isLoading: isLoadingApprovals, 
    error: approvalError 
  } = useReadContracts({
    contracts: approvalContracts,
    query: {
      enabled: !!address && approvalContracts.length > 0 && discoveredTokens.length > 0,
    }
  })

  // Process balance results
  useEffect(() => {
    if (balanceResults && address && !isLoadingBalances && discoveredTokens.length > 0) {
      console.log('💰 Processing token balances...')
      setDiscoveryProgress({ step: 'Processing balances...', current: 3, total: 4, phase: 'balances' })
      
      const updatedTokens = discoveredTokens.map((token, index) => {
        const result = balanceResults[index]
        
        if (result.status === 'success' && result.result !== undefined) {
          const balance = result.result as bigint
          const hasBalance = balance > 0n
          
          return {
            ...token,
            balance,
            balanceFormatted: formatUnits(balance, token.decimals),
            hasBalance,
          }
        }
        
        return token
      })

      setDiscoveredTokens(updatedTokens)
      
      const tokensWithBalance = updatedTokens.filter(t => t.hasBalance)
      console.log(`💎 Balance processing complete: ${tokensWithBalance.length}/${updatedTokens.length} tokens have balance`)
      
      if (tokensWithBalance.length === 0) {
        setDiscoveryError('✅ No token balances found on Base - wallet contains only ETH!')
        setDiscoveryProgress({ step: 'Complete - ETH only wallet', current: 4, total: 4, phase: 'complete' })
      } else {
        // Start approval scanning
        setIsScanning(true)
        setDiscoveryProgress({ step: `Scanning approvals for ${tokensWithBalance.length} owned tokens...`, current: 4, total: 4, phase: 'approvals' })
      }
    }

    if (balanceError) {
      setDiscoveryError(`Balance check failed: ${balanceError.message}`)
      setIsDiscovering(false)
    }
  }, [balanceResults, isLoadingBalances, address, discoveredTokens, balanceError])

  // Process approval results
  useEffect(() => {
    if (approvalResults && address && !isLoadingApprovals && discoveredTokens.length > 0) {
      console.log('🔍 Processing Base approval scan results...')
      
      const approvals: BaseTokenApproval[] = []
      const tokensWithBalance = discoveredTokens.filter(t => t.hasBalance)
      let resultIndex = 0
      let totalValueAtRisk = 0
      const riskCounts = { high: 0, medium: 0, low: 0 }
      const categoryCounts: Record<string, number> = {}

      // Process results for each owned token-protocol combination
      for (const token of tokensWithBalance) {
        for (const protocol of BASE_ECOSYSTEM_PROTOCOLS) {
          const result = approvalResults[resultIndex]
          resultIndex++

          if (result.status === 'success' && result.result) {
            const allowance = result.result as bigint
            
            // Only show approvals where allowance > 0
            if (allowance > 0n) {
              const isUnlimited = allowance >= 2n ** 255n
              const estimatedValue = isUnlimited ? 1000000 : Number(formatUnits(allowance, token.decimals)) * 1
              
              const approval: BaseTokenApproval = {
                id: `${token.address}-${protocol.address}`,
                tokenAddress: token.address,
                tokenInfo: token,
                spender: protocol.address,
                spenderInfo: protocol,
                allowance,
                allowanceFormatted: isUnlimited 
                  ? 'Unlimited' 
                  : formatUnits(allowance, token.decimals),
                riskLevel: protocol.risk,
                estimatedValue,
                isUnlimited,
                isBaseNativeToken: token.isBaseNative,
                isBaseNativeProtocol: protocol.isBaseNative,
              }

              approvals.push(approval)
              totalValueAtRisk += estimatedValue
              riskCounts[protocol.risk]++
              categoryCounts[protocol.category] = (categoryCounts[protocol.category] || 0) + 1
              
              console.log(`🚨 Found Base approval: ${token.symbol} → ${protocol.protocol} (${protocol.risk} risk, ${token.isBaseNative ? 'Base native' : 'bridged'} token)`)
            }
          }
        }
      }

      setTokenApprovals(approvals)
      setIsScanning(false)
      setDiscoveryProgress({ step: 'Base discovery complete!', current: 4, total: 4, phase: 'complete' })
      
      // Calculate comprehensive stats
      const stats: BaseDiscoveryStats = {
        totalTokensChecked: discoveredTokens.length,
        tokensWithBalance: tokensWithBalance.length,
        baseNativeTokens: tokensWithBalance.filter(t => t.isBaseNative).length,
        bridgedTokens: tokensWithBalance.filter(t => !t.isBaseNative).length,
        approvalsFound: approvals.length,
        baseNativeApprovals: approvals.filter(a => a.isBaseNativeProtocol).length,
        totalValueAtRisk,
        riskDistribution: riskCounts,
        categoryDistribution: categoryCounts,
        discoveryMethods: {
          balance: discoveredTokens.filter(t => t.discoveryMethod === 'balance').length,
          transaction: discoveredTokens.filter(t => t.discoveryMethod === 'transaction').length,
          known: discoveredTokens.filter(t => t.discoveryMethod === 'known').length,
        }
      }
      
      setDiscoveryStats(stats)
      
      if (approvals.length === 0) {
        setDiscoveryError(`✅ No risky approvals found for your ${tokensWithBalance.length} Base tokens! Your wallet is secure.`)
        console.log(`✅ Base scan complete: No approvals found for owned tokens`)
      } else {
        setDiscoveryError('')
        console.log(`⚠️ Base scan complete: Found ${approvals.length} approvals across ${tokensWithBalance.length} owned tokens`)
        console.log('📊 Base-specific stats:', {
          baseNativeTokens: stats.baseNativeTokens,
          baseNativeApprovals: stats.baseNativeApprovals,
          discoveryMethods: stats.discoveryMethods
        })
      }
    }

    if (approvalError) {
      setDiscoveryError(`Base approval scan failed: ${approvalError.message}`)
      setIsScanning(false)
    }
  }, [approvalResults, isLoadingApprovals, address, discoveredTokens, approvalError])

  // Main discovery function
  const startDiscovery = useCallback(async () => {
    if (!address) {
      setDiscoveryError('No wallet connected')
      return
    }

    console.log(`🚀 Starting comprehensive Base token discovery for ${address}`)
    setIsDiscovering(true)
    setDiscoveryError(null)
    setDiscoveredTokens([])
    setTokenApprovals([])
    setDiscoveryStats(null)
    setDiscoveryProgress({ step: 'Initializing Base discovery...', current: 0, total: 4, phase: 'discovering' })
    
    try {
      // Start token discovery
      const allTokens = await discoverAllTokens()
      setDiscoveredTokens(allTokens)
      setIsDiscovering(false)
      
      console.log(`🎉 Base token discovery complete: ${allTokens.length} tokens discovered`)
    } catch (error: any) {
      setDiscoveryError(`Base discovery failed: ${error.message}`)
      setIsDiscovering(false)
      setDiscoveryProgress({ step: 'Discovery failed', current: 0, total: 4, phase: 'idle' })
    }
  }, [address, discoverAllTokens])

  // Auto-start discovery when wallet connects
  useEffect(() => {
    if (address && !isDiscovering && discoveredTokens.length === 0) {
      console.log('🚀 Auto-starting Base token discovery...')
      startDiscovery()
    }
  }, [address, startDiscovery, isDiscovering, discoveredTokens.length])

  const revokeApproval = useCallback(async (approval: BaseTokenApproval) => {
    if (!address) return

    try {
      setRevokingApprovalId(approval.id)
      
      const confirmed = window.confirm(
        `Revoke ${approval.tokenInfo.symbol} approval for ${approval.spenderInfo.protocol}?\n\n` +
        `Token: ${approval.tokenInfo.symbol} (${approval.tokenInfo.isBaseNative ? 'Base Native' : 'Bridged'})\n` +
        `Protocol: ${approval.spenderInfo.protocol} (${approval.spenderInfo.isBaseNative ? 'Base Native' : 'Multi-chain'})\n` +
        `Current allowance: ${approval.allowanceFormatted}\n` +
        `Risk level: ${approval.riskLevel}\n\n` +
        `Gas cost: ~$0.01 on Base\n` +
        `This will prevent future access to your tokens.`
      )
      
      if (!confirmed) {
        setRevokingApprovalId(null)
        return
      }

      console.log(`🗑️ Revoking Base approval: ${approval.tokenInfo.symbol} → ${approval.spenderInfo.protocol}`)

      await writeContract({
        address: approval.tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [approval.spender, BigInt(0)], // Set allowance to 0
      })

    } catch (err: any) {
      setDiscoveryError(`Failed to revoke approval: ${err.message}`)
      console.error('Revoke error:', err)
      setRevokingApprovalId(null)
    }
  }, [address, writeContract])

  // Handle successful revoke
  useEffect(() => {
    if (isConfirmed && revokingApprovalId) {
      setTokenApprovals(prev => prev.filter(a => a.id !== revokingApprovalId))
      
      // Update stats
      if (discoveryStats) {
        const revokedApproval = tokenApprovals.find(a => a.id === revokingApprovalId)
        if (revokedApproval) {
          const newStats = { ...discoveryStats }
          newStats.approvalsFound--
          newStats.totalValueAtRisk -= revokedApproval.estimatedValue
          newStats.riskDistribution[revokedApproval.riskLevel]--
          if (revokedApproval.isBaseNativeProtocol) {
            newStats.baseNativeApprovals--
          }
          setDiscoveryStats(newStats)
        }
      }
      
      setRevokingApprovalId(null)
      console.log(`✅ Base approval revoked successfully!`)
      
      if (txHash) {
        alert(`✅ Approval revoked on Base!\n\nTransaction: ${txHash.slice(0, 10)}...\nView on BaseScan: https://basescan.org/tx/${txHash}`)
      }
    }
  }, [isConfirmed, revokingApprovalId, txHash, discoveryStats, tokenApprovals])

  const getTokensWithBalance = useCallback(() => {
    return discoveredTokens.filter(token => token.hasBalance)
  }, [discoveredTokens])

  const getBaseNativeTokens = useCallback(() => {
    return discoveredTokens.filter(token => token.hasBalance && token.isBaseNative)
  }, [discoveredTokens])

  const getBridgedTokens = useCallback(() => {
    return discoveredTokens.filter(token => token.hasBalance && !token.isBaseNative)
  }, [discoveredTokens])

  const getApprovalsByRisk = useCallback((risk: 'low' | 'medium' | 'high') => {
    return tokenApprovals.filter(approval => approval.riskLevel === risk)
  }, [tokenApprovals])

  const getBaseNativeApprovals = useCallback(() => {
    return tokenApprovals.filter(approval => approval.isBaseNativeProtocol)
  }, [tokenApprovals])

  return {
    // Core data
    discoveredTokens,
    tokenApprovals,
    discoveryStats,
    discoveryProgress,
    
    // Status
    isDiscovering: isDiscovering || isLoadingBalances,
    isScanning: isScanning || isLoadingApprovals,
    discoveryError,
    
    // Transaction status
    isRevoking: revokingApprovalId !== null,
    revokingApprovalId,
    isRevokePending,
    isConfirming,
    revokeError,
    txHash,
    
    // Actions
    startDiscovery,
    revokeApproval,
    
    // Base-specific utilities
    getTokensWithBalance,
    getBaseNativeTokens,
    getBridgedTokens,
    getApprovalsByRisk,
    getBaseNativeApprovals,
    
    // Configuration info
    configSummary: BASE_CONFIG_SUMMARY,
  }
}
