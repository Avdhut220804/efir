
const contract = require('../config/contract');
const web3 = require('../config/web3');

const uploadToIPFS = async (data) => {
  // For now returning a simple hash, in production integrate with IPFS
  return web3.utils.keccak256(JSON.stringify(data));
};

const fileComplaintOnChain = async (firId, evidenceUrls, complaintData) => {
  try {
    const evidenceHash = await uploadToIPFS(evidenceUrls);
    const metadataHash = await uploadToIPFS(complaintData);
    
    const accounts = await web3.eth.getAccounts();
    const result = await contract.methods
      .fileComplaint(firId.toString(), evidenceHash, metadataHash)
      .send({ from: accounts[0], gas: "20000000" });
      
    return result;
  } catch (error) {
    console.error('Blockchain error:', error);
    throw error;
  }
};

const updateComplaintStatusOnChain = async (firId, status) => {
  try {
    const accounts = await web3.eth.getAccounts();
    const result = await contract.methods
      .updateStatus(firId.toString(), status)
      .send({ from: accounts[0], gas: "20000000" });
      
    return result;
  } catch (error) {
    console.error('Blockchain error:', error);
    throw error;
  }
};

module.exports = {
  fileComplaintOnChain,
  updateComplaintStatusOnChain
};
