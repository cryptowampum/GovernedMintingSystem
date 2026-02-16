const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyApiKey } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { upload } = require('../middleware/upload');
const { uploadToPinata } = require('../lib/pinata');

const prisma = new PrismaClient();
const router = express.Router();

// Create a new submission (user-facing)
router.post('/', verifyApiKey, rateLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { comment, xHandle, instagramHandle, blueskyHandle, email, walletAddress } = req.body;

    if (!comment || !walletAddress) {
      return res.status(400).json({ error: 'comment and walletAddress are required' });
    }
    if (comment.length > 2000) {
      return res.status(400).json({ error: 'Comment exceeds 2000 characters' });
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    for (const handle of [xHandle, instagramHandle, blueskyHandle].filter(Boolean)) {
      if (handle.length > 100) {
        return res.status(400).json({ error: 'Handle exceeds 100 characters' });
      }
    }

    // Upload image to IPFS
    const ipfs = await uploadToPinata(req.file.buffer, req.file.originalname, req.file.mimetype);

    // Create submission record
    const submission = await prisma.submission.create({
      data: {
        photoIpfsUrl: ipfs.ipfsUrl,
        photoGatewayUrl: ipfs.gatewayUrl,
        comment,
        xHandle: xHandle || null,
        instagramHandle: instagramHandle || null,
        blueskyHandle: blueskyHandle || null,
        email: email || null,
        walletAddress,
      },
    });

    res.json({
      success: true,
      submission: { id: submission.id, status: submission.status, createdAt: submission.createdAt },
    });
  } catch (error) {
    console.error('Submission error:', error.message);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

module.exports = router;
