
import web3 from '../ethereum/web3';
import contract from '../ethereum/contract';
// import ContractJSON from '../ethereum/contracts/build/ComplaintRegistry.json';
// import { uploadToIPFS } from './ipfsUtils';

// const web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');
// const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
// const contract = new web3.eth.Contract(ContractJSON.abi, contractAddress);

export const fileComplaintOnChain = async (firId, evidenceUrls, complaintData) => {
  try {
    // console.log('Starting blockchain storage...');
    
    // const evidenceHash = await uploadToIPFS(evidenceUrls);
    // const metadataHash = await uploadToIPFS(complaintData);
    
    // console.log('Generated hashes:', { evidenceHash, metadataHash });
    console.log('getting accounts...');
    const accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      console.log('No Ethereum accounts available');
      throw new Error('No Ethereum accounts available');
    }
    
    console.log('Using account:', accounts[0]);
    console.log('Filing complaint with FIR ID:', firId);
    
    console.log('gettting gas estimate...');
    const gasEstimate = await contract.methods
      .fileComplaint(firId.toString(), evidenceUrls, complaintData)
      .estimateGas({ from: accounts[0] });
    
      console.log('calling contract...');
    const result = await contract.methods
      .fileComplaint(firId.toString(), evidenceUrls, complaintData)
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

export const updateComplaintStatusOnChain = async (firId, status) => {
  try {
    console.log('Starting blockchain status update...');
    const accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No Ethereum accounts available');
    }
    
    console.log('Using account:', accounts[0]);
    const gasEstimate = await contract.methods
      .updateStatus(firId.toString(), status)
      .estimateGas({ from: accounts[0] });
      
    const result = await contract.methods
      .updateStatus(firId.toString(), status)
      .send({ 
        from: accounts[0], 
        gas: gasEstimate,
        gasPrice: await web3.eth.getGasPrice()
      });
      
    console.log('Status updated on blockchain:', result.transactionHash);
    return result;
  } catch (error) {
    console.error('Blockchain error details:', error);
    throw error;
  }
};

export const fetchComplaintFromChain = async (firId) => {
  try {
    const complaint = await contract.methods.getComplaint(firId).call();
    
    try {
      const metadataResponse = await fetch(`https://ipfs.io/ipfs/${complaint.metadataHash}`);
      const metadata = await metadataResponse.json();
      
      return {
        firId: firId,
        evidenceHash: complaint.evidenceHash,
        metadataHash: complaint.metadataHash,
        status: complaint.status,
        reporter: complaint.reporter,
        timestamp: complaint.timestamp,
        ...metadata
      };
    } catch (error) {
      return complaint;
    }
  } catch (error) {
    console.error('Error fetching blockchain complaint:', error);
    throw error;
  }
};
