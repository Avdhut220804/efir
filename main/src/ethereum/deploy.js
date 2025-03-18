const HDWalletProvider = require('@truffle/hdwallet-provider');
const { Web3 } = require('web3');
const compiledContract = require('./contracts/build/ComplaintRegistry.json');
require('dotenv').config();

console.log('Deploying contract...');
console.log('Mnemonic:', process.env.MNEMONIC);
console.log('Alchemy URL:', process.env.ALCHEMY_URL);

const provider = new HDWalletProvider(
    process.env.MNEMONIC,
    process.env.ALCHEMY_URL
);

const web3 = new Web3(provider);

const deploy = async () => {
    try {
        const accounts = await web3.eth.getAccounts();
        console.log('Deploying from account:', accounts[0]);

        const result = await new web3.eth.Contract(compiledContract.abi)
            .deploy({ data: compiledContract.evm.bytecode.object })
            .send({ from: accounts[0] });

        console.log('Contract deployed to:', result.options.address);
        provider.engine.stop();

        // Save contract address to environment file
        require('fs').appendFileSync('.env', `\nCONTRACT_ADDRESS=${result.options.address}`);
    } catch (error) {
        console.error('Deployment error:', error);
        provider.engine.stop();
    }
};

deploy().catch(error => {
    console.error('Unhandled error:', error);
    provider.engine.stop();
});
