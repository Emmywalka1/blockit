// ==================================================
// FILE: src/ApprovalRevoker.ts
// Gas-Optimized Approval Revoker
// ==================================================

class ProductionApprovalRevoker {
  constructor(signer) {
    this.signer = signer;
    this.erc20Abi = [
      "function approve(address spender, uint256 amount) returns (bool)"
    ];
  }

  // Estimate gas cost for revoke operation
  async estimateRevokeGas(tokenAddress, spenderAddress) {
    try {
      const contract = new ethers.Contract(tokenAddress, this.erc20Abi, this.signer);
      
      // Estimate gas for approval
      const gasEstimate = await contract.estimateGas.approve(spenderAddress, 0);
      
      // Add 20% buffer for safety
      const gasWithBuffer = gasEstimate.mul(120).div(100);
      
      // Get current gas price (Base network is very cheap)
      const gasPrice = await this.signer.getGasPrice();
      
      const totalCost = gasWithBuffer.mul(gasPrice);
      
      return {
        gasLimit: gasWithBuffer,
        gasPrice,
        totalCost,
        totalCostFormatted: ethers.utils.formatEther(totalCost),
        usdEstimate: parseFloat(ethers.utils.formatEther(totalCost)) * 3000 // ETH price estimate
      };
    } catch (error) {
      console.error('Gas estimation failed:', error);
      
      // Fallback for Base network (very low gas)
      const fallbackGasPrice = ethers.utils.parseUnits('0.001', 'gwei');
      const fallbackGasLimit = ethers.BigNumber.from('50000');
      const fallbackCost = fallbackGasLimit.mul(fallbackGasPrice);
      
      return {
        gasLimit: fallbackGasLimit,
        gasPrice: fallbackGasPrice,
        totalCost: fallbackCost,
        totalCostFormatted: ethers.utils.formatEther(fallbackCost),
        usdEstimate: 0.01 // Very cheap on Base
      };
    }
  }

  // Revoke single approval
  async revokeApproval(tokenAddress, spenderAddress) {
    try {
      const contract = new ethers.Contract(tokenAddress, this.erc20Abi, this.signer);
      
      // Get gas estimate
      const gasInfo = await this.estimateRevokeGas(tokenAddress, spenderAddress);
      
      console.log(`Revoking approval for ${tokenAddress} to ${spenderAddress}`);
      console.log(`Estimated gas cost: $${gasInfo.usdEstimate.toFixed(4)}`);
      
      // Execute transaction with optimized gas
      const tx = await contract.approve(spenderAddress, 0, {
        gasLimit: gasInfo.gasLimit,
        gasPrice: gasInfo.gasPrice
      });
      
      console.log(`Transaction submitted: ${tx.hash}`);
      
      return {
        transaction: tx,
        gasInfo,
        success: true
      };
    } catch (error) {
      console.error('Revoke transaction failed:', error);
      throw new Error(`Failed to revoke approval: ${error.message}`);
    }
  }

  // Batch revoke multiple approvals (future feature)
  async batchRevoke(approvals) {
    const results = [];
    
    for (const approval of approvals) {
      try {
        const result = await this.revokeApproval(approval.tokenAddress, approval.spender);
        results.push({ ...approval, ...result });
        
        // Wait for confirmation before proceeding to next
        await result.transaction.wait(1);
        
      } catch (error) {
        results.push({
          ...approval,
          error: error.message,
          success: false
        });
      }
    }
    
    return results;
  }
}
