# Environment Variables Documentation

## Overview

This document lists all environment variables required for the Lagomo application. These variables should be set in different places depending on the environment:

- Local Development: `.env` file
- CI/CD: GitHub Secrets
- Production: Secure environment configuration

## Required Variables

### Database Configuration
```bash
# PostgreSQL connection URL
DATABASE_URL=postgresql://username:password@localhost:5432/lagomo

# Database configuration (alternative to URL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lagomo
DB_USER=postgres
DB_PASSWORD=your_password
```

### Authentication
```bash
# JWT configuration
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRATION=24h

# Web3 configuration
WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
INFURA_PROJECT_ID=your-infura-project-id
```

### Server Configuration
```bash
# Node environment (development, test, production)
NODE_ENV=development

# Server port
PORT=3000

# API Base URL
API_BASE_URL=http://localhost:3000
```

### Test Configuration
```bash
# Test database
TEST_DATABASE_URL=postgresql://username:password@localhost:5432/lagomo_test

# Test JWT secret
TEST_JWT_SECRET=test-jwt-secret
```

### Email Notifications
```bash
# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::account:role/lagomo-github-actions
SES_FROM_EMAIL=gucci@lagomo.xyz
SES_TO_EMAIL=gucci@lagomo.xyz
```

### Environment-Specific Variables

### Development
```bash
# Development-specific settings
DEBUG=true
LOG_LEVEL=debug
ENABLE_SWAGGER=true

# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::account:role/lagomo-github-actions
SES_FROM_EMAIL=gucci@lagomo.xyz
SES_TO_EMAIL=gucci@lagomo.xyz
```

### Testing
```bash
# Testing-specific settings
COVERAGE_THRESHOLD=80
ENABLE_E2E_TESTS=true
```

### Production
```bash
# Production-specific settings
LOG_LEVEL=info
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
```

## Example .env File
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/lagomo

# Authentication
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRATION=24h
WALLETCONNECT_PROJECT_ID=your-project-id
INFURA_PROJECT_ID=your-infura-id

# Server
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000

# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::account:role/lagomo-github-actions
SES_FROM_EMAIL=gucci@lagomo.xyz
SES_TO_EMAIL=gucci@lagomo.xyz

# Development Settings
DEBUG=true
LOG_LEVEL=debug
ENABLE_SWAGGER=true
```

## GitHub Secrets

The following secrets should be set in your GitHub repository:

1. **Database**
   - `DATABASE_URL`

2. **Authentication**
   - `JWT_SECRET`
   - `WALLETCONNECT_PROJECT_ID`
   - `INFURA_PROJECT_ID`

3. **AWS Configuration**
   - `AWS_REGION`
   - `AWS_ROLE_ARN`

## Setting Up Variables

### Local Development
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` with your values
3. Never commit `.env` file (it's in .gitignore)

### GitHub Actions
1. Go to repository Settings
2. Navigate to Secrets and Variables > Actions
3. Add each required secret

### Production
1. Use secure environment management system
2. Never expose sensitive values
3. Rotate secrets regularly

## Security Notes

1. **Sensitive Information**
   - Never commit secrets to version control
   - Use secure secret management
   - Rotate credentials regularly

2. **Production Security**
   - Use different values for production
   - Implement proper access controls
   - Monitor environment access

3. **Development Safety**
   - Use dummy data for development
   - Keep development and production separate
   - Use different credentials for each environment
