const { ethers } = require('ethers');

const TEAM_MINT_ABI = [
  'function teamMint(address recipient, string customImage, string customText, string eventName, uint256 eventDate) external',
];

async function mintNFT({ contractAddress, chainId, recipientAddress, imageIpfsUrl, comment }) {
  const rpcUrl =
    chainId === 137
      ? process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com/'
      : process.env.BASE_RPC_URL || 'https://base.llamarpc.com';

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(process.env.MINTER_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(contractAddress, TEAM_MINT_ABI, wallet);

  const timestamp = Math.floor(Date.now() / 1000);
  const tx = await contract.teamMint(
    recipientAddress,
    imageIpfsUrl,
    comment,
    'GovernedMint',
    timestamp
  );

  const receipt = await tx.wait();

  let tokenId = null;
  const transferTopic = ethers.id('Transfer(address,address,uint256)');
  for (const log of receipt.logs) {
    try {
      if (log.topics[0] === transferTopic && log.topics.length === 4) {
        tokenId = BigInt(log.topics[3]).toString();
        break;
      }
    } catch {}
  }

  return { txHash: receipt.hash, tokenId };
}

module.exports = { mintNFT };
