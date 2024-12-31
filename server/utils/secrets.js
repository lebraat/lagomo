const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
require("dotenv").config();

class SecretsManager {
  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    console.log("SecretsManager initialized with region:", process.env.AWS_REGION || "us-east-1");
  }

  async getSecret(secretName) {
    console.log("Attempting to retrieve secret:", secretName);
    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && cached.timestamp > Date.now() - this.cacheDuration) {
      console.log("Returning cached secret");
      return cached.value;
    }

    try {
      console.log("Fetching secret from AWS");
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await this.client.send(command);
      const secrets = JSON.parse(response.SecretString);
      console.log("Successfully retrieved secret from AWS");

      // Cache the result
      this.cache.set(secretName, {
        value: secrets,
        timestamp: Date.now(),
      });

      return secrets;
    } catch (error) {
      console.error(`Error retrieving secret ${secretName}:`, error);
      // Fallback to environment variables in development
      if (process.env.NODE_ENV === "development") {
        console.log("Falling back to environment variables");
        return this.getEnvironmentVariables();
      }
      throw error;
    }
  }

  getEnvironmentVariables() {
    return {
      JWT_SECRET: process.env.JWT_SECRET,
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID,
      INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
      SMTP_USERNAME: process.env.SMTP_USERNAME,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    };
  }
}

const secretsManager = new SecretsManager();

module.exports = secretsManager;
