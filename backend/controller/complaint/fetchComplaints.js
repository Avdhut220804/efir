const User = require("../../model/user");
const Complaint = require("../../model/complainant");
const personSchema = require("../../model/person");
const mongoose = require("mongoose");

exports.fetchComplaint = async (req, res) => {
  try {
    console.log(123);
    const firId = req.params.firId;

    console.log(req.params);

    if (firId) {
      const fir = await Complaint.findOne({ firId }).populate({
        path: "VictimIds AccusedIds WitnessIds filedBy",
      });

      if (!fir) {
        return res.status(401).json({ message: "FIR not found" });
      }

      return res.status(200).json({ fir: [fir] });
    }

    const userId = req.body.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const userReq = await User.findById(userId).populate({
      path: "filedComplaints",
      populate: {
        path: "VictimIds AccusedIds WitnessIds filedBy",
      },
    });

    if (!userReq) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ fir: userReq.filedComplaints });
  } catch (err) {
    console.error("Error fetching complaint:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.fetchComplaintSuper = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    const userId = req.params.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const currentUser = await User.findById(userId);
    // if (!currentUser || currentUser.role != "super") {
    //   return res.status(401).json({
    //     message: "Unauthorized",
    //   });
    // }

    if (req.query.fromDateIncident && req.query.toDateIncident) {
      filter["IncidentDetail.TimeDateofIncident"] = {
        $gte: new Date(req.query.fromDateIncident),
        $lte: new Date(req.query.toDateIncident),
      };
    }

    if (req.query.fromDateLastEdited && req.query.toDateLastEdited) {
      filter["LastEdited"] = {
        $gte: new Date(req.query.fromDateLastEdited),
        $lte: new Date(req.query.toDateLastEdited) || new Date.now(),
      };
    }

    if (req.query.district) {
      filter["IncidentDetail.District"] = req.query.district;
    }

    if (req.query.subDistrict) {
      filter["IncidentDetail.SubDistrict"] = req.query.subDistrict;
    }

    if (req.query.Categories) {
      filter["Categories"] = {
        $in: req.query.Categories,
      };
    }

    if (req.query.aadhar) {
      console.log(req.query.aadhar);
      const person = await personSchema.findOne({ aadhar: req.query.aadhar });
      console.log(person);

      if (person) {
        filter["$or"] = [
          { VictimIds: { $elemMatch: { $eq: person._id } } },
          { AccusedIds: { $elemMatch: { $eq: person._id } } },
          { WitnessIds: { $elemMatch: { $eq: person._id } } },
        ];
      }
    }

    if (req.query.status) {
      filter["complaintStatus.status"] = req.query.status;
    }

    if (req.query.uniqueUserId) {
      filter["complaintStatus.uniqueUserId"] = {
        $regex: `^${req.query.uniqueUserId}`,
        $options: "i",
      };
    }

    console.log(filter);

    // Database fetch (commented out)
    // const complaints = await Complaint.find(filter)
    //   .sort({ LastEdited: -1 })
    //   .skip(skip)
    //   .limit(limit)
    //   .populate({
    //     path: "VictimIds AccusedIds WitnessIds filedBy complaintStatus.user",
    //   });
    // const totalComplaints = await Complaint.countDocuments(filter);

    // Blockchain fetch
    const contract = require('../../config/contract');
    const complaintIds = await contract.methods.complaintIds().call();
    const blockchainComplaints = [];
    
    // Get complaints from the range based on pagination
    const start = (page - 1) * limit;
    const end = Math.min(start + limit, complaintIds.length);
    
    for(let i = start; i < end; i++) {
      const firId = complaintIds[i];
      const complaint = await contract.methods.getComplaint(firId).call();
      
      // Parse IPFS hashes to get actual data
      const metadataResponse = await fetch(`https://ipfs.io/ipfs/${complaint.metadataHash}`);
      const metadata = await metadataResponse.json();
      
      blockchainComplaints.push({
        firId: firId,
        evidenceHash: complaint.evidenceHash,
        metadataHash: complaint.metadataHash,
        status: complaint.status,
        reporter: complaint.reporter,
        timestamp: complaint.timestamp,
        ...metadata // Spread the metadata which contains IncidentDetail, Summary, etc.
      });
    }

    res.status(200).json({
      complaints: blockchainComplaints,
      currentPage: page,
      totalPages: Math.ceil(complaintIds.length / limit),
    });
  } catch (err) {
    console.error("Error fetching complaint:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
