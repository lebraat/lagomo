const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const rateLimit = require('express-rate-limit');

// Rate limiting middleware
const nonceLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5
});

const verifyLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 3
});

const refreshLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});

// Auth routes
router.get('/nonce', nonceLimit, authController.getNonce);
router.post('/verify', verifyLimit, authController.verifySignature);
router.post('/refresh', refreshLimit, authController.refreshToken);

module.exports = router;
