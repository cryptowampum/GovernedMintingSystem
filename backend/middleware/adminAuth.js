const { ethers } = require('ethers');
const crypto = require('crypto');

const ADMIN_WALLETS = (process.env.ADMIN_WALLETS || '')
  .split(',')
  .map(a => a.trim().toLowerCase())
  .filter(Boolean);

const sessions = new Map();
const challenges = new Map();

// Clean expired sessions/challenges every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.createdAt > 24 * 60 * 60 * 1000) sessions.delete(token);
  }
  for (const [nonce, challenge] of challenges.entries()) {
    if (now - challenge.createdAt > 5 * 60 * 1000) challenges.delete(nonce);
  }
}, 5 * 60 * 1000);

function generateChallenge() {
  const nonce = crypto.randomBytes(16).toString('hex');
  const message = `Sign this message to authenticate as admin.\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
  challenges.set(nonce, { message, createdAt: Date.now() });
  return { nonce, message };
}

function verifySignatureAndCreateSession(message, signature) {
  try {
    const recovered = ethers.verifyMessage(message, signature).toLowerCase();
    if (!ADMIN_WALLETS.includes(recovered)) return null;

    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { address: recovered, createdAt: Date.now() });
    return { token, address: recovered };
  } catch {
    return null;
  }
}

function verifySession(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const session = sessions.get(token);
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }

  req.adminAddress = session.address;
  next();
}

module.exports = { generateChallenge, verifySignatureAndCreateSession, verifySession, ADMIN_WALLETS };
