const express = require("express");
const router = express.Router();
const { fetchBlockchainComplaint } = require("../controller/complaint/fetchBlockchainComplaints");
const { fetchDatabaseComplaints } = require("../controller/complaint/fetchDatabaseComplaints"); // Assumed existing function


// Route for fetching complaints from the database (assumed existing route)
router.get("/complaints", async (req, res) => {
  try {
    const complaints = await fetchDatabaseComplaints();
    res.json(complaints);
  } catch (error) {
    console.error("Error fetching database complaints:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});


// New route for fetching complaints from the blockchain (for super users only)
router.get("/blockchainComplaints", async (req, res) => {
  try {
    const complaints = await fetchBlockchainComplaint();
    res.json(complaints);
  } catch (error) {
    console.error("Error fetching blockchain complaints:", error);
    res.status(500).json({ error: "Failed to fetch blockchain complaints" });
  }
});

module.exports = router;