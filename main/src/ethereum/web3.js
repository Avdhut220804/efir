import Web3 from "web3";

let web3;

if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
  console.log("🦊 MetaMask detected!");
  window.ethereum.request({ method: "eth_requestAccounts" })
    .then(() => {
      console.log("✅ MetaMask connected!");
    })
    .catch((error) => {
      console.error("❌ MetaMask connection error:", error);
    });

  web3 = new Web3(window.ethereum);
} else {
  console.warn("⚠️ No MetaMask detected! Using Alchemy HTTP provider.");
  const provider = new Web3.providers.HttpProvider(
    "https://opt-sepolia.g.alchemy.com/v2/ZfW5FmNeK1qY_Ic1wllZyxrhkYtF7pW1"
  );
  web3 = new Web3(provider);
}

console.log("🔹 Web3 instance created:", web3);

export default web3;
