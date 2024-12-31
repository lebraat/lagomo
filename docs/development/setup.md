# Development Setup Guide

## Prerequisites

1. Node.js (v18 or higher)
2. PostgreSQL 14
3. Git

## Installation Steps

1. **Clone the Repository**
```bash
git clone <repository-url>
cd lagomo
```

2. **Install Dependencies**
```bash
npm install
```

3. **Set Up PostgreSQL**
```bash
# Install PostgreSQL (Mac)
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb lagomo
```

4. **Environment Setup**
```bash
# Copy example env file
cp .env.example .env

# Update with your values:
# - DATABASE_URL
# - JWT_SECRET
# - WALLETCONNECT_PROJECT_ID
# - INFURA_PROJECT_ID
```

5. **Start Development Server**
```bash
# Start backend server
npm run dev

# In another terminal, start frontend
npm run dev:frontend
```

## Configuration

### Environment Variables

```env
DATABASE_URL=postgresql://localhost:5432/lagomo
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=3000
```

### WalletConnect Setup

1. Get your WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Add it to your environment variables

### Database Configuration

The database configuration can be found in `server/config/database.js`:

```javascript
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});
```

## Development Workflow

1. Create a new branch for your feature
2. Make your changes
3. Run tests
4. Submit a pull request

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test-file.js

# Run with coverage
npm run test:coverage
```

## Common Issues

### Database Connection

If you can't connect to the database:
1. Check if PostgreSQL is running
2. Verify database exists
3. Check connection string

### Port Conflicts

If port 3000 is in use:
1. Kill the process using the port
2. Or change the port in .env

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [WalletConnect Docs](https://docs.walletconnect.com/)
- [Express.js Guide](https://expressjs.com/)
