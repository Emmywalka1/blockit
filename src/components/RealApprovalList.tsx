import React, { useState } from 'react'
import { useRealApprovalScanner } from '../hooks/useRealApprovalScanner'
import { Shield, AlertTriangle, Check, Filter, BarChart3, ExternalLink } from 'lucide-react'

export function RealApprovalList() {
  const { 
    approvals, 
    isScanning, 
    scanError, 
    scanStats,
    scanProgress,
    scanForRealApprovals,
    getApprovalsByRisk,
    getApprovalsByCategory,
    configSummary
  } = useRealApprovalScanner()

  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'dex' | 'lending' | 'bridge'>('all')
  const [showStats, setShowStats] = useState(false)

  const getFilteredApprovals = () => {
    switch (activeFilter) {
      case 'high':
      case 'medium':
      case 'low':
        return getApprovalsByRisk(activeFilter)
      case 'dex':
      case 'lending':
      case 'bridge':
        return getApprovalsByCategory(activeFilter)
      default:
        return approvals
    }
  }

  const filteredApprovals = getFilteredApprovals()

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dex': return '🔄'
      case 'lending': return '🏦'
      case 'bridge': return '🌉'
      case 'aggregator': return '📊'
      case 'farming': return '🌾'
      default: return '❓'
    }
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Token Approvals Scanner</span>
          </h3>
          <p className="text-sm text-gray-600">
            Scanning {configSummary.totalTokens} tokens across {configSummary.totalSpenders} protocols
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-1"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Stats</span>
          </button>
          <button
            onClick={scanForRealApprovals}
            disabled={isScanning}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition-colors"
          >
            {isScanning ? 'Scanning...' : 'Rescan'}
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && scanStats && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Scan Statistics</span>
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{scanStats.combinationsChecked}</div>
              <div className="text-xs text-gray-600">Combinations Checked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{scanStats.approvalsFound}</div>
              <div className="text-xs text-gray-600">Approvals Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{scanStats.uniqueTokensWithApprovals}</div>
              <div className="text-xs text-gray-600">Unique Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{scanStats.uniqueProtocolsWithApprovals}</div>
              <div className="text-xs text-gray-600">Unique Protocols</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Risk Distribution</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-red-600">High Risk:</span>
                  <span className="font-medium">{scanStats.highRiskCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-600">Medium Risk:</span>
                  <span className="font-medium">{scanStats.mediumRiskCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Low Risk:</span>
                  <span className="font-medium">{scanStats.lowRiskCount}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Category Distribution</h5>
              <div className="space-y-1 text-sm">
                {Object.entries(scanStats.categoryCounts).map(([category, count]) => (
                  count > 0 && (
                    <div key={category} className="flex justify-between">
                      <span className="flex items-center space-x-1">
                        <span>{getCategoryIcon(category)}</span>
                        <span className="capitalize">{category}:</span>
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {!isScanning && approvals.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All', count: approvals.length },
              { key: 'high', label: 'High Risk', count: getApprovalsByRisk('high').length },
              { key: 'medium', label: 'Medium Risk', count: getApprovalsByRisk('medium').length },
              { key: 'low', label: 'Low Risk', count: getApprovalsByRisk('low').length },
              { key: 'dex', label: 'DEXs', count: getApprovalsByCategory('dex').length },
              { key: 'lending', label: 'Lending', count: getApprovalsByCategory('lending').length },
              { key: 'bridge', label: 'Bridges', count: getApprovalsByCategory('bridge').length },
            ].map(filter => (
              filter.count > 0 && (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                    activeFilter === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              )
            ))}
          </div>
        </div>
      )}

      {/* Loading State with Progress */}
      {isScanning && (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Scanning Base blockchain for real token approvals...</p>
          <p className="text-sm text-gray-500 mt-2">
            Checking {configSummary.totalTokens} tokens × {configSummary.totalSpenders} protocols
          </p>
          
          {scanProgress.total > 0 && (
            <div className="mt-4 max-w-md mx-auto">
              <div className="bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((scanProgress.current / scanProgress.total) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {Math.min(scanProgress.current, scanProgress.total).toLocaleString()} / {scanProgress.total.toLocaleString()} combinations
              </p>
            </div>
          )}
        </div>
      )}

      {/* Approvals List */}
      {!isScanning && filteredApprovals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredApprovals.length} of {approvals.length} approval{approvals.length !== 1 ? 's' : ''} 
              {activeFilter !== 'all' && ` (${activeFilter} filter active)`}
            </p>
            {scanStats && (
              <p className="text-xs text-gray-500">
                From {scanStats.combinationsChecked.toLocaleString()} combinations checked
              </p>
            )}
          </div>
          
          {filteredApprovals.map((approval) => (
            <div key={approval.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {approval.tokenInfo.symbol.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{approval.tokenInfo.name}</h4>
                    <p className="text-sm text-gray-600">{approval.tokenInfo.symbol}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(approval.riskLevel)}`}>
                  {approval.riskLevel} risk
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Protocol:</span>
                  <div className="flex items-center space-x-1">
                    <span>{getCategoryIcon(approval.category)}</span>
                    <span className="font-medium">{approval.spenderInfo.protocol}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Contract:</span>
                  <span className="font-medium text-right max-w-[200px] truncate">
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
                  onClick={() => window.open(`https://basescan.org/address/${approval.spender}`, '_blank')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Contract</span>
                </button>
                {approval.spenderInfo.website && (
                  <button
                    onClick={() => window.open(approval.spenderInfo.website, '_blank')}
                    className="px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    🌐
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Empty State */}
      {!isScanning && approvals.length === 0 && !scanError && (
        <div className="text-center py-12">
          <div className="text-green-600 text-6xl mb-4">🛡️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Wallet Secure!</h3>
          <p className="text-gray-600 mb-4">No token approvals found on Base network</p>
          {scanStats && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-green-800">
                ✅ Scanned {scanStats.combinationsChecked.toLocaleString()} contract combinations
              </p>
              <p className="text-xs text-green-600 mt-1">
                {configSummary.totalTokens} tokens × {configSummary.totalSpenders} protocols
              </p>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Error State */}
      {scanError && (
        <div className={`border rounded-lg p-4 ${
          scanError.includes('secure') 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <p className={`font-medium ${
            scanError.includes('secure') ? 'text-green-800' : 'text-red-800'
          }`}>
            {scanError}
          </p>
          {scanStats && scanError.includes('secure') && (
            <p className="text-xs text-green-600 mt-2">
              Comprehensive scan completed: {scanStats.combinationsChecked.toLocaleString()} combinations verified
            </p>
          )}
        </div>
      )}
    </div>
  )
}
