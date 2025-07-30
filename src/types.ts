export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
}

export interface TokenApproval {
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

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  totalCost: string;
  usdEstimate: number;
}
