
import Web3 from 'web3';
import ContractJSON from '../ethereum/contracts/build/ComplaintRegistry.json';
import { uploadToIPFS } from './ipfsUtils';

const web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');
const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(ContractJSON.abi, contractAddress);

export const fileComplaintOnChain = async (firId, evidenceUrls, complaintData) => {
  try {
    console.log('Starting blockchain storage...');
    
    const evidenceHash = await uploadToIPFS(evidenceUrls);
    const metadataHash = await uploadToIPFS(complaintData);
    
    console.log('Generated hashes:', { evidenceHash, metadataHash });
    
    const accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No Ethereum accounts available');
    }
    
    console.log('Using account:', accounts[0]);
    console.log('Filing complaint with FIR ID:', firId);
    
    const gasEstimate = await contract.methods
      .fileComplaint(firId.toString(), evidenceHash, metadataHash)
      .estimateGas({ from: accounts[0] });
    
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

export const getComplaintFromChain = async (firId) => {
  try {
    const result = await contract.methods.getComplaint(firId).call();
    return result;
  } catch (error) {
    console.error('Error getting complaint:', error);
    throw error;
  }
};
