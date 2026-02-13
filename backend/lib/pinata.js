const axios = require('axios');
const FormData = require('form-data');

async function uploadToPinata(fileBuffer, filename, mimetype) {
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
    throw new Error('Pinata credentials not configured');
  }

  const formData = new FormData();
  formData.append('file', fileBuffer, { filename, contentType: mimetype });
  formData.append(
    'pinataMetadata',
    JSON.stringify({
      name: filename,
      keyvalues: { uploadedAt: new Date().toISOString(), type: 'governed-mint' },
    })
  );

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
      },
      timeout: 30000,
    }
  );

  const ipfsHash = response.data.IpfsHash;
  return {
    ipfsHash,
    ipfsUrl: `ipfs://${ipfsHash}`,
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    size: response.data.PinSize,
  };
}

module.exports = { uploadToPinata };
