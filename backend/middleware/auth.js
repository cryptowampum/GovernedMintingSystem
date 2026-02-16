const crypto = require('crypto');

const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!process.env.API_SECRET) {
    console.error('API_SECRET not configured');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // Timing-safe comparison to prevent timing attacks
  const expected = Buffer.from(process.env.API_SECRET);
  const provided = Buffer.from(apiKey);
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
};

module.exports = { verifyApiKey };
