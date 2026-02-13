const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { generateChallenge, verifySignatureAndCreateSession, verifySession } = require('../middleware/adminAuth');
const { mintNFT } = require('../lib/mint');

const prisma = new PrismaClient();
const router = express.Router();

// --- Auth ---

router.get('/auth/challenge', (req, res) => {
  const challenge = generateChallenge();
  res.json(challenge);
});

router.post('/auth/verify', express.json(), (req, res) => {
  const { message, signature } = req.body;
  if (!message || !signature) {
    return res.status(400).json({ error: 'message and signature are required' });
  }

  const result = verifySignatureAndCreateSession(message, signature);
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
    res.json(submission);
  } catch (error) {
    console.error('Get submission error:', error.message);
    res.status(500).json({ error: 'Failed to get submission' });
  }
});

router.patch('/submissions/:id', express.json(), async (req, res) => {
  try {
    const { comment, xHandle, instagramHandle, blueskyHandle, email, adminNotes } = req.body;
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
    });

    const updated = await prisma.submission.update({
      where: { id: req.params.id },
      data: { mintTxHash: result.txHash, tokenId: result.tokenId },
    });

    res.json({ success: true, txHash: result.txHash, tokenId: result.tokenId, submission: updated });
  } catch (error) {
    console.error('Mint error:', error.message);
    res.status(500).json({ error: 'Minting failed', message: process.env.NODE_ENV === 'development' ? error.message : undefined });
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

router.get('/submissions/:id/share-urls', async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (!submission.mintTxHash) return res.status(400).json({ error: 'Not yet minted' });

    const collection = await prisma.nftCollection.findFirst({ where: { name: submission.mintedToCollection } });
    const chainId = collection?.chainId || 137;

    const explorerUrl =
      chainId === 137
        ? `https://polygonscan.com/tx/${submission.mintTxHash}`
        : `https://basescan.org/tx/${submission.mintTxHash}`;

    const openseaUrl =
      submission.tokenId && collection
        ? chainId === 137
          ? `https://opensea.io/assets/matic/${collection.contractAddress}/${submission.tokenId}`
          : `https://opensea.io/assets/base/${collection.contractAddress}/${submission.tokenId}`
        : explorerUrl;

    const text = [
      submission.comment,
      submission.xHandle ? `by @${submission.xHandle}` : '',
      openseaUrl,
    ]
      .filter(Boolean)
      .join('\n');

    const bskyText = [
      submission.comment,
      submission.blueskyHandle ? `by @${submission.blueskyHandle}` : '',
      openseaUrl,
    ]
      .filter(Boolean)
      .join('\n');

    const instagramCaption = [
      submission.comment,
      submission.instagramHandle ? `@${submission.instagramHandle}` : '',
      '#NFT',
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

module.exports = router;
