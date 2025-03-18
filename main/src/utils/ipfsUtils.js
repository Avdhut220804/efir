
import axios from 'axios';

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.REACT_APP_PINATA_SECRET_API_KEY;

export const uploadToIPFS = async (data) => {
  try {
    const jsonData = JSON.stringify(data);
    
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        pinataContent: jsonData,
        pinataMetadata: { name: "ComplaintData" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      }
    );

    const ipfsHash = response.data.IpfsHash;
    console.log('Pinata IPFS Hash:', ipfsHash);
    return ipfsHash;
  } catch (err) {
    console.error('Error uploading to Pinata IPFS:', err);
    throw err;
  }
};
