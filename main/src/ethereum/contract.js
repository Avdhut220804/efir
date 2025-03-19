import web3 from "./web3";
import ComplaintRegistry from "../ethereum/contracts/build/ComplaintRegistry.json";

const contractAddress = "0x351Cc89a15DeFAb05e91e5558a1788D14076451a";

// Debugging Logs
console.log("✅ Web3 instance in contract.js:", web3);
console.log("✅ Web3.eth:", web3?.eth);
console.log("✅ ComplaintRegistry ABI:", ComplaintRegistry?.abi);

if (!web3 || !web3.eth) {
  throw new Error("❌ Web3 is not initialized properly.");
}

if (!ComplaintRegistry || !ComplaintRegistry.abi) {
  throw new Error("❌ ComplaintRegistry ABI is missing or incorrect.");
}

const instance = new web3.eth.Contract(ComplaintRegistry.abi, contractAddress);

console.log("✅ Contract initialized at:", contractAddress);

export default instance;
