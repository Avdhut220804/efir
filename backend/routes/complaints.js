
const express = require("express");
const router = express.Router();
const {register} = require("../controller/complaint/registerComplaint");
const {fetchComplaint, fetchComplaintSuper} = require("../controller/complaint/fetchComplaints");
const {handler} = require("../controller/complaint/complaintHandler");
const {fetchBlockchainComplaint} = require("../controller/complaint/fetchBlockchainComplaints");

// Regular complaint routes
router.post("/register-complaint", register);
router.post("/fetchComplaint/:firId?", fetchComplaint);
router.get("/fetchSuper/:userId?", fetchComplaintSuper);
router.post("/handleComlplaints/superUser", handler);

// Blockchain routes
router.get("/blockchain/:firId", fetchBlockchainComplaint);
router.get("/blockchain", async (req, res) => {
  try {
    const complaints = await fetchBlockchainComplaint();
    res.json(complaints);
  } catch (error) {
    console.error("Error fetching blockchain complaints:", error);
    res.status(500).json({ error: "Failed to fetch blockchain complaints" });
  }
});

module.exports = router;
