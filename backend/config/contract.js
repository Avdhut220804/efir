
const web3 = require('./web3');
const ComplaintRegistry = require('../contracts/build/ComplaintRegistry.json');

const contractAddress = process.env.CONTRACT_ADDRESS;

const instance = new web3.eth.Contract(
  ComplaintRegistry.abi,
  contractAddress
);

module.exports = instance;
