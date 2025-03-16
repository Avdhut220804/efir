
const Web3 = require('web3');
require('dotenv').config();

const provider = new Web3.providers.HttpProvider(process.env.ALCHEMY_URL);
const web3 = new Web3(provider);

module.exports = web3;
