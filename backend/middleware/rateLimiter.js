const rateLimitMap = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10;

// Clean up periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) rateLimitMap.delete(ip);
  }
}, 60000);

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  const limit = rateLimitMap.get(ip);

  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + WINDOW_MS;
    return next();
  }

  if (limit.count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Max ${MAX_REQUESTS} uploads per ${WINDOW_MS / 60000} minutes`,
      retryAfter: Math.ceil((limit.resetTime - now) / 1000),
    });
  }

  limit.count++;
  next();
};

module.exports = { rateLimiter };
