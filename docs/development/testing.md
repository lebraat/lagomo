# Testing Guide

## Overview

The Lagomo application uses a comprehensive testing suite to ensure reliability and security. We use the following testing stack:

- **Mocha**: Test runner
- **Chai**: Assertion library
- **chai-http**: HTTP integration testing
- **ethers**: Ethereum testing utilities

## Test Structure

```
server/
└── test/
    ├── setup.js          # Test configuration
    ├── auth.test.js      # Authentication tests
    └── ...               # Other test files
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/auth.test.js

# Run with coverage
npm run test:coverage
```

## Authentication Tests

The authentication test suite (`auth.test.js`) covers:

1. **Nonce Generation**
   - Valid wallet address handling
   - Invalid wallet address rejection
   - Rate limiting

2. **Signature Verification**
   - Valid signature acceptance
   - Invalid signature rejection
   - Nonce reuse prevention

3. **Token Refresh**
   - Valid token refresh
   - Invalid token handling
   - Missing token handling

4. **Middleware**
   - Protected route access
   - Token validation
   - User attachment to request

## Test Environment

Tests run in a separate environment with:
- Clean database for each test
- Test-specific environment variables
- Isolated test wallet

## Writing Tests

Follow these guidelines when writing tests:

1. **Test Structure**
   ```javascript
   describe('Feature', () => {
     before(() => {
       // Setup before all tests
     });

     beforeEach(() => {
       // Setup before each test
     });

     it('should do something', async () => {
       // Test case
     });

     after(() => {
       // Cleanup after all tests
     });
   });
   ```

2. **Naming Conventions**
   - Use descriptive test names
   - Follow "should" pattern
   - Group related tests

3. **Assertions**
   ```javascript
   expect(response).to.have.status(200);
   expect(response.body).to.have.property('token');
   expect(value).to.be.a('string');
   ```

## Coverage Requirements

Aim for the following coverage metrics:
- Statements: > 80%
- Branches: > 80%
- Functions: > 90%
- Lines: > 80%

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Nightly builds

## Debugging Tests

1. **View Detailed Logs**
   ```bash
   DEBUG=* npm test
   ```

2. **Single Test Run**
   ```bash
   npm test -- --grep "test name"
   ```

3. **Inspect Database**
   ```bash
   npm run test:debug
   ```

## Common Issues

1. **Database Connection**
   - Ensure test database exists
   - Check connection string
   - Verify credentials

2. **Async Tests**
   - Always return promises
   - Use async/await
   - Handle timeouts

3. **Rate Limiting**
   - Reset rate limiters between tests
   - Use appropriate delays
   - Mock time sensitive operations
