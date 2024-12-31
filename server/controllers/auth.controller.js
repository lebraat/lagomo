const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { User } = require('../models/User');
const crypto = require('crypto');
const secretsManager = require('../utils/secrets');

/**
 * Generate a random nonce for wallet signature
 * @param {number} length Length of the nonce
 * @returns {string} Random nonce
 */
const generateNonce = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Get client IP address from request
 * @param {Object} req Express request object
 * @returns {string} IP address
 */
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.connection.socket.remoteAddress;
};

async function getJWTSecret() {
  try {
    const secret = await secretsManager.getSecret('/lagomo/development/secrets');
    return secret.JWT_SECRET;
  } catch (error) {
    console.error('Error fetching JWT secret, falling back to .env:', error);
    return process.env.JWT_SECRET;
  }
}

/**
 * Get a nonce for wallet signature
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.getNonce = async (req, res) => {
  try {
    const { walletAddress } = req.query;
    const clientIP = getClientIP(req);

    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Check if user is locked out
    const existingUser = await User.findOne({ 
      where: { walletAddress: walletAddress.toLowerCase() } 
    });

    if (existingUser && existingUser.lockedUntil && existingUser.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil((existingUser.lockedUntil - new Date()) / 1000 / 60);
      return res.status(429).json({ 
        error: `Too many failed attempts. Please try again in ${waitMinutes} minutes.`
      });
    }

    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await User.upsert({
      walletAddress: walletAddress.toLowerCase(),
      nonce,
      lastLoginIP: clientIP,
      failedLoginAttempts: 0, // Reset failed attempts on new nonce request
      lockedUntil: null
    });

    res.json({ nonce, expiresAt });
  } catch (error) {
    console.error('Error in getNonce:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Verify wallet signature and issue JWT
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.verifySignature = async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;
    const clientIP = getClientIP(req);

    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const user = await User.findOne({ 
      where: { walletAddress: walletAddress.toLowerCase() } 
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user is locked out
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockedUntil - new Date()) / 1000 / 60);
      return res.status(429).json({ 
        error: `Too many failed attempts. Please try again in ${waitMinutes} minutes.`
      });
    }

    // Verify the signature
    const message = `Sign this message to authenticate with Lagomo: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      // Increment failed attempts
      user.failedLoginAttempts += 1;

      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
        await user.save();
        return res.status(429).json({ 
          error: 'Too many failed attempts. Account locked for 15 minutes.' 
        });
      }

      await user.save();
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Update user's nonce and last login
    user.nonce = generateNonce();
    user.lastLogin = new Date();
    user.lastLoginIP = clientIP;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    // Generate JWT
    const secret = await getJWTSecret();
    const token = jwt.sign(
      { 
        sub: user.id,
        wallet: user.walletAddress
      },
      secret,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Error in verifySignature:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Refresh JWT token
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const secret = await getJWTSecret();
    const decoded = jwt.verify(token, secret);

    const user = await User.findByPk(decoded.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new token
    const newToken = jwt.sign(
      { 
        sub: user.id,
        wallet: user.walletAddress
      },
      secret,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );

    res.json({ token: newToken });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Error in refreshToken:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
