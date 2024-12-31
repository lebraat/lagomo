const { 
  SecretsManagerClient, 
  GetSecretValueCommand 
} = require("@aws-sdk/client-secrets-manager");

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const secretsCache = new Map();

/**
 * Get a secret from AWS Secrets Manager with caching
 * @param {string} secretName - The name/path of the secret
 * @returns {Promise<object>} The secret value
 */
const getSecret = async (secretName) => {
  const now = Date.now();
  const cached = secretsCache.get(secretName);

  // Return cached value if still valid
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION
  });

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );

    const value = JSON.parse(response.SecretString);
    
    // Cache the result
    secretsCache.set(secretName, {
      value,
      timestamp: now
    });

    return value;
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error);
    
    // If we have a cached value, return it as fallback
    if (cached) {
      console.warn(`Using cached value for ${secretName} due to error`);
      return cached.value;
    }
    
    throw error;
  }
};

/**
 * Initialize all required secrets for the application
 * @returns {Promise<object>} Object containing all necessary secrets
 */
const initializeSecrets = async () => {
  const environment = process.env.NODE_ENV || 'development';
  const basePath = `/lagomo/${environment}`;

  try {
    const [dbCreds, jwtSecret, smtpCreds, web3Creds] = await Promise.all([
      getSecret(`${basePath}/database/credentials`),
      getSecret(`${basePath}/jwt/secret`),
      getSecret(`${basePath}/smtp/credentials`),
      getSecret(`${basePath}/web3/credentials`)
    ]);

    return {
      database: {
        url: `postgresql://${dbCreds.username}:${dbCreds.password}@${dbCreds.host}:${dbCreds.port}/${dbCreds.dbname}`,
        ...dbCreds
      },
      jwt: {
        secret: jwtSecret.secret,
        expiresIn: jwtSecret.expiresIn || '24h'
      },
      smtp: {
        host: smtpCreds.host,
        port: smtpCreds.port,
        auth: {
          user: smtpCreds.username,
          pass: smtpCreds.password
        }
      },
      web3: {
        walletconnectProjectId: web3Creds.walletconnectProjectId,
        infuraProjectId: web3Creds.infuraProjectId
      }
    };
  } catch (error) {
    console.error('Error initializing secrets:', error);
    throw error;
  }
};

/**
 * Clear the secrets cache
 */
const clearSecretsCache = () => {
  secretsCache.clear();
};

module.exports = {
  getSecret,
  initializeSecrets,
  clearSecretsCache
};
