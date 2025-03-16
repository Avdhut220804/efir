
const Web3 = require('web3');

let web3;

if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
  window.ethereum.request({ method: "eth_requestAccounts" });
  web3 = new Web3(window.ethereum);
} else {
  const provider = new Web3.providers.HttpProvider(
    process.env.ALCHEMY_URL || "https://opt-sepolia.g.alchemy.com/v2/your-api-key"
  );
  web3 = new Web3(provider);
}

module.exports = web3;
