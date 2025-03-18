
const web3 = require('./web3');
const ComplaintRegistry = require('../contracts/build/ComplaintRegistry.json');

const contractAddress = process.env.CONTRACT_ADDRESS;

if (!contractAddress) {
  throw new Error('Contract address not found in environment variables');
}

const instance = new web3.eth.Contract(
  ComplaintRegistry.abi,
  contractAddress
);

if (!instance) {
  throw new Error('Failed to initialize contract instance');
}

console.log('Contract initialized at:', contractAddress);

module.exports = instance;
