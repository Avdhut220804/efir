
import { create } from 'kubo-rpc-client';

const ipfs = create({ host: 'localhost', port: 5001, protocol: 'http' });

export const uploadToIPFS = async (data) => {
  try {
    const jsonData = JSON.stringify(data);
    const { cid } = await ipfs.add(jsonData);
    console.log('IPFS Hash:', cid.toString());
    return cid.toString();
  } catch (err) {
    console.error('Error uploading to IPFS:', err);
    throw err;
  }
};
