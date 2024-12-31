# Test Failure Notifications

## Overview

The Lagomo project uses a comprehensive email notification system to alert developers about test failures. Different types of failures trigger different notification patterns with varying urgency levels.

## Notification Types

### 1. Critical Alerts 
- **Recipients**: Primary notification email
- **Triggered by**: 
  - Test failures on main branch
  - Security vulnerabilities
  - Production deployment failures
- **Format**:
  ```
  Subject:  CRITICAL: Tests Failed on Main Branch - Lagomo
  
  CRITICAL: Tests Failed on Main Branch
  
  Branch: main
  Commit: [commit message]
  Author: [author name]
  
  Failed Jobs:
  [detailed failure information]
  ```

### 2. Development Alerts 
- **Recipients**: Commit author + CC to notification email
- **Triggered by**:
  - PR test failures
  - Development deployment issues
- **Format**:
  ```
  Subject:  Tests Failed on PR Branch - Lagomo
  
  Tests Failed on PR Branch
  
  Branch: [branch name]
  Commit: [commit message]
  Author: [author name]
  
  Failed Jobs:
  [detailed failure information]
  ```

### 3. Coverage Alerts 
- **Recipients**: Commit author + CC to notification email
- **Triggered by**:
  - Coverage dropping below thresholds
  - Missing test coverage in new code
- **Format**:
  ```
  Subject:  Code Coverage Below Threshold - Lagomo
  
  Code Coverage Below Threshold
  
  Branch: [branch name]
  Commit: [commit message]
  Author: [author name]
  ```

### 4. Nightly Build Alerts 
- **Recipients**: Primary notification email
- **Triggered by**:
  - Failures in nightly test runs
- **Format**:
  ```
  Subject:  Nightly Build Tests Failed - Lagomo
  
  Nightly Build Tests Failed
  
  Branch: [branch name]
  Failed Jobs:
  [detailed failure information]
  ```

## Setup Instructions

1. **Email Configuration**:
   Add the following secrets to your GitHub repository:
   ```
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-specific-password
   NOTIFICATION_EMAIL=team@example.com
   ```

2. **Gmail Setup** (if using Gmail):
   1. Enable 2-Factor Authentication
   2. Generate App Password:
      - Go to Google Account Settings
      - Security > App Passwords
      - Generate new app password for "Lagomo CI"
      - Use this as SMTP_PASSWORD

## Notification Settings

### Priority Levels

1. **P0 (Immediate)**:
   - Main branch failures
   - Security vulnerabilities
   - Production issues

2. **P1 (High)**:
   - PR failures blocking releases
   - Critical feature test failures
   - Coverage drops below 80%

3. **P2 (Medium)**:
   - Non-blocking PR failures
   - Minor coverage issues
   - Nightly build failures

### Rate Limiting

- Maximum 1 notification per 5 minutes for the same type of failure
- Grouped notifications for multiple failures
- Cool-down period of 15 minutes for repeated failures

## Customizing Notifications

### Adding New Notification Types

1. Edit `.github/workflows/test-notifications.yml`
2. Add new job section:
   ```yaml
   - name: Send custom notification
     uses: dawidd6/action-send-mail@v3
     with:
       subject: Your subject
       to: ${{secrets.NOTIFICATION_EMAIL}}
       body: |
         Your custom message
   ```

### Modifying Existing Notifications

1. Update email templates in workflow file
2. Adjust conditions in `if` statements
3. Modify recipient lists

## Troubleshooting

### Common Issues

1. **Missing Notifications**:
   - Check SMTP settings
   - Verify GitHub secrets
   - Check spam folders
   - Verify rate limiting

2. **Duplicate Notifications**:
   - Review workflow triggers
   - Check notification conditions

3. **Email Delivery Issues**:
   - Verify SMTP credentials
   - Check email quotas
   - Confirm recipient addresses

### Support

For notification issues:
1. Check GitHub Actions logs
2. Verify email configuration
3. Test SMTP settings
4. Review notification triggers
