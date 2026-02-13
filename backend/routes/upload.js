const express = require('express');
const { verifyApiKey } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { upload } = require('../middleware/upload');
const { uploadToPinata } = require('../lib/pinata');

const router = express.Router();

router.post('/', verifyApiKey, rateLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await uploadToPinata(req.file.buffer, req.file.originalname, req.file.mimetype);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Upload error:', error.message);
    if (error.response?.status === 401) {
      res.status(500).json({ error: 'Pinata authentication failed' });
    } else if (error.response?.status === 429) {
      res.status(429).json({ error: 'Pinata rate limit exceeded' });
    } else {
      res.status(500).json({
        error: 'Upload failed',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      });
    }
  }
});

module.exports = router;
