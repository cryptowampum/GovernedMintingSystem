// API Key verification middleware (from SuperFantastic pattern)
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];

  if (process.env.NODE_ENV === 'development' && !process.env.API_SECRET) {
    return next();
  }

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  if (apiKey !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
};

module.exports = { verifyApiKey };
