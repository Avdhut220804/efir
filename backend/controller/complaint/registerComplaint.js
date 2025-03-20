const user = require("../../model/user");
const Complaint = require("../../model/complainant");
const personSchema = require("../../model/person");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const genAI = new GoogleGenerativeAI(process.env.API_KEY_GEN_AI);
const pino = require('pino');
const logger = pino(pino.transport({
  target: 'pino-pretty',
  options: { colorize: true }
}));


const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;


const generateSummary = async (data) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt =
      JSON.stringify(data) +
      " " +
      "generate the summary of the complaint in short paragraph";

    const result = await model.generateContent(prompt, { maxLength: 100 });
    const response = await result.response;
    logger.info(response.text());
    return response.text();
  } catch (err) {
    logger.error("Error generating summary:", err);
    throw err;
  }
};

const getCategories = async (data) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt =
      JSON.stringify(data) +
      `[ "Cognizable Offenses", "Non-Cognizable Offenses", "Bailable Offenses", "Non-Bailable Offenses", "Compoundable Offenses", "Non-Compoundable Offenses", "Offenses against Women", "Offenses against Children", "Economic Offenses", "Cyber Crimes", "Drug Offenses", "Environmental Offenses", "Traffic Offenses", "Property Offenses", "Terrorism-related Offenses", "White-collar Crimes", "Corruption Offenses", "Fraudulent Practices", "Domestic Violence Offenses", "Sexual Harassment Offenses", "Human Trafficking Offenses", "Intellectual Property Crimes", "Hate Crimes", "Juvenile Offenses", "Organized Crime", "Money Laundering Offenses", "Forgery and Counterfeiting Offenses", "Alcohol-related Offenses", "Public Order Offenses", "Violation of Intellectual Property Rights", "Cyberbullying Offenses", "Religious Offenses", "Wildlife Crimes", "Labour Law Violations", "Immigration Offenses", ]` +
      " " +
      "from above json identify and return the array of categories they are fitting refers the categories array (if not matches return 'Not Identified'";

    const result = await model.generateContent(prompt, { maxLength: 100 });
    const response = await result.response;
    const arrayString = response.text();
    logger.info(response.text());

    if (arrayString)
      return categories.filter((ele) => arrayString.includes(ele));
    return ""
  } catch (err) {
    logger.error("Error generating summary:", err);
    throw err;
  }
};

exports.register = async (req, res) => {
  try {
    const { VictimArray, AccusedArray, WitnessArray, IncidentDetails, userId } =
      req.body;

    let Summary = "";
    let Categories = [];

    try {
      Summary = await generateSummary({
        VictimArray,
        AccusedArray,
        WitnessArray,
        IncidentDetails,
      });
    } catch (summaryErr) {
      logger.error("Error generating summary:", summaryErr);
    }

    try {
      Categories = await getCategories({
        VictimArray,
        AccusedArray,
        WitnessArray,
        IncidentDetails,
      });
    } catch (categoriesErr) {
      logger.error("Error getting categories:", categoriesErr);
    }

    const evidences = req.files
      ? Object.values(req.files).map((file) => file)
      : [];

    const createPersonArray = async (personArray) => {
      const personIds = [];
      for (let personData of personArray) {
        personData = {
          ...personData,
          age: parseInt(personData.age),
          aadhar: parseInt(personData.aadhar),
          contact: parseInt(personData.contact),
        };

        const filteredPersonData = Object.fromEntries(
          Object.entries(personData).filter(([key, value]) => value)
        );

        logger.info(filteredPersonData);
        const newPerson = new personSchema(filteredPersonData);
        await newPerson.save();
        personIds.push(newPerson._id);
      }
      return personIds;
    };

    const parsedVictimArray = JSON.parse(VictimArray);
    const parsedAccusedArray = JSON.parse(AccusedArray);
    const parsedWitnessArray = JSON.parse(WitnessArray);
    let parsedIncidentDetails = JSON.parse(IncidentDetails);
    logger.info(parsedIncidentDetails);
    parsedIncidentDetails = {
      ...parsedIncidentDetails,
      TimeDateofIncident: new Date(parsedIncidentDetails.TimeDateofIncident),
    };

    const VictimIds = await createPersonArray(parsedVictimArray);
    const AccusedIds = await createPersonArray(parsedAccusedArray);
    const WitnessIds = await createPersonArray(parsedWitnessArray);

    const uploadedUrls = await Promise.all(
      evidences.map((file) => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_large(
            file.tempFilePath,
            { resource_type: "auto" },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                logger.info(result);
                resolve(result.secure_url);
              }
            }
          );
        });
      })
    );

    logger.info(uploadedUrls);

    let filedBy = null;
    if (userId) {
      filedBy = new mongoose.Types.ObjectId(userId);
    }

    let firId;
    let isUnique = false;

    while (!isUnique) {
      firId = Math.floor(Math.random() * 10000);
      const existingRecord = await Complaint.findOne({ firId });

      if (!existingRecord) {
        isUnique = true;
      }
    }

    // Create complaint in database
    const newComplaint = await Complaint.create({
      VictimIds: VictimIds.map((id) => new mongoose.Types.ObjectId(id)),
      AccusedIds: AccusedIds.map((id) => new mongoose.Types.ObjectId(id)),
      WitnessIds: WitnessIds.map((id) => new mongoose.Types.ObjectId(id)),
      IncidentDetail: parsedIncidentDetails,
      filedBy,
      Evidence: uploadedUrls,
      firId,
      Summary,
      Categories,
    });


    if (userId) {
      await user.updateOne(
        { _id: userId },
        {
          $addToSet: {
            filedComplaints: new mongoose.Types.ObjectId(newComplaint._id),
          },
        }
      );
    }

    res.status(200).json({
      message: "Complaint Filed Successfully",
      complaintId: newComplaint.firId,
      blockchainData
    });
  } catch (err) {
    logger.error("Error registering complaint:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};



const categories = [
  "Cognizable Offenses",
  "Non-Cognizable Offenses",
  "Bailable Offenses",
  "Non-Bailable Offenses",
  "Compoundable Offenses",
  "Non-Compoundable Offenses",
  "Offenses against Women",
  "Offenses against Children",
  "Economic Offenses",
  "Cyber Crimes",
  "Drug Offenses",
  "Environmental Offenses",
  "Traffic Offenses",
  "Property Offenses",
  "Terrorism-related Offenses",
  "White-collar Crimes",
  "Corruption Offenses",
  "Fraudulent Practices",
  "Domestic Violence Offenses",
  "Sexual Harassment Offenses",
  "Human Trafficking Offenses",
  "Intellectual Property Crimes",
  "Hate Crimes",
  "Juvenile Offenses",
  "Organized Crime",
  "Money Laundering Offenses",
  "Forgery and Counterfeiting Offenses",
  "Alcohol-related Offenses",
  "Public Order Offenses",
  "Violation of Intellectual Property Rights",
  "Cyberbullying Offenses",
  "Religious Offenses",
  "Wildlife Crimes",
  "Labour Law Violations",
  "Immigration Offenses",
  "Not Identified",
];
