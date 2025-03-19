
const contract = require('../../config/contract');

exports.fetchBlockchainComplaint = async (req, res) => {
  try {
    const firId = req.params.firId;
    if (!firId) {
      return res.status(400).json({ message: "FIR ID is required" });
    }

    const complaint = await contract.methods.getComplaint(firId).call();
    
    try {
      const metadataResponse = await fetch(`https://ipfs.io/ipfs/${complaint.metadataHash}`);
      const metadata = await metadataResponse.json();
      
      return res.status(200).json({
        complaint: {
          firId: firId,
          evidenceHash: complaint.evidenceHash,
          metadataHash: complaint.metadataHash,
          status: complaint.status,
          reporter: complaint.reporter,
          timestamp: complaint.timestamp,
          ...metadata
        }
      });
    } catch (error) {
      return res.status(200).json({ complaint });
    }
  } catch (err) {
    console.error("Error fetching blockchain complaint:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
