
const express = require("express");
const router = express.Router();
const {register} = require("../controller/complaint/registerComplaint");
const {fetchComplaint, fetchComplaintSuper} = require("../controller/complaint/fetchComplaints");
const {handler} = require("../controller/complaint/complaintHandler");
// Regular complaint routes
router.post("/register-complaint", register);
router.post("/fetchComplaint/:firId?", fetchComplaint);
router.get("/fetchSuper/:userId?", fetchComplaintSuper);
router.post("/handleComlplaints/superUser", handler);

module.exports = router;
