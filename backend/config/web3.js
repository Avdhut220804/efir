
const Web3 = require('web3');

let web3;

if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
  // MetaMask is present
  web3 = new Web3(window.ethereum);
  window.ethereum.enable().catch(error => {
    console.error("User denied account access");
  });
} else {
  // We are on the server *OR* the user is not running MetaMask
  const provider = new Web3.providers.HttpProvider(
    process.env.ALCHEMY_URL
  );
  web3 = new Web3(provider);
}

module.exports = web3;
