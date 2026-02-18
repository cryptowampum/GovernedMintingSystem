// Thirdweb v5 is ESM-only; use dynamic import() from CommonJS

let _thirdweb = null;
let _chains = null;

async function loadThirdweb() {
  if (!_thirdweb) {
    _thirdweb = await import('thirdweb');
    _chains = await import('thirdweb/chains');
  }
  return { ..._thirdweb, chains: _chains };
}

async function mintNFT({ contractAddress, chainId, recipientAddress, imageIpfsUrl, comment, eventName }) {
  const {
    Engine,
    createThirdwebClient,
    getContract,
    prepareContractCall,
    sendTransaction,
    waitForReceipt,
    chains,
  } = await loadThirdweb();

  const chainMap = {
    137: chains.polygon,
    8453: chains.base,
    42161: chains.arbitrum,
  };
  const chain = chainMap[chainId];
  if (!chain) throw new Error(`Unsupported chainId: ${chainId}`);

  const client = createThirdwebClient({ secretKey: process.env.THIRDWEB_SECRET_KEY });

  const account = Engine.serverWallet({
    client,
    address: process.env.SERVER_WALLET_ADDRESS,
  });

  const contract = getContract({ client, chain, address: contractAddress.trim() });

  const transaction = prepareContractCall({
    contract,
    method:
      'function teamMint(address recipient, string customImage, string customText, string eventName, uint256 eventDate)',
    params: [
      recipientAddress,
      imageIpfsUrl,
      comment,
      eventName || 'Community Minting Platform',
      BigInt(Math.floor(Date.now() / 1000)),
    ],
  });

  // Engine server wallet enqueues tx and waits for hash internally
  const sendResult = await sendTransaction({ account, transaction });
  const { transactionHash } = sendResult;

  // Wait for on-chain receipt to extract tokenId
  const receipt = await waitForReceipt({ transactionHash, chain, client });

  let tokenId = null;
  // ERC-721 Transfer(address,address,uint256) topic
  const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  if (receipt.logs) {
    for (const log of receipt.logs) {
      try {
        if (log.topics[0] === transferTopic && log.topics.length === 4) {
          tokenId = BigInt(log.topics[3]).toString();
          break;
        }
      } catch {}
    }
  }

  return { txHash: transactionHash, tokenId };
}

module.exports = { mintNFT };
