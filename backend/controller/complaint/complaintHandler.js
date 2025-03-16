const User = require("../../model/user");
const Complaint = require("../../model/complainant");
const mongoose = require("mongoose");

exports.handler = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.body.userId);
    const complaintId = req.body.complaintId;
    const remark = req.body.remark;
    const state = req.query.state;

    console.log(state, remark, complaintId, userId);

    if (
      !state ||
      !complaintId ||
      !userId ||
      (state !== "true" && state !== "false")
    ) {
      return res.status(400).json({
        message: "Invalid data",
      });
    }

    const connectedUser = await User.findById(userId);
    let reqComplaint = await Complaint.findById(complaintId);

    if (!connectedUser || !reqComplaint) {
      return res.status(403).json({
        message: "Invalid data",
      });
    }

    // if (connectedUser.role !== "Super") {
    //   return res.status(401).json({
    //     message: "Unauthorized",
    //   });
    // }

    if (state === "true") {
      reqComplaint.complaintStatus = {
        date: new Date(),
        uniqueUserId: connectedUser.uniqueUserId,
        user: userId,
        status: "Completed",
        remark: remark || "No remark provided",
      };
    } else {
      reqComplaint.complaintStatus = {
        date: new Date(),
        uniqueUserId: connectedUser.uniqueUserId,
        user: userId,
        status: "Park", 
        remark: remark || "No remark provided",
      };
    }

    await reqComplaint.save();

    // Update status on blockchain
    try {
      const { updateComplaintStatusOnChain } = require('../../utils/blockchainUtils');
      await updateComplaintStatusOnChain(
        complaintId,
        reqComplaint.complaintStatus.status,
        process.env.ADMIN_ACCOUNT // Replace with actual user's ETH address in production
      );
    } catch (error) {
      console.error('Blockchain status update failed:', error);
      // Continue with database-only update if blockchain fails
    }

    return res.status(200).json({
      message: "Complaint status updated successfully",
      updatedComplaint: reqComplaint,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
