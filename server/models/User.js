const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { encrypt, decrypt, hash } = require('../utils/encryption');

class User extends Model {
  // Encrypt sensitive data before saving
  async save(...args) {
    // Hash the wallet address for additional security
    if (this.walletAddress) {
      this.walletAddressHash = hash(this.walletAddress.toLowerCase());
    }

    // Encrypt the nonce
    if (this.nonce) {
      this.encryptedNonce = encrypt(this.nonce);
      this.nonce = undefined; // Don't store unencrypted nonce
    }

    return super.save(...args);
  }

  // Decrypt data when retrieving
  toJSON() {
    const values = super.toJSON();
    
    // Decrypt nonce if it exists
    if (values.encryptedNonce) {
      values.nonce = decrypt(values.encryptedNonce);
      delete values.encryptedNonce;
    }

    // Remove hash from public data
    delete values.walletAddressHash;
    
    return values;
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  walletAddress: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEthereumAddress(value) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
          throw new Error('Invalid Ethereum address');
        }
      }
    }
  },
  walletAddressHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  encryptedNonce: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  lastLoginIP: {
    type: DataTypes.STRING,
    allowNull: true
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['walletAddressHash']
    }
  ]
});

module.exports = { User };
