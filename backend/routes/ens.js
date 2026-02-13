const express = require('express');
const { ethers } = require('ethers');
const axios = require('axios');

const router = express.Router();

router.get('/resolve/:name', async (req, res) => {
  try {
    const { name } = req.params;

    // Try ENS Metadata Service first
    try {
      const metaRes = await axios.get(`https://metadata.ens.domains/mainnet/name/${encodeURIComponent(name)}`, {
        timeout: 5000,
      });
      if (metaRes.data?.addresses?.['60']) {
        return res.json({ success: true, name, address: metaRes.data.addresses['60'], resolver: 'ens-metadata' });
      }
    } catch {}

    // Fallback to RPC providers
    const rpcUrls = [
      'https://cloudflare-eth.com',
      'https://rpc.ankr.com/eth',
      'https://eth.llamarpc.com',
      'https://ethereum.publicnode.com',
    ];

    for (const rpcUrl of rpcUrls) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const address = await Promise.race([
          provider.resolveName(name),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
        if (address) {
          return res.json({ success: true, name, address, resolver: rpcUrl.split('//')[1].split('/')[0] });
        }
      } catch {}
    }

    res.status(404).json({ success: false, error: `Could not resolve ${name}` });
  } catch (error) {
    console.error('ENS resolution error:', error.message);
    res.status(500).json({ success: false, error: 'ENS resolution failed' });
  }
});

module.exports = router;
