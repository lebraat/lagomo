# AWS Setup Guide

## 1. Create AWS Account

1. Go to [AWS Console](https://aws.amazon.com/)
2. Click "Create an AWS Account"
3. Follow the registration process
4. Enable MFA for root account

## 2. Set Up IAM Roles and Users

### Create Admin IAM User
1. Go to IAM Console
2. Click "Users" → "Add user"
3. Username: `lagomo-admin`
4. Select "AWS Management Console access"
5. Attach policy: "AdministratorAccess"
6. Enable MFA for this user

### Create Application Role
1. Go to IAM Console
2. Click "Roles" → "Create role"
3. Select "AWS service" as the trusted entity type
4. Under "Use case", choose "EC2" (select the basic EC2 option)
5. Click "Next"
6. At "Step 2: Add permissions", click "Next" without selecting any policies
7. At "Step 3: Name, review, and create":
   - Role name: `lagomo-app-role`
   - Description: "Role for Lagomo application to access Secrets Manager"
   - Expand "Step 1: Select trusted entities"
   - Click "Edit" (or "Customize trust policy")
   - Replace the policy with:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```
8. Click "Next" and then "Create role"

9. After the role is created:
   - Find `lagomo-app-role` in the roles list
   - Click on the role name
   - Go to the "Permissions" tab
   - Click "Add permissions" → "Create inline policy"
   - Click the "JSON" tab
   - Paste this permissions policy:
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
                "arn:aws:secretsmanager:*:*:secret:/lagomo/*"
            ]
        }
    ]
}
```
   - Click "Review policy"
   - Name it `lagomo-secrets-policy`
   - Click "Create policy"

## 3. Set Up Secrets Manager

### Create Secrets Structure

1. Go to AWS Secrets Manager Console
2. Click "Store a new secret"
3. Create the following secrets:

#### Database Credentials
```bash
aws secretsmanager create-secret \
    --name "/lagomo/production/database/credentials" \
    --description "Production database credentials" \
    --secret-string '{
        "username": "prod_user",
        "password": "your_secure_password",
        "host": "your-db-host",
        "port": "5432",
        "dbname": "lagomo"
    }'
```

#### JWT Secret
```bash
aws secretsmanager create-secret \
    --name "/lagomo/production/jwt/secret" \
    --description "JWT signing secret" \
    --secret-string '{
        "secret": "your_jwt_secret",
        "expiresIn": "24h"
    }'
```

#### SMTP Credentials
```bash
aws secretsmanager create-secret \
    --name "/lagomo/production/smtp/credentials" \
    --description "SMTP server credentials" \
    --secret-string '{
        "host": "smtp.gmail.com",
        "port": "587",
        "username": "your-email@gmail.com",
        "password": "your-app-specific-password"
    }'
```

#### Web3 Credentials
```bash
aws secretsmanager create-secret \
    --name "/lagomo/production/web3/credentials" \
    --description "Web3 API credentials" \
    --secret-string '{
        "walletconnectProjectId": "your_project_id",
        "infuraProjectId": "your_infura_id"
    }'
```

## 4. Set Up Automatic Rotation

### For Database Credentials

1. Go to the secret in AWS Secrets Manager
2. Click "Edit rotation"
3. Choose "Schedule automatic rotation"
4. Set rotation interval (e.g., 30 days)
5. Create and attach rotation function:

```bash
# Create rotation Lambda function
aws secretsmanager create-secret \
    --name "/lagomo/production/database/credentials" \
    --rotation-lambda-arn "arn:aws:lambda:region:account:function:rotation-function" \
    --rotation-rules "{\"AutomaticallyAfterDays\": 30}"
```

### For API Keys

1. Select the secret (e.g., Web3 credentials)
2. Enable rotation
3. Set rotation schedule (e.g., 90 days)
4. Configure rotation function:

```bash
aws secretsmanager rotate-secret \
    --secret-id "/lagomo/production/web3/credentials" \
    --rotation-lambda-arn "arn:aws:lambda:region:account:function:api-key-rotation" \
    --rotation-rules "{\"AutomaticallyAfterDays\": 90}"
```

## 5. Set Up GitHub Actions Integration

1. Create GitHub Actions Role:
```bash
aws iam create-role \
    --role-name lagomo-github-actions \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Federated": "arn:aws:iam::account:oidc-provider/token.actions.githubusercontent.com"
                },
                "Action": "sts:AssumeRoleWithWebIdentity",
                "Condition": {
                    "StringLike": {
                        "token.actions.githubusercontent.com:sub": "repo:your-org/lagomo:*"
                    }
                }
            }
        ]
    }'
```

2. Add GitHub Actions Secrets:
   - Go to repository Settings
   - Secrets and variables → Actions
   - Add:
     - `AWS_ROLE_ARN`
     - `AWS_REGION`

## 6. Testing the Setup

### Test Secret Access
```bash
# Using AWS CLI
aws secretsmanager get-secret-value \
    --secret-id "/lagomo/production/database/credentials"

# Using Node.js
node -e "
const { getSecret } = require('./server/config/secrets');
getSecret('/lagomo/production/database/credentials')
  .then(console.log)
  .catch(console.error);
"
```

### Test Rotation
```bash
# Manual rotation test
aws secretsmanager rotate-secret \
    --secret-id "/lagomo/production/database/credentials"
```

## 7. Monitoring Setup

1. Create CloudWatch Alarms:
```bash
aws cloudwatch put-metric-alarm \
    --alarm-name "SecretRotationFailed" \
    --metric-name "RotationFailed" \
    --namespace "AWS/SecretsManager" \
    --statistic "Sum" \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator "GreaterThanThreshold" \
    --alarm-actions "arn:aws:sns:region:account:notification-topic"
```

2. Set up CloudTrail logging:
```bash
aws cloudtrail create-trail \
    --name lagomo-secrets-trail \
    --s3-bucket-name your-bucket \
    --is-multi-region-trail \
    --include-global-service-events
```

## Security Best Practices

1. **Access Management**
   - Use separate roles for different environments
   - Implement least privilege access
   - Regular access review

2. **Rotation Policies**
   - Database credentials: 30 days
   - API keys: 90 days
   - JWT secrets: 180 days

3. **Monitoring**
   - Enable CloudTrail logging
   - Set up alerts for failed rotations
   - Monitor access patterns

4. **Emergency Procedures**
   - Document emergency rotation procedure
   - Maintain backup access methods
   - Regular disaster recovery testing
