# Test Failure Notifications

## Overview

The Lagomo project uses AWS Simple Email Service (SES) to send email notifications when tests fail. The system is integrated with GitHub Actions and provides detailed information about test failures to help developers quickly identify and fix issues.

## Configuration

### AWS Configuration

1. **IAM Role**: The system uses the `github-actions-ses-role` IAM role with permissions to send emails via SES
2. **Email Configuration**: Notifications are sent from and to `gucci@lagomo.xyz`
3. **Region**: The system operates in `us-east-1`

### GitHub Actions Configuration

The notification system is configured in two workflow files:

1. `test.yml`: Runs the test suite
   - Triggers on:
     - Push to main branch
     - Daily at 2 AM UTC
   - Uses Node.js 18.x
   - Runs tests in a PostgreSQL environment

2. `test-notifications.yml`: Handles notifications
   - Triggers when the test workflow completes
   - Only sends notifications on test failures
   - Uses AWS SDK to send emails directly

## Notification Format

When tests fail, you'll receive an email with:

```
Subject: [DEV] Tests Failed - Lagomo (branch-name)

⚠️ Test Failure Alert

A test failure has occurred.

## Failure Details
- Branch: [branch name]
- Commit Message: [commit message]
- Author: [author name]
- Failed Jobs:
  [detailed failure information]

## Action Required
Please investigate and fix the failing tests.

View Workflow Run: [link to GitHub Actions run]
```

## Troubleshooting

If notifications are not being received:
1. Check the GitHub Actions logs for any errors
2. Verify that the AWS role has proper SES permissions
3. Ensure `gucci@lagomo.xyz` is verified in AWS SES

## Security

The system uses:
- AWS IAM role-based authentication
- GitHub Actions OIDC for secure AWS access
- No sensitive credentials stored in the repository
