#!/bin/bash

# Default to development environment if not specified
ENVIRONMENT=${1:-development}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "Invalid environment. Must be one of: development, staging, production"
    exit 1
fi

# Deploy the CloudFormation stack
aws cloudformation deploy \
    --template-file aws/monitoring.yml \
    --stack-name "lagomo-monitoring-${ENVIRONMENT}" \
    --parameter-overrides Environment="${ENVIRONMENT}" \
    --capabilities CAPABILITY_IAM \
    --tags Environment="${ENVIRONMENT}" Project=Lagomo

# Get the stack outputs
aws cloudformation describe-stacks \
    --stack-name "lagomo-monitoring-${ENVIRONMENT}" \
    --query 'Stacks[0].Outputs' \
    --output table
