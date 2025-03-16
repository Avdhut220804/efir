
const contract = require('../config/contract');
const web3 = require('../config/web3');

const uploadToIPFS = async (data) => {
  // For now returning a simple hash, in production integrate with IPFS
  return web3.utils.keccak256(JSON.stringify(data));
};

const fileComplaintOnChain = async (firId, evidenceUrls, complaintData) => {
  try {
    console.log('Starting blockchain complaint filing...', { firId, evidenceUrls, complaintData });
    
    // Debug contract
    console.log('Contract address:', contract.options.address);
    
    const evidenceHash = await uploadToIPFS(evidenceUrls);
    const metadataHash = await uploadToIPFS(complaintData);
    console.log('Generated hashes:', { evidenceHash, metadataHash });
    
    // Get accounts with error handling
    const accounts = await web3.eth.getAccounts().catch(err => {
      console.error('Failed to get accounts:', err);
      throw new Error('Failed to get Ethereum accounts');
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No Ethereum accounts available');
    }
    
    console.log('Using account:', accounts[0]);
    console.log('Filing complaint with FIR ID:', firId);
    
    // Estimate gas first
    const gasEstimate = await contract.methods
      .fileComplaint(firId.toString(), evidenceHash, metadataHash)
      .estimateGas({ from: accounts[0] })
      .catch(err => {
        console.error('Gas estimation failed:', err);
        return 20000000; // Fallback gas limit
      });
    
    console.log('Estimated gas:', gasEstimate);
    
    const result = await contract.methods
      .fileComplaint(firId.toString(), evidenceHash, metadataHash)
      .send({ 
        from: accounts[0], 
        gas: gasEstimate,
        gasPrice: await web3.eth.getGasPrice()
      });
      
    console.log('Complaint filed on blockchain:', result.transactionHash);
    return result;
  } catch (error) {
    console.error('Blockchain error details:', error);
    throw error;
  }
};

const updateComplaintStatusOnChain = async (firId, status) => {
  try {
    console.log('Starting blockchain status update...');
    const accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No Ethereum accounts available');
    }
    
    console.log('Using account:', accounts[0]);
    const result = await contract.methods
      .updateStatus(firId.toString(), status)
      .send({ 
        from: accounts[0], 
        gas: "20000000",
        gasPrice: await web3.eth.getGasPrice()
      });
      
    console.log('Status updated on blockchain:', result.transactionHash);
    return result;
  } catch (error) {
    console.error('Blockchain error details:', error);
    throw error;
  }
};

module.exports = {
  fileComplaintOnChain,
  updateComplaintStatusOnChain
};
