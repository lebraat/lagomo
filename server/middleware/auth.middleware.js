const jwt = require("jsonwebtoken");
const { User } = require("../models/User");

/**
 * Middleware to authenticate JWT tokens
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
exports.authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.sub);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    next(error);
  }
};

/**
 * Middleware to validate wallet ownership
 * Ensures the authenticated user owns the wallet address in the request
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
exports.validateWalletOwnership = (req, res, next) => {
  const walletAddress = req.params.walletAddress || req.body.walletAddress;
  
  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required" });
  }

  if (req.user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    return res.status(403).json({ error: "Not authorized for this wallet" });
  }

  next();
};
