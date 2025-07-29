// ===================================
// FILE: src/types.ts
// TypeScript type definitions
// ===================================

import { ethers } from 'ethers';

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
}

export interface SpenderInfo {
  name: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TokenApproval {
  id: string;
  tokenAddress: string;
  tokenInfo: TokenInfo;
  spender: string;
  spenderName: string;
  allowance: ethers.BigNumber;
  allowanceFormatted: string;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedValue: number;
  lastUpdated: number;
  gasEstimate?: GasEstimate;
}

export interface GasEstimate {
  gasLimit: ethers.BigNumber;
  gasPrice: ethers.BigNumber;
  totalCost: ethers.BigNumber;
  totalCostFormatted: string;
  usdEstimate: number;
}

export interface ScannerConfig {
  basescanApiKey: string;
  rpcUrl: string;
  chainId: number;
  multicallAddress: string;
}

export interface Network {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}
