# AWS Secrets Management

## Overview

Lagomo uses AWS Secrets Manager for secure storage of sensitive credentials and configuration. This provides:
- Automatic key rotation
- Fine-grained access control
- Audit trails
- Encryption at rest and in transit

## AWS Services Used

1. **AWS Secrets Manager**
   - Store sensitive credentials
   - Automatic rotation
   - Encryption by default

2. **AWS Parameter Store**
   - Non-sensitive configuration
   - Environment-specific settings
   - Hierarchical organization

3. **AWS IAM**
   - Role-based access control
   - Principle of least privilege
   - Service-linked roles

## Secret Structure

```
/lagomo/
├── production/
│   ├── database/
│   │   ├── credentials
│   │   └── connection
│   ├── jwt/
│   │   └── secret
│   ├── web3/
│   │   ├── walletconnect
│   │   └── infura
│   └── smtp/
│       ├── credentials
│       └── config
├── staging/
│   └── [similar structure]
└── development/
    └── [similar structure]
```

## Setup Instructions

### 1. Initial AWS Setup

```bash
# Install AWS CLI
brew install awscli

# Configure AWS CLI
aws configure
```

### 2. Create Required IAM Roles

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "Resource": [
                "arn:aws:secretsmanager:region:account:secret:/lagomo/*"
            ]
        }
    ]
}
```

### 3. Store Secrets

```bash
# Store a new secret
aws secretsmanager create-secret \
    --name "/lagomo/production/database/credentials" \
    --description "Production database credentials" \
    --secret-string '{"username":"prod_user","password":"prod_pass"}'

# Enable automatic rotation
aws secretsmanager rotate-secret \
    --secret-id "/lagomo/production/database/credentials" \
    --rotation-lambda-arn "arn:aws:lambda:region:account:function:rotation-function"
```

## Application Integration

### 1. Install AWS SDK
```bash
npm install @aws-sdk/client-secrets-manager
```

### 2. Secret Retrieval Code
```javascript
const { 
  SecretsManagerClient, 
  GetSecretValueCommand 
} = require("@aws-sdk/client-secrets-manager");

const getSecret = async (secretName) => {
  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION
  });

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );
    return JSON.parse(response.SecretString);
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error);
    throw error;
  }
};
```

## Environment Variables

Instead of storing sensitive data, store only AWS configuration:

```bash
# AWS Configuration
AWS_REGION=us-west-2
AWS_PROFILE=lagomo

# Secret Paths
DATABASE_SECRET_PATH=/lagomo/production/database/credentials
JWT_SECRET_PATH=/lagomo/production/jwt/secret
SMTP_SECRET_PATH=/lagomo/production/smtp/credentials
```

## Security Best Practices

1. **Access Control**
   - Use IAM roles instead of access keys
   - Implement least privilege access
   - Regular access review

2. **Secret Rotation**
   - Enable automatic rotation
   - Different rotation schedules per secret type
   - Monitor rotation events

3. **Monitoring**
   - Enable CloudTrail logging
   - Set up alerts for secret access
   - Monitor failed access attempts

4. **Development Practice**
   - Never commit AWS credentials
   - Use different secrets per environment
   - Regular security audits

## Local Development

For local development, use a combination of:

1. **Local .env file**
   ```bash
   # Use local values for development
   DATABASE_URL=postgresql://localhost:5432/lagomo
   JWT_SECRET=local-development-secret
   ```

2. **AWS Profile**
   ```bash
   # ~/.aws/credentials
   [lagomo-dev]
   aws_access_key_id = YOUR_ACCESS_KEY
   aws_secret_access_key = YOUR_SECRET_KEY
   region = us-west-2
   ```

## CI/CD Integration

1. **GitHub Actions**
   ```yaml
   env:
     AWS_REGION: us-west-2
   
   steps:
     - uses: aws-actions/configure-aws-credentials@v1
       with:
         role-to-assume: arn:aws:iam::123456789012:role/lagomo-github-actions
         aws-region: ${{ env.AWS_REGION }}
   ```

2. **AWS Role for CI/CD**
   - Create dedicated IAM role
   - Limited to required secrets
   - Audit access regularly

## Emergency Procedures

1. **Secret Compromise**
   ```bash
   # Immediately rotate compromised secret
   aws secretsmanager rotate-secret \
       --secret-id "compromised-secret-name" \
       --force-rotation
   ```

2. **Access Revocation**
   ```bash
   # Revoke IAM role access
   aws iam delete-role-policy \
       --role-name compromised-role \
       --policy-name secrets-access
   ```

## Monitoring and Alerts

1. **CloudWatch Alarms**
   - Failed secret rotations
   - Excessive secret access
   - Failed access attempts

2. **AWS EventBridge Rules**
   - Secret rotation events
   - Access pattern changes
   - Configuration changes
