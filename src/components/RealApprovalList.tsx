// ===================================
// File: src/components/RealApprovalList.tsx
// Component that only shows real approvals
// ===================================

import React from 'react'
import { useRealApprovalScanner } from '../hooks/useRealApprovalScanner'

export function RealApprovalList() {
  const { approvals, isScanning, scanError, scanForRealApprovals } = useRealApprovalScanner()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Token Approvals</h3>
        <button
          onClick={scanForRealApprovals}
          disabled={isScanning}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
        >
          {isScanning ? 'Scanning Blockchain...' : 'Scan for Real Approvals'}
        </button>
      </div>

      {isScanning && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Checking blockchain for real token approvals...</p>
          <p className="text-sm text-gray-500">This may take a moment</p>
        </div>
      )}

      {/* Only shows real approvals from blockchain */}
      {!isScanning && approvals.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Found {approvals.length} real approval{approvals.length !== 1 ? 's' : ''} on Base network
          </p>
          {approvals.map((approval) => (
            <div key={approval.id} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{approval.tokenInfo.symbol}</h4>
                  <p className="text-sm text-gray-600">→ {approval.spenderName}</p>
                  <p className="text-sm">
                    <span className="text-gray-500">Allowance:</span>{' '}
                    <span className={approval.isUnlimited ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {approval.allowanceFormatted}
                    </span>
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${
                  approval.riskLevel === 'high' 
                    ? 'bg-red-100 text-red-800' 
                    : approval.riskLevel === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {approval.riskLevel} risk
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Secure state when no real approvals found */}
      {!isScanning && approvals.length === 0 && !scanError && (
        <div className="text-center py-8">
          <div className="text-green-600 text-4xl mb-4">🛡️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Wallet Secure</h3>
          <p className="text-gray-600">No token approvals found on Base network</p>
        </div>
      )}

      {/* Error state */}
      {scanError && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">{scanError}</p>
        </div>
      )}
    </div>
  )
}
