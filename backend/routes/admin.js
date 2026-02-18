const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { generateChallenge, verifySignatureAndCreateSession, verifySession } = require('../middleware/adminAuth');
const { mintNFT } = require('../lib/mint');

const prisma = new PrismaClient();
const router = express.Router();

// --- Rate limiting for auth ---
const authAttempts = new Map();
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 10;

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of authAttempts.entries()) {
    if (now > entry.resetTime) authAttempts.delete(ip);
  }
}, 60000);

function authRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  if (!authAttempts.has(ip)) {
    authAttempts.set(ip, { count: 1, resetTime: now + AUTH_WINDOW_MS });
    return next();
  }
  const entry = authAttempts.get(ip);
  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + AUTH_WINDOW_MS;
    return next();
  }
  if (entry.count >= AUTH_MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many auth attempts. Try again later.' });
  }
  entry.count++;
  next();
}

// --- Input validation ---
const MAX_COMMENT_LENGTH = 2000;
const MAX_HANDLE_LENGTH = 100;
const MAX_NOTES_LENGTH = 5000;
const SUPPORTED_CHAINS = [137, 8453, 42161];
const isValidAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr);

// --- Auth ---

router.get('/auth/challenge', authRateLimit, (req, res) => {
  const challenge = generateChallenge();
  res.json(challenge);
});

router.post('/auth/verify', authRateLimit, express.json(), async (req, res) => {
  const { message, signature, address } = req.body;
  if (!message || !signature) {
    return res.status(400).json({ error: 'message and signature are required' });
  }

  const result = await verifySignatureAndCreateSession(message, signature, address);
  if (!result) {
    return res.status(403).json({ error: 'Not an authorized admin wallet' });
  }

  res.json({ success: true, token: result.token, address: result.address });
});

// All routes below require admin session
router.use(verifySession);

// --- Submissions ---

router.get('/submissions', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.submission.count({ where }),
    ]);

    res.json({ submissions, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('List submissions error:', error.message);
    res.status(500).json({ error: 'Failed to list submissions' });
  }
});

router.get('/submissions/:id', async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    // Include collection details for minted submissions
    if (submission.mintedToCollection) {
      const collection = await prisma.nftCollection.findFirst({
        where: { name: submission.mintedToCollection },
      });
      if (collection) {
        submission.contractAddress = collection.contractAddress;
        submission.chainId = collection.chainId;
      }
    }

    res.json(submission);
  } catch (error) {
    console.error('Get submission error:', error.message);
    res.status(500).json({ error: 'Failed to get submission' });
  }
});

router.patch('/submissions/:id', express.json(), async (req, res) => {
  try {
    const { comment, xHandle, instagramHandle, blueskyHandle, email, adminNotes } = req.body;

    // Input length validation
    if (comment !== undefined && comment.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ error: `Comment exceeds ${MAX_COMMENT_LENGTH} characters` });
    }
    if (adminNotes !== undefined && adminNotes.length > MAX_NOTES_LENGTH) {
      return res.status(400).json({ error: `Admin notes exceeds ${MAX_NOTES_LENGTH} characters` });
    }
    for (const [name, val] of Object.entries({ xHandle, instagramHandle, blueskyHandle })) {
      if (val !== undefined && val.length > MAX_HANDLE_LENGTH) {
        return res.status(400).json({ error: `${name} exceeds ${MAX_HANDLE_LENGTH} characters` });
      }
    }

    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: {
        ...(comment !== undefined && { comment }),
        ...(xHandle !== undefined && { xHandle }),
        ...(instagramHandle !== undefined && { instagramHandle }),
        ...(blueskyHandle !== undefined && { blueskyHandle }),
        ...(email !== undefined && { email }),
        ...(adminNotes !== undefined && { adminNotes }),
      },
    });
    res.json({ success: true, submission });
  } catch (error) {
    console.error('Update submission error:', error.message);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

router.post('/submissions/:id/approve', express.json(), async (req, res) => {
  try {
    const { collectionId } = req.body;
    if (!collectionId) return res.status(400).json({ error: 'collectionId is required' });

    const collection = await prisma.nftCollection.findUnique({ where: { id: collectionId } });
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: {
        status: 'approved',
        mintedToCollection: collection.name,
        reviewedBy: req.adminAddress,
        reviewedAt: new Date(),
      },
    });

    res.json({ success: true, submission });
  } catch (error) {
    console.error('Approve error:', error.message);
    res.status(500).json({ error: 'Failed to approve submission' });
  }
});

router.post('/submissions/:id/deny', express.json(), async (req, res) => {
  try {
    const { adminNotes } = req.body || {};
    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: {
        status: 'denied',
        adminNotes: adminNotes || null,
        reviewedBy: req.adminAddress,
        reviewedAt: new Date(),
      },
    });
    res.json({ success: true, submission });
  } catch (error) {
    console.error('Deny error:', error.message);
    res.status(500).json({ error: 'Failed to deny submission' });
  }
});

router.post('/submissions/:id/mint', express.json(), async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.status !== 'approved') return res.status(400).json({ error: 'Submission must be approved before minting' });
    if (submission.mintTxHash) return res.status(400).json({ error: 'Already minted' });

    // Find the collection to get contractAddress and chainId
    const collection = await prisma.nftCollection.findFirst({
      where: { name: submission.mintedToCollection, active: true },
    });
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    const result = await mintNFT({
      contractAddress: collection.contractAddress,
      chainId: collection.chainId,
      recipientAddress: submission.walletAddress,
      imageIpfsUrl: submission.photoIpfsUrl,
      comment: submission.comment,
      eventName: collection.name,
    });

    const updated = await prisma.submission.update({
      where: { id: req.params.id },
      data: { mintTxHash: result.txHash, tokenId: result.tokenId },
    });

    res.json({ success: true, txHash: result.txHash, tokenId: result.tokenId, contractAddress: collection.contractAddress, chainId: collection.chainId, submission: updated });
  } catch (error) {
    console.error('Mint error:', error.message);
    res.status(500).json({ error: 'Minting failed' });
  }
});

// --- Collections ---

router.get('/collections', async (req, res) => {
  try {
    const collections = await prisma.nftCollection.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(collections);
  } catch (error) {
    console.error('List collections error:', error.message);
    res.status(500).json({ error: 'Failed to list collections' });
  }
});

router.post('/collections', express.json(), async (req, res) => {
  try {
    const { name, contractAddress, chainId } = req.body;
    if (!name || !contractAddress) return res.status(400).json({ error: 'name and contractAddress are required' });
    if (!isValidAddress(contractAddress)) return res.status(400).json({ error: 'Invalid contract address format' });
    if (chainId && !SUPPORTED_CHAINS.includes(chainId)) {
      return res.status(400).json({ error: `Unsupported chain. Supported: ${SUPPORTED_CHAINS.join(', ')}` });
    }

    const collection = await prisma.nftCollection.create({
      data: { name, contractAddress, chainId: chainId || 137 },
    });
    res.json({ success: true, collection });
  } catch (error) {
    console.error('Create collection error:', error.message);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// --- Share URLs ---

const normalizeHandle = (h) => h ? `@${h.replace(/^@/, '')}` : '';

router.get('/submissions/:id/share-urls', async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (!submission.mintTxHash) return res.status(400).json({ error: 'Not yet minted' });

    const collection = await prisma.nftCollection.findFirst({ where: { name: submission.mintedToCollection } });
    const chainId = collection?.chainId || 137;

    const explorers = {
      137: `https://polygonscan.com/tx/${submission.mintTxHash}`,
      8453: `https://basescan.org/tx/${submission.mintTxHash}`,
      42161: `https://arbiscan.io/tx/${submission.mintTxHash}`,
    };
    const explorerUrl = explorers[chainId] || explorers[137];

    const openseaChains = { 137: 'matic', 8453: 'base', 42161: 'arbitrum' };
    const openseaChain = openseaChains[chainId] || 'matic';
    const openseaUrl =
      submission.tokenId && collection
        ? `https://opensea.io/assets/${openseaChain}/${collection.contractAddress}/${submission.tokenId}`
        : explorerUrl;

    const xHandle = normalizeHandle(submission.xHandle);
    const blueskyHandle = normalizeHandle(submission.blueskyHandle);
    const instagramHandle = normalizeHandle(submission.instagramHandle);

    const text = [
      submission.comment,
      xHandle ? `by ${xHandle}` : '',
      submission.photoGatewayUrl,
      openseaUrl,
    ]
      .filter(Boolean)
      .join('\n');

    const bskyText = [
      submission.comment,
      blueskyHandle ? `by ${blueskyHandle}` : '',
      submission.photoGatewayUrl,
      openseaUrl,
    ]
      .filter(Boolean)
      .join('\n');

    const instagramCaption = [
      submission.comment,
      instagramHandle || '',
      '#NFT',
      submission.photoGatewayUrl,
      openseaUrl,
    ]
      .filter(Boolean)
      .join('\n');

    res.json({
      x: { url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, text },
      bluesky: { url: `https://bsky.app/intent/compose?text=${encodeURIComponent(bskyText)}`, text: bskyText },
      instagram: { caption: instagramCaption },
      opensea: openseaUrl,
      explorer: explorerUrl,
    });
  } catch (error) {
    console.error('Share URLs error:', error.message);
    res.status(500).json({ error: 'Failed to generate share URLs' });
  }
});

router.post('/submissions/:id/record-share', express.json(), async (req, res) => {
  try {
    const { platform } = req.body;
    const fieldMap = { x: 'sharedToX', bluesky: 'sharedToBluesky', instagram: 'sharedToInstagram' };
    const field = fieldMap[platform];
    if (!field) return res.status(400).json({ error: 'Invalid platform. Use: x, bluesky, instagram' });

    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: { [field]: new Date() },
    });
    res.json({ success: true, submission });
  } catch (error) {
    console.error('Record share error:', error.message);
    res.status(500).json({ error: 'Failed to record share' });
  }
});

module.exports = router;
