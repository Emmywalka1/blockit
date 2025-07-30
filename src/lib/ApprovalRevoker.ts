import { ethers } from 'ethers';
import { GasEstimate } from '../types';

export class ApprovalRevoker {
  private signer: ethers.Signer;

  constructor(signer: ethers.Signer) {
    this.signer = signer;
  }

  private erc20Abi = [
    "function approve(address spender, uint256 amount) returns (bool)"
  ];

  async estimateGas(tokenAddress: string, spenderAddress: string): Promise<GasEstimate> {
    try {
      const contract = new ethers.Contract(tokenAddress, this.erc20Abi, this.signer);
      
      const gasEstimate = await contract.estimateGas.approve(spenderAddress, 0);
      const gasPrice = await this.signer.getGasPrice();
      
      // Add 20% buffer
      const gasLimit = gasEstimate.mul(120).div(100);
      const totalCost = gasLimit.mul(gasPrice);
      
      return {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        totalCost: totalCost.toString(),
        usdEstimate: parseFloat(ethers.utils.formatEther(totalCost)) * 3000 // ETH price estimate
      };
    } catch (error) {
      // Fallback for Base network
      return {
        gasLimit: '50000',
        gasPrice: ethers.utils.parseUnits('0.001', 'gwei').toString(),
        totalCost: ethers.utils.parseUnits('0.00005', 'ether').toString(),
        usdEstimate: 0.01
      };
    }
  }

  async revokeApproval(tokenAddress: string, spenderAddress: string): Promise<{ transaction: ethers.ContractTransaction; gasInfo: GasEstimate }> {
    try {
      const contract = new ethers.Contract(tokenAddress, this.erc20Abi, this.signer);
      const gasInfo = await this.estimateGas(tokenAddress, spenderAddress);
      
      const tx = await contract.approve(spenderAddress, 0, {
        gasLimit: gasInfo.gasLimit,
        gasPrice: gasInfo.gasPrice
      });
      
      return { transaction: tx, gasInfo };
    } catch (error) {
      throw new Error(`Failed to revoke approval: ${error}`);
    }
  }
}
