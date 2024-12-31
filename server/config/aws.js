const { SecretsManagerClient } = require("@aws-sdk/client-secrets-manager");
const awsMonitor = require("../utils/aws-monitor");

class AwsError extends Error {
  constructor(message, originalError, service, operation) {
    super(message);
    this.name = "AwsError";
    this.originalError = originalError;
    this.service = service;
    this.operation = operation;
    this.timestamp = new Date().toISOString();
  }
}

const getAwsConfig = () => ({
  region: process.env.AWS_REGION || "us-west-2",
  // In production, credentials are automatically loaded
  // In development, they come from aws-vault
});

// Create clients for AWS services with automatic retries
const secretsClient = new SecretsManagerClient({
  ...getAwsConfig(),
  maxAttempts: 3,
});

// Wrapper for AWS operations with error handling and monitoring
const withAwsErrorHandling = async (operation, service, operationName) => {
  try {
    return await operation();
  } catch (error) {
    // Log error details
    console.error(`AWS ${service} Error:`, {
      message: error.message,
      code: error.code,
      requestId: error.$metadata?.requestId,
      timestamp: new Date().toISOString(),
      operation: operationName,
    });
    
    // Track error in CloudWatch
    await awsMonitor.trackError(error, service, operationName);
    
    throw new AwsError(
      `AWS ${service} operation failed: ${error.message}`,
      error,
      service,
      operationName
    );
  }
};

// Example usage with error handling
const getSecret = async (secretName) => {
  return withAwsErrorHandling(
    async () => {
      const response = await secretsClient.getSecretValue({ SecretId: secretName });
      return response.SecretString;
    },
    "SecretsManager",
    "getSecretValue"
  );
};

// Graceful shutdown handler
const shutdown = async () => {
  await awsMonitor.shutdown();
};

module.exports = {
  secretsClient,
  getAwsConfig,
  withAwsErrorHandling,
  getSecret,
  AwsError,
  shutdown,
};
