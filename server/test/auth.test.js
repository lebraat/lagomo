const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { User } = require('../models/User');

chai.use(chaiHttp);

describe('Authentication API', () => {
  // Test wallet
  const wallet = ethers.Wallet.createRandom();
  const walletAddress = wallet.address;

  beforeEach(async () => {
    // Clear users before each test
    await User.destroy({ where: {} });
  });

  describe('GET /api/auth/nonce', () => {
    it('should return a nonce for valid wallet address', async () => {
      const res = await chai
        .request(app)
        .get(`/api/auth/nonce?walletAddress=${walletAddress}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('nonce');
      expect(res.body).to.have.property('expiresAt');
      expect(res.body.nonce).to.be.a('string');
      expect(res.body.nonce).to.have.lengthOf(64); // 32 bytes in hex
    });

    it('should reject invalid wallet address', async () => {
      const res = await chai
        .request(app)
        .get('/api/auth/nonce?walletAddress=invalid');

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('error', 'Invalid wallet address');
    });

    it('should handle rate limiting', async () => {
      // Make 6 requests (rate limit is 5 per minute)
      const requests = Array(6).fill().map(() => 
        chai.request(app).get(`/api/auth/nonce?walletAddress=${walletAddress}`)
      );

      const responses = await Promise.all(requests);
      const lastResponse = responses[responses.length - 1];

      expect(lastResponse).to.have.status(429); // Too Many Requests
    });
  });

  describe('POST /api/auth/verify', () => {
    let nonce;

    beforeEach(async () => {
      // Get nonce first
      const nonceRes = await chai
        .request(app)
        .get(`/api/auth/nonce?walletAddress=${walletAddress}`);
      nonce = nonceRes.body.nonce;
    });

    it('should verify valid signature and return JWT', async () => {
      // Sign the message
      const message = `Sign this message to authenticate with Lagomo: ${nonce}`;
      const signature = await wallet.signMessage(message);

      const res = await chai
        .request(app)
        .post('/api/auth/verify')
        .send({
          walletAddress: walletAddress,
          signature: signature
        });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('walletAddress', walletAddress.toLowerCase());
      
      // Verify JWT
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded).to.have.property('wallet', walletAddress.toLowerCase());
    });

    it('should reject invalid signature', async () => {
      const res = await chai
        .request(app)
        .post('/api/auth/verify')
        .send({
          walletAddress: walletAddress,
          signature: '0x1234' // Invalid signature
        });

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('error', 'Invalid signature');
    });

    it('should reject if nonce has been used', async () => {
      // Sign and verify first time
      const message = `Sign this message to authenticate with Lagomo: ${nonce}`;
      const signature = await wallet.signMessage(message);

      await chai
        .request(app)
        .post('/api/auth/verify')
        .send({
          walletAddress: walletAddress,
          signature: signature
        });

      // Try to verify again with same signature
      const res = await chai
        .request(app)
        .post('/api/auth/verify')
        .send({
          walletAddress: walletAddress,
          signature: signature
        });

      expect(res).to.have.status(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let token;

    beforeEach(async () => {
      // Get authenticated first
      const nonceRes = await chai
        .request(app)
        .get(`/api/auth/nonce?walletAddress=${walletAddress}`);
      
      const message = `Sign this message to authenticate with Lagomo: ${nonceRes.body.nonce}`;
      const signature = await wallet.signMessage(message);

      const authRes = await chai
        .request(app)
        .post('/api/auth/verify')
        .send({
          walletAddress: walletAddress,
          signature: signature
        });

      token = authRes.body.token;
    });

    it('should refresh valid token', async () => {
      const res = await chai
        .request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('token');
      
      // Verify new JWT
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded).to.have.property('wallet', walletAddress.toLowerCase());
    });

    it('should reject invalid token', async () => {
      const res = await chai
        .request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('error', 'Invalid token');
    });

    it('should reject missing token', async () => {
      const res = await chai
        .request(app)
        .post('/api/auth/refresh');

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('error', 'No token provided');
    });
  });

  describe('Auth Middleware', () => {
    let token;
    const protectedRoute = '/api/protected';

    // Add a protected route for testing
    before(() => {
      const { authenticateToken } = require('../middleware/auth.middleware');
      app.get(protectedRoute, authenticateToken, (req, res) => {
        res.json({ message: 'Protected data', user: req.user });
      });
    });

    beforeEach(async () => {
      // Get authenticated first
      const nonceRes = await chai
        .request(app)
        .get(`/api/auth/nonce?walletAddress=${walletAddress}`);
      
      const message = `Sign this message to authenticate with Lagomo: ${nonceRes.body.nonce}`;
      const signature = await wallet.signMessage(message);

      const authRes = await chai
        .request(app)
        .post('/api/auth/verify')
        .send({
          walletAddress: walletAddress,
          signature: signature
        });

      token = authRes.body.token;
    });

    it('should allow access with valid token', async () => {
      const res = await chai
        .request(app)
        .get(protectedRoute)
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('message', 'Protected data');
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('walletAddress', walletAddress.toLowerCase());
    });

    it('should reject access with invalid token', async () => {
      const res = await chai
        .request(app)
        .get(protectedRoute)
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('error', 'Invalid token');
    });
  });
});
