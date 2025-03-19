import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { IoMdAdd } from "react-icons/io";
import AddPeople from "./AddPeople";
import { LiaUserEditSolid } from "react-icons/lia";
import { AiOutlineUserDelete } from "react-icons/ai";
import { IoMdRemoveCircleOutline } from "react-icons/io";
import { NavLink } from "react-router-dom";
import { toast } from "react-hot-toast";
import FirId from "./FirId";
import API_BASE_URL from '../../config/api';
import { uploadToIPFS } from "../../utils/ipfsUtils";
import { fileComplaintOnChain } from "../../utils/blockchainUtils";

const ComplaintForm = ({ currentUser }) => {
  const [townTree, setTownTree] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addPersonFlag, setAddPersonFlag] = useState("");
  const [displayFirId, setDisplayFirId] = useState(null);
  const [complaintDetails, setComplaintDetails] = useState({
    VictimArray: [],
    AccusedArray: [],
    WitnessArray: [],
    IncidentDetail: {
      TimeDateofIncident: "",
      LandMark: "",
      District: "",
      SubDistrict: "",
      IncidentDescription: "",
    },
    evidences: [],
  });
  const [personDetails, setPersonDetails] = useState("");
  const [anonymous, setAnonymous] = useState(!currentUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toastIdRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTownTree = async () => {
      try {
        setIsLoading(true);
        const res = await axios.post(`${API_BASE_URL}/api/v1/fetchTownTree`, {});
        if (isMounted) {
          setTownTree(res.data.data.TownTree || {});
        }
      } catch (err) {
        console.error("Error fetching town tree:", err);
        if (isMounted) {
          setTownTree({});
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTownTree();

    return () => {
      isMounted = false;
    };
  }, []);

  const registerHandler = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      if (currentUser && currentUser._id && !anonymous) {
        formData.append("userId", currentUser._id);
      }
      formData.append("IncidentDetails", JSON.stringify(complaintDetails.IncidentDetail));
      formData.append("VictimArray", JSON.stringify(complaintDetails.VictimArray));
      formData.append("AccusedArray", JSON.stringify(complaintDetails.AccusedArray));
      formData.append("WitnessArray", JSON.stringify(complaintDetails.WitnessArray));
      complaintDetails.evidences.forEach((file, index) => {
        formData.append(`evidences[${index}]`, file);
      });

      toastIdRef.current = toast.loading("Filing FIR...");
      
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/complaints/register-complaint`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.dismiss(toastIdRef.current);
      toast.success("FIR filed successfully");
      const firId = response.data.complaintId;
      setDisplayFirId(firId);

      const { blockchainData } = response.data;
      setTimeout(() => {
        fileComplaintOnChain(
          blockchainData.firId,
          'QmPmY8HfFQ58FmTb3LcNSELvJZePk8zgPfrhxq444fnexi',
          'QmPmY8HfFQ58FmTb3LcNSELvJZePk8zgPfrhxq444fnexi'
        ).catch(error => {
          console.error("Blockchain storage failed:", error);
        });
      }, 0);

      setComplaintDetails({
        VictimArray: [],
        AccusedArray: [],
        WitnessArray: [],
        IncidentDetail: {
          TimeDateofIncident: "",
          LandMark: "",
          District: "",
          SubDistrict: "",
          IncidentDescription: "",
        },
        evidences: [],
      });

    } catch (error) {
      console.error("Error filing FIR:", error);
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
      toast.error("Error filing FIR: " + (error.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onIncidentHandler = (event) => {
    const { id, value } = event.target;
    setComplaintDetails((pre) => ({
      ...pre,
      IncidentDetail: {
        ...pre.IncidentDetail,
        ...(id === "District" ? { SubDistrict: "" } : {}),
        [id]: value,
      },
    }));
  };

  const fileInsertHandler = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setComplaintDetails((prev) => ({
      ...prev,
      evidences: [...prev.evidences, ...fileArray],
    }));
  };

  const validateForm = () => {
    const { TimeDateofIncident, IncidentDescription } = complaintDetails.IncidentDetail;
    if (!TimeDateofIncident || !IncidentDescription) {
      toast.error("Date of incident and description are required fields.");
      return false;
    }
    return true;
  };

  const onSubmitHandler = () => {
    if (validateForm()) {
      registerHandler();
    }
  };

  const removeVictim = (victimToRemove) => {
    setComplaintDetails((prev) => ({
      ...prev,
      VictimArray: prev.VictimArray.filter((victim) => victim !== victimToRemove),
    }));
  };

  const removeAccused = (accusedToRemove) => {
    setComplaintDetails((prev) => ({
      ...prev,
      AccusedArray: prev.AccusedArray.filter((accused) => accused !== accusedToRemove),
    }));
  };

  const removeWitness = (witnessToRemove) => {
    setComplaintDetails((prev) => ({
      ...prev,
      WitnessArray: prev.WitnessArray.filter((witness) => witness !== witnessToRemove),
    }));
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="min-w-[275px] p-4 w-full bg-white my-6 max-w-[1200px] mx-1 shadow-2xl rounded-xl">
      {displayFirId && (
        <div className="fixed top-0 left-0 h-screen w-screen flex justify-center items-center z-50 bg-black bg-opacity-30">
          <FirId
            displayFirId={displayFirId}
            setDisplayFirId={setDisplayFirId}
          />
        </div>
      )}
      <div className="flex flex-col gap-y-6 justify-center items-center">
        <div className="text-2xl font-bold font-poppins">
          Complaint Registration
        </div>

        <div className="border-gray-300 space-y-3 p-4 relative border-4 w-full flex flex-col rounded-2xl">
          <div className="absolute font-bold font-poppins bg-white px-2 text-xl -top-3 left-2">
            Incident Details
          </div>
          <label className="mx-2">
            <span className="mr-4 text-[1rem] font-bold">
              Date Of Incident:<span className="text-red-500">*</span>
            </span>
            <input
              type="date"
              onChange={onIncidentHandler}
              id="TimeDateofIncident"
              value={complaintDetails.IncidentDetail.TimeDateofIncident}
              className="shadow rounded-lg px-3 py-1 w-[8.7rem]"
            />
          </label>
          <div className="relative p-3 border-slate-200 border-2 rounded-xl">
            <div className="absolute font-poppins font-bold bg-white px-2 -top-3 left-2">
              Place Of Incident
            </div>
            <label className="mx-2 py-2 flex flex-col space-y-3">
              <textarea
                placeholder="Landmark..."
                id="LandMark"
                value={complaintDetails.IncidentDetail.LandMark}
                onChange={onIncidentHandler}
                className="p-3 rounded-xl resize-none shadow w-full"
              ></textarea>
              <div className="flex gap-x-8 flex-wrap">
                <div>
                  <span className="mr-4 text-[1rem] font-bold">District:</span>
                  <select
                    id="District"
                    onChange={onIncidentHandler}
                    value={complaintDetails.IncidentDetail.District}
                    className="px-2 py-1 shadow rounded-lg"
                  >
                    <option value="">Select Districts</option>
                    {townTree && Object.keys(townTree).length > 0 ? (
                      Object.keys(townTree).map((ele) => (
                        <option key={ele} value={ele}>
                          {ele}
                        </option>
                      ))
                    ) : (
                      <option value="">No districts available</option>
                    )}
                  </select>
                </div>
                <div>
                  <span className="text-[1rem] font-bold">Sub-District:</span>
                  <select
                    id="SubDistrict"
                    onChange={onIncidentHandler}
                    value={complaintDetails.IncidentDetail.SubDistrict}
                    className="px-2 py-1 shadow rounded-lg"
                  >
                    <option value="">Select Sub-Districts</option>
                    {townTree && 
                     complaintDetails.IncidentDetail.District &&
                     townTree[complaintDetails.IncidentDetail.District]?.length > 0 ? (
                      townTree[complaintDetails.IncidentDetail.District].map((ele, index) => (
                        <option key={index} value={ele}>{ele}</option>
                      ))
                    ) : (
                      <option value="">No sub-districts available</option>
                    )}
                  </select>
                </div>
              </div>
            </label>
          </div>
          <label className="mx-2 flex flex-col space-y-3">
            <div className="mr-4 text-[1rem] font-bold">
              Incident Description:
              <span className="text-red-500">*</span>
            </div>
            <textarea
              id="IncidentDescription"
              value={complaintDetails.IncidentDetail.IncidentDescription}
              onChange={onIncidentHandler}
              placeholder="Incident Description..."
              className="p-3 rounded-xl resize-none shadow w-full"
            ></textarea>
          </label>
        </div>

        <div className="border-gray-300 space-y-3 p-4 relative border-4 w-full flex flex-col rounded-2xl">
          <div className="absolute font-poppins font-bold bg-white px-2 text-xl -top-3 left-2">
            Victim Details
          </div>
          <div
            onClick={() => setAddPersonFlag("VictimArray")}
            className="flex gap-1 font-lato select-none hover:scale-105 transition-all duration-300 cursor-pointer text-bold w-fit px-2 py-1 rounded-md justify-center items-center"
          >
            <IoMdAdd className="text-2xl bg-green-500 rounded-full text-white p-1" />
            Victim
          </div>
          {complaintDetails.VictimArray.length > 0 && (
            <table className="table-auto select-none text-sm w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-2 py-1">Name</th>
                  <th className="border border-gray-300 px-2 py-1">Contact</th>
                  <th className="border border-gray-300 px-2 py-1">Address</th>
                  <th className="border border-gray-300 px-4 py-1 w-10">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {complaintDetails.VictimArray.map((ele, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-100 transition-all duration-200"
                  >
                    <td className="border text-center border-gray-300 px-2 py-1">
                      {ele.name || "N/A"}
                    </td>
                    <td className="border text-center border-gray-300 px-2 py-1">
                      {ele.contact || "N/A"}
                    </td>
                    <td className="border text-center border-gray-300 px-2 py-1">
                      {ele.address || "N/A"}
                    </td>
                    <td className="flex gap-3 text-2xl font-bold text-white text-center justify-center items-center px-2 py-1">
                      <LiaUserEditSolid
                        onClick={() => {
                          setPersonDetails(ele);
                          setAddPersonFlag("VictimArray");
                        }}
                        className="rounded-full bg-green-600 cursor-pointer hover:scale-105 transition-all duration-300 hover:bg-green-700 p-1"
                      />
                      <AiOutlineUserDelete
                        onClick={() => removeVictim(ele)}
                        className="rounded-full bg-red-500 cursor-pointer hover:scale-105 transition-all duration-300 hover:bg-red-700 p-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-gray-300 space-y-3 p-4 relative border-4 w-full flex flex-col rounded-2xl">
          <div className="absolute font-poppins font-bold bg-white px-2 text-xl -top-3 left-2">
            Accused Details
          </div>
          <div
            onClick={() => setAddPersonFlag("AccusedArray")}
            className="flex gap-1 font-lato select-none hover:scale-105 transition-all duration-300 cursor-pointer text-bold w-fit px-2 py-1 rounded-md justify-center items-center"
          >
            <IoMdAdd className="text-2xl bg-green-500 rounded-full text-white p-1" />
            Accused
          </div>
          {complaintDetails.AccusedArray.length > 0 && (
            <table className="table-auto select-none text-sm w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-2 py-1">Name</th>
                  <th className="border border-gray-300 px-2 py-1">Contact</th>
                  <th className="border border-gray-300 px-2 py-1">Address</th>
                  <th className="border border-gray-300 px-4 py-1 w-10">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {complaintDetails.AccusedArray.map((ele, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-100 transition-all duration-200"
                  >
                    <td className="border text-center border-gray-300 px-2 py-1">
                      {ele.name || "N/A"}
                    </td>
                    <td className="border text-center border-gray-300 px-2 py-1">
                      {ele.contact || "N/A"}
                    </td>
                    <td className="border text-center border-gray-300 px-2 py-1">
                      {ele.address || "N/A"}
                    </td>
                    <td className="flex gap-3 text-2xl font-bold text-white text-center justify-center items-center px-2 py-1">
                      <LiaUserEditSolid
                        onClick={() => {
                          setPersonDetails(ele);
                          setAddPersonFlag("AccusedArray");
                        }}
                        className="rounded-full bg-green-600 cursor-pointer hover:scale-105 transition-all duration-300 hover:bg-green-700 p-1"
                      />
                      <AiOutlineUserDelete
                        onClick={() => removeAccused(ele)}
                        className="rounded-full bg-red-500 cursor-pointer hover:scale-105 transition-all duration-300 hover:bg-red-700 p-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-gray-300 space-y-3 p-4 relative border-4 w-full flex flex-col rounded-2xl">
          <div className="absolute font-poppins font-bold bg-white px-2 text-xl -top-3 left-2">
            Witness Details
          </div>
          <div
            onClick={() => setAddPersonFlag("WitnessArray")}
            className="flex gap-1 font-lato select-none hover:scale-105 transition-all duration-300 cursor-pointer text-bold w-fit px-2 py-1 rounded-md justify-center items-center"
          >
            <IoMdAdd className="text-2xl bg-green-500 rounded-full text-white p-1" />
            Witness
          </div>
          {complaintDetails.WitnessArray.length > 0 && (
            <table className="table-auto select-none text-sm w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-2 py-1">Name</th>
                  <th className="border border-gray-300 px-2 py-1">Contact</th>
                  <th className="border border-gray-300 px-2 py-1">Address</th>
                  <th className="border border-gray-300 px-4 py-1 w-10">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {complaintDetails.WitnessArray.map((ele, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-100 transition-all duration-200"
                  >
                    <td className="border text-center border-gray-300 px-2 py-1">
                      {ele.name || "N/A"}
                    </td>
                    <td className="border text-center border-gray-300 px-2 py-1">
                      {ele.contact || "N/A"}
                    </td>
                    <td className="border text-center border-gray-300 px-2 py-1">
                      {ele.address || "N/A"}
                    </td>
                    <td className="flex gap-3 text-2xl font-bold text-white text-center justify-center items-center px-2 py-1">
                      <LiaUserEditSolid
                        onClick={() => {
                          setPersonDetails(ele);
                          setAddPersonFlag("WitnessArray");
                        }}
                        className="rounded-full bg-green-600 cursor-pointer hover:scale-105 transition-all duration-300 hover:bg-green-700 p-1"
                      />
                      <AiOutlineUserDelete
                        onClick={() => removeWitness(ele)}
                        className="rounded-full bg-red-500 cursor-pointer hover:scale-105 transition-all duration-300 hover:bg-red-700 p-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-gray-300 space-y-3 p-4 relative border-4 w-full flex flex-col rounded-2xl">
          <div className="absolute font-poppins font-bold bg-white px-2 text-xl -top-3 left-2">
            Evidences
          </div>
          <div className="relative">
            <input
              type="file"
              onChange={fileInsertHandler}
              id="evidence"
              multiple
              className="absolute -z-50 hidden"
            />
            <label
              htmlFor="evidence"
              className="flex gap-1 font-lato select-none hover:scale-105 transition-all duration-300 cursor-pointer text-bold w-fit px-2 py-1 rounded-md justify-center items-center"
            >
              <IoMdAdd className="text-2xl bg-green-500 rounded-full text-white p-1" />
              Evidence
            </label>
          </div>
          <div className="flex flex-col gap-1">
            {complaintDetails.evidences.map((ele, index) => (
              <div
                key={index}
                className="flex gap-2 items-center text-sm bg-slate-100 w-fit px-2 py-1 rounded-lg"
              >
                <div>{ele.name || "Unnamed file"}</div>
                <IoMdRemoveCircleOutline
                  onClick={() =>
                    setComplaintDetails((pre) => ({
                      ...pre,
                      evidences: pre.evidences.filter((obj) => obj !== ele),
                    }))
                  }
                  className="text-2xl bg-red-500 p-1 rounded-full text-white cursor-pointer hover:scale-105 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex cursor-pointer w-full select-none ml-10 text-md font-poppins gap-2 items-center">
          <input
            type="checkbox"
            checked={anonymous}
            id="anon"
            onChange={() => {
              if (currentUser) setAnonymous((pre) => !pre);
            }}
          />
          <label htmlFor="anon" className="font-semibold">
            File Complaint as Anonymously
          </label>
        </div>

        <div className="text-left w-full">
          {!currentUser && (
            <NavLink
              to="/login"
              className="text-sm font-semibold ml-2 text-blue-500 hover:underline text-center"
            >
              Login to file with your details
            </NavLink>
          )}
        </div>
      </div>

      {addPersonFlag && (
        <AddPeople
          addPersonFlag={addPersonFlag}
          personDetailsFromMainForm={personDetails}
          setPersonDetailsFromMainForm={setPersonDetails}
          setAddPersonFlag={setAddPersonFlag}
          setComplaintDetails={setComplaintDetails}
          complaintDetails={complaintDetails}
        />
      )}

      <div className="w-full justify-center items-center flex mt-4 gap-x-3">
        <button
          onClick={onSubmitHandler}
          disabled={isSubmitting}
          className={`font-bold font-poppins py-1 px-2 text-sm md:text-base 
          bg-green-500 hover:bg-green-700 text-white rounded-lg 
          ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 transition-all duration-500'}`}
        >
          {isSubmitting ? "Submitting..." : "Register Complaint"}
        </button>
      </div>
    </div>
  );
};

export default ComplaintForm;