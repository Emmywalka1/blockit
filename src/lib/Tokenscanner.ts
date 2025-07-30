import { ethers } from 'ethers';
import { TokenApproval, TokenInfo } from '../types';

export class TokenScanner {
  private provider: ethers.providers.Provider;
  private userAddress: string;
  private basescanApiKey: string;

  constructor(provider: ethers.providers.Provider, userAddress: string) {
    this.provider = provider;
    this.userAddress = userAddress;
    this.basescanApiKey = import.meta.env.VITE_BASESCAN_API_KEY || '';
  }

  // ERC20 ABI for token interactions
  private erc20Abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)"
  ];

  // Common tokens on Base
  private commonTokens = [
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    '0x4200000000000000000000000000000000000006', // WETH
    '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
    '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDbC
    '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', // cbETH
  ];

  // Common spender contracts
  private commonSpenders = [
    { address: '0x3fc91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', name: 'Uniswap Universal Router', risk: 'low' },
    { address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', name: 'Uniswap Router V3', risk: 'low' },
    { address: '0xE592427A0AEce92De3Edee1F18E0157C05861564', name: 'Uniswap Router V3', risk: 'low' },
    { address: '0x1111111254EEB25477B68fb85Ed929f73A960582', name: '1inch Router', risk: 'medium' },
    { address: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5', name: 'Kyber Network', risk: 'medium' },
  ];

  async scanTokenApprovals(): Promise<TokenApproval[]> {
    try {
      console.log('Starting token approval scan...');
      const approvals: TokenApproval[] = [];

      // Check common token-spender combinations
      for (const tokenAddress of this.commonTokens) {
        for (const spender of this.commonSpenders) {
          try {
            const approval = await this.checkApproval(tokenAddress, spender.address, spender.name, spender.risk as any);
            if (approval) {
              approvals.push(approval);
            }
          } catch (error) {
            console.warn(`Error checking ${tokenAddress} -> ${spender.address}:`, error);
          }
        }
      }

      console.log(`Found ${approvals.length} active approvals`);
      return approvals.sort((a, b) => {
        // Sort by risk level (high first) then by value
        const riskOrder = { high: 3, medium: 2, low: 1 };
        if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        }
        return b.estimatedValue - a.estimatedValue;
      });
    } catch (error) {
      console.error('Token scan failed:', error);
      throw new Error('Failed to scan token approvals');
    }
  }

  private async checkApproval(tokenAddress: string, spenderAddress: string, spenderName: string, riskLevel: 'low' | 'medium' | 'high'): Promise<TokenApproval | null> {
    try {
      const contract = new ethers.Contract(tokenAddress, this.erc20Abi, this.provider);
      
      // Check allowance
      const allowance = await contract.allowance(this.userAddress, spenderAddress);
      
      if (allowance.isZero()) {
        return null; // No approval
      }

      // Get token info
      const [name, symbol, decimals] = await Promise.all([
        contract.name().catch(() => 'Unknown Token'),
        contract.symbol().catch(() => 'UNKNOWN'),
        contract.decimals().catch(() => 18)
      ]);

      const tokenInfo: TokenInfo = { name, symbol, decimals };
      
      // Format allowance
      const allowanceFormatted = this.formatAllowance(allowance, decimals);
      
      // Estimate value
      const estimatedValue = this.estimateValue(allowance, decimals, symbol);

      return {
        id: `${tokenAddress}-${spenderAddress}`,
        tokenAddress,
        tokenInfo,
        spender: spenderAddress,
        spenderName,
        allowance: allowance.toString(),
        allowanceFormatted,
        riskLevel,
        estimatedValue
      };
    } catch (error) {
      console.warn(`Failed to check approval for ${tokenAddress}:`, error);
      return null;
    }
  }

  private formatAllowance(allowance: ethers.BigNumber, decimals: number): string {
    if (allowance.eq(ethers.constants.MaxUint256)) {
      return 'Unlimited';
    }
    
    const formatted = ethers.utils.formatUnits(allowance, decimals);
    const num = parseFloat(formatted);
    
    if (num > 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num > 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    } else {
      return num.toFixed(6);
    }
  }

  private estimateValue(allowance: ethers.BigNumber, decimals: number, symbol: string): number {
    if (allowance.eq(ethers.constants.MaxUint256)) {
      return 999999999; // High value for unlimited
    }
    
    const amount = parseFloat(ethers.utils.formatUnits(allowance, decimals));
    
    // Basic price estimates
    const priceMap: Record<string, number> = {
      'USDC': 1,
      'USDT': 1,
      'DAI': 1,
      'WETH': 3000,
      'ETH': 3000,
      'cbETH': 3000,
      'USDbC': 1
    };
    
    const price = priceMap[symbol.toUpperCase()] || 1;
    return amount * price;
  }
}
