const secretsManager = require('../utils/secrets');

class Config {
  constructor() {
    this.initialized = false;
    this.secrets = {};
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Load secrets based on environment
      const secretName = `/lagomo/${process.env.NODE_ENV || 'development'}/secrets`;
      this.secrets = await secretsManager.getSecret(secretName);
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing config:', error);
      // In development, we can fall back to environment variables
      if (process.env.NODE_ENV === 'development') {
        this.secrets = secretsManager.getEnvironmentVariables();
        this.initialized = true;
      } else {
        throw error;
      }
    }
  }

  async getConfig() {
    if (!this.initialized) {
      await this.initialize();
    }
    return {
      database: {
        url: this.secrets.DATABASE_URL,
      },
      jwt: {
        secret: this.secrets.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION || '24h',
      },
      encryption: {
        key: this.secrets.ENCRYPTION_KEY,
      },
      web3: {
        walletconnectProjectId: this.secrets.WALLETCONNECT_PROJECT_ID,
        infuraProjectId: this.secrets.INFURA_PROJECT_ID,
      },
      smtp: {
        username: this.secrets.SMTP_USERNAME,
        password: this.secrets.SMTP_PASSWORD,
        server: process.env.SMTP_SERVER,
        port: process.env.SMTP_PORT,
        notificationEmail: process.env.NOTIFICATION_EMAIL,
      },
      server: {
        port: process.env.PORT || 3002,
        apiBaseUrl: process.env.API_BASE_URL,
      },
    };
  }
}

module.exports = new Config();
