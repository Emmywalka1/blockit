import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useAccount, useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'

// Import expanded configuration
import { 
  BASE_TOKENS, 
  BASE_SPENDERS, 
  getTokenByAddress, 
  getSpenderByAddress,
  CONFIG_SUMMARY,
  type TokenConfig,
  type SpenderConfig
} from '../config/baseConfig'

const ERC20_ABI = [
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
] as const

interface RealTokenApproval {
  id: string
  tokenAddress: `0x${string}`
  tokenInfo: TokenConfig
  spender: `0x${string}`
  spenderInfo: SpenderConfig
  allowance: bigint
  allowanceFormatted: string
  riskLevel: 'low' | 'medium' | 'high'
  isUnlimited: boolean
  estimatedValue: number
  category: SpenderConfig['category']
}

interface ScanStats {
  totalCombinations: number
  combinationsChecked: number
  approvalsFound: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
  categoryCounts: Record<SpenderConfig['category'], number>
  uniqueTokensWithApprovals: number
  uniqueProtocolsWithApprovals: number
}

export function useRealApprovalScanner() {
  const { address } = useAccount()
  const [isScanning, setIsScanning] = useState(false)
  const [approvals, setApprovals] = useState<RealTokenApproval[]>([])
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanStats, setScanStats] = useState<ScanStats | null>(null)
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 })

  // Prepare all contract calls for batch execution (EXPANDED)
  const prepareContractCalls = useCallback(() => {
    if (!address) return []

    const calls = []

    console.log(`Preparing contract calls for ${BASE_TOKENS.length} tokens × ${BASE_SPENDERS.length} spenders`)

    // Prepare calls for each token-spender combination
    for (const token of BASE_TOKENS) {
      // Allowance calls for each spender
      for (const spender of BASE_SPENDERS) {
        calls.push({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, spender.address],
        })
      }
    }

    console.log(`Prepared ${calls.length} contract calls`)
    return calls
  }, [address])

  // Execute contract calls using wagmi
  const contractCalls = useMemo(() => prepareContractCalls(), [prepareContractCalls])
  const { 
    data: contractResults, 
    isLoading: isLoadingContracts, 
    error: contractError 
  } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: !!address && contractCalls.length > 0,
    }
  })

  const scanForRealApprovals = useCallback(async () => {
    if (!address) {
      setScanError('No wallet connected')
      return
    }

    setIsScanning(true)
    setScanError(null)
    setScanProgress({ current: 0, total: CONFIG_SUMMARY.totalCombinations })
    
    console.log(`Starting comprehensive scan: ${CONFIG_SUMMARY.totalTokens} tokens × ${CONFIG_SUMMARY.totalSpenders} spenders = ${CONFIG_SUMMARY.totalCombinations} combinations`)
    
    try {
      // The actual scanning happens via the useReadContracts hook
      // This function mainly sets up the scanning state
      
    } catch (error: any) {
      setScanError(`Blockchain scan failed: ${error.message}`)
      console.error('Real approval scan error:', error)
      setIsScanning(false)
      setScanProgress({ current: 0, total: 0 })
    }
  }, [address])

  // Process contract results when they're available
  useEffect(() => {
    if (contractResults && address && !isLoadingContracts) {
      console.log('Processing expanded blockchain contract results...')
      
      const realApprovals: RealTokenApproval[] = []
      const stats: ScanStats = {
        totalCombinations: CONFIG_SUMMARY.totalCombinations,
        combinationsChecked: 0,
        approvalsFound: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0,
        categoryCounts: {
          dex: 0,
          lending: 0,
          bridge: 0,
          aggregator: 0,
          farming: 0,
          other: 0,
        },
        uniqueTokensWithApprovals: 0,
        uniqueProtocolsWithApprovals: 0
      }
      
      const foundTokenAddresses = new Set<string>()
      const foundProtocols = new Set<string>()
      let resultIndex = 0

      // Process results for each token-spender combination
      for (const token of BASE_TOKENS) {
        for (const spender of BASE_SPENDERS) {
          const result = contractResults[resultIndex]
          resultIndex++
          stats.combinationsChecked++

          if (result.status === 'success' && result.result) {
            const allowance = result.result as bigint
            
            // Only proceed if real allowance > 0 (REAL approvals only)
            if (allowance > 0n) {
              const isUnlimited = allowance >= 2n ** 255n
              
              const realApproval: RealTokenApproval = {
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
                isUnlimited,
                estimatedValue: isUnlimited ? 1000000 : Number(formatUnits(allowance, token.decimals)) * 1,
                category: spender.category,
              }

              realApprovals.push(realApproval)
              stats.approvalsFound++
              
              // Update risk counts
              switch (spender.risk) {
                case 'high': stats.highRiskCount++; break
                case 'medium': stats.mediumRiskCount++; break
                case 'low': stats.lowRiskCount++; break
              }
              
              // Update category counts
              stats.categoryCounts[spender.category]++
              
              // Track unique tokens and protocols
              foundTokenAddresses.add(token.address.toLowerCase())
              foundProtocols.add(spender.protocol)

              console.log(`Found REAL approval: ${token.symbol} → ${spender.protocol} (${spender.category}, ${spender.risk} risk)`)
              console.log(`  Allowance: ${formatUnits(allowance, token.decimals)} ${token.symbol}`)
            }
          } else if (result.status === 'failure') {
            console.warn(`Failed to check ${token.symbol} → ${spender.name}:`, result.error)
          }
        }
      }

      // Finalize stats
      stats.uniqueTokensWithApprovals = foundTokenAddresses.size
      stats.uniqueProtocolsWithApprovals = foundProtocols.size

      // Set results
      setApprovals(realApprovals)
      setScanStats(stats)
      setIsScanning(false)
      setScanProgress({ current: stats.combinationsChecked, total: CONFIG_SUMMARY.totalCombinations })
      
      // Set appropriate message
      if (realApprovals.length === 0) {
        setScanError(`✅ No token approvals found across ${stats.combinationsChecked} contract combinations. Your wallet is secure!`)
        console.log('Comprehensive scan complete: No approvals found - wallet is secure')
      } else {
        setScanError('')
        console.log(`Comprehensive scan complete: Found ${realApprovals.length} real approvals`)
        console.log('Scan statistics:', stats)
        
        // Log detailed breakdown
        console.log('Risk distribution:', {
          high: stats.highRiskCount,
          medium: stats.mediumRiskCount,
          low: stats.lowRiskCount
        })
        console.log('Category distribution:', stats.categoryCounts)
        console.log(`Unique tokens with approvals: ${stats.uniqueTokensWithApprovals}`)
        console.log(`Unique protocols with approvals: ${stats.uniqueProtocolsWithApprovals}`)
      }
    }

    if (contractError) {
      setScanError(`Blockchain scan failed: ${contractError.message}`)
      setIsScanning(false)
      setScanProgress({ current: 0, total: 0 })
      console.error('Contract call error:', contractError)
    }
  }, [contractResults, isLoadingContracts, address, contractError])

  // Auto-start scanning when conditions are met
  useEffect(() => {
    if (address && contractCalls.length > 0 && !isScanning && !scanStats) {
      console.log('Auto-starting comprehensive approval scan...')
      scanForRealApprovals()
    }
  }, [address, contractCalls.length, scanForRealApprovals, isScanning, scanStats])

  // Update loading state
  useEffect(() => {
    if (isLoadingContracts && !isScanning) {
      setIsScanning(true)
    } else if (!isLoadingContracts && isScanning && contractResults) {
      // Will be handled in the contractResults effect
    }
  }, [isLoadingContracts, isScanning, contractResults])

  const clearApproval = useCallback((approvalId: string) => {
    setApprovals(prev => {
      const filtered = prev.filter(a => a.id !== approvalId)
      
      // Update stats
      if (scanStats) {
        const removedApproval = prev.find(a => a.id === approvalId)
        if (removedApproval) {
          const newStats = { ...scanStats }
          newStats.approvalsFound--
          
          switch (removedApproval.riskLevel) {
            case 'high': newStats.highRiskCount--; break
            case 'medium': newStats.mediumRiskCount--; break
            case 'low': newStats.lowRiskCount--; break
          }
          
          newStats.categoryCounts[removedApproval.category]--
          setScanStats(newStats)
        }
      }
      
      return filtered
    })
  }, [scanStats])

  const getApprovalsByRisk = useCallback((risk: 'low' | 'medium' | 'high') => {
    return approvals.filter(approval => approval.riskLevel === risk)
  }, [approvals])

  const getApprovalsByCategory = useCallback((category: SpenderConfig['category']) => {
    return approvals.filter(approval => approval.category === category)
  }, [approvals])

  const getApprovalsByToken = useCallback((tokenSymbol: string) => {
    return approvals.filter(approval => approval.tokenInfo.symbol === tokenSymbol)
  }, [approvals])

  const getApprovalsByProtocol = useCallback((protocol: string) => {
    return approvals.filter(approval => approval.spenderInfo.protocol === protocol)
  }, [approvals])

  return {
    // Core data
    approvals, // Only contains real blockchain approvals
    scanStats,
    scanProgress,
    
    // Status
    isScanning: isScanning || isLoadingContracts,
    scanError,
    
    // Actions
    scanForRealApprovals,
    clearApproval,
    
    // Filters and utilities
    getApprovalsByRisk,
    getApprovalsByCategory,
    getApprovalsByToken,
    getApprovalsByProtocol,
    
    // Configuration info
    configSummary: CONFIG_SUMMARY,
  }
}
