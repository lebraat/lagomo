# Data Encryption and Security

## Overview
Lagomo implements multiple layers of security to protect user data and prevent unauthorized access. This document outlines the security measures and encryption methods used throughout the application.

## Data Encryption

### Encryption Algorithm
- **Method**: AES-256-CBC (Advanced Encryption Standard)
- **Key Size**: 256 bits
- **IV Size**: 16 bytes (128 bits)
- **Implementation**: Node.js native `crypto` module

### Encrypted Data Fields
| Field | Encryption Method | Purpose |
|-------|------------------|----------|
| Nonce | AES-256-CBC | Secure storage of authentication nonces |
| Wallet Address | SHA-256 Hash | Secondary index and lookup security |

### Encryption Process
1. **Nonce Encryption**:
   ```javascript
   // Encryption
   const iv = crypto.randomBytes(16);
   const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
   const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
   return `${iv}:${encrypted}`;

   // Decryption
   const [iv, encryptedData] = text.split(':');
   const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
   return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
   ```

2. **Wallet Address Hashing**:
   ```javascript
   const hash = crypto.createHash('sha256').update(text).digest('hex');
   ```

## Security Measures

### Rate Limiting
- 5 failed login attempts trigger a 15-minute account lockout
- IP-based rate limiting via Express middleware
- Automatic reset of failed attempts on successful login

### Authentication Flow
1. User requests nonce (rate-limited)
2. User signs message with wallet
3. Backend verifies signature
4. JWT token issued upon success

### Data Storage Security
- Sensitive data encrypted at rest
- Wallet addresses stored with both plain and hashed versions
- Login attempts and IP addresses tracked
- Timestamps for all security events

## Environment Variables
```env
# Required for encryption
ENCRYPTION_KEY=32-byte-hex-string

# Authentication settings
JWT_SECRET=secure-jwt-secret
JWT_EXPIRATION=24h
```

## Security Best Practices

### Key Management
- Encryption keys should be rotated periodically
- Keys should never be committed to version control
- Production keys should be managed through secure key management systems

### Data Access
- All sensitive data access is logged
- Failed decryption attempts are monitored
- Automatic alerts for suspicious activity

### Error Handling
- Generic error messages in production
- Detailed logging for debugging
- No sensitive data in error responses

## Audit Trail
The following events are tracked:
- Login attempts (successful and failed)
- IP addresses of all authentication attempts
- Account lockouts
- Key usage and rotation

## Recovery Procedures

### Account Lockout
1. User must wait 15 minutes for automatic unlock
2. Manual unlock requires admin intervention
3. All unlock events are logged

### Data Recovery
- Encrypted data requires encryption key
- Lost keys cannot recover encrypted data
- Regular backups should be maintained

## Security Monitoring

### Alerts
The system monitors and alerts on:
- Multiple failed login attempts
- Unusual IP patterns
- Encryption/decryption failures
- Database access patterns

### Logging
Security events are logged with:
- Timestamp
- Event type
- IP address
- Affected user (if applicable)
- Success/failure status

## Implementation Details

### User Model Security Fields
```javascript
{
  walletAddress: String,     // Original address
  walletAddressHash: String, // Hashed for lookups
  encryptedNonce: String,    // Encrypted authentication nonce
  lastLoginIP: String,       // IP tracking
  failedLoginAttempts: Number, // Security monitoring
  lockedUntil: Date         // Account lockout tracking
}
```

### Automatic Encryption
The model automatically handles encryption/decryption:
```javascript
// Before save
if (this.nonce) {
  this.encryptedNonce = encrypt(this.nonce);
  this.nonce = undefined;
}

// When retrieving
if (values.encryptedNonce) {
  values.nonce = decrypt(values.encryptedNonce);
  delete values.encryptedNonce;
}
```
