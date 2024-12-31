# Lagomo

A decentralized application for tracking and analyzing time allocation across different modalities of intelligence, built on Optimism using Next.js, Hardhat, and Wagmi.

## Features

- 🔐 **Web3 Authentication**: Secure wallet-based authentication using WalletConnect
- ⏱️ **Time Tracking**: Track time spent across different modalities
- 📊 **Analytics**: Visualize and analyze your time allocation
- 🤝 **Smart Contracts**: Decentralized data storage and verification
- 🔄 **Questionnaire System**: Guided time allocation analysis

## Tech Stack

- **Frontend**: Next.js + React
- **Smart Contracts**: Solidity
- **Development Environment**: Hardhat
- **Web3 Libraries**: ethers.js, wagmi
- **Blockchain**: Optimism Sepolia
- **Database**: PostgreSQL
- **Backend**: Express.js
- **Authentication**: WalletConnect

## Documentation

📚 **[View Full Documentation](./docs/README.md)**

- [API Documentation](./docs/api/README.md)
- [Architecture Overview](./docs/architecture/README.md)
- [Development Guide](./docs/development/README.md)
- [Deployment Guide](./docs/deployment/README.md)
- [Security & Data Encryption](./docs/security/data-encryption.md)
- [System Architecture](./docs/architecture/system-overview.md)
- [Database Schema](./docs/architecture/database-schema.md)
- [Development Setup](./docs/development/setup.md)

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Update .env with your values
```

3. Start the development server:
```bash
npm run dev
```

## Project Structure

```
lagomo/
├── contracts/       # Smart contracts
├── docs/           # Documentation
├── server/         # Backend API
│   ├── config/     # Configuration files
│   ├── models/     # Database models
│   └── routes/     # API routes
├── test/           # Smart contract tests
├── scripts/        # Deployment scripts
└── client/         # Frontend application
```

## Contributing

Please read our [Contributing Guide](./docs/contributing/README.md) for details on our code of conduct and development process.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
