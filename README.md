# NodeJS Monolith 2.0 🚀

[![CI/CD Pipeline](https://github.com/luizcurti/nodejs-monolith/actions/workflows/ci.yml/badge.svg)](https://github.com/luizcurti/nodejs-monolith/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/luizcurti/nodejs-monolith/branch/main/graph/badge.svg)](https://codecov.io/gh/luizcurti/nodejs-monolith)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.0-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, production-ready TypeScript monolith built with Clean Architecture principles, comprehensive testing, and enterprise-grade infrastructure.

## 🏗️ Architecture

This project demonstrates a well-structured monolithic application using **Clean Architecture** with clear separation of concerns:

### 📂 Core Modules

- **🔧 Client-ADM**: Complete client administration and management system
- **💳 Payment**: Robust payment processing and transaction management
- **📦 Product-ADM**: Comprehensive product administration and inventory control
- **🏪 Store-Catalog**: High-performance product catalog for storefront operations

### 🎯 Architecture Layers

```
src/
├── infrastructure/          # External concerns (DB, logging, etc.)
├── modules/
│   ├── @shared/            # Shared domain entities and interfaces
│   └── [module-name]/
│       ├── domain/         # Business entities and domain logic
│       ├── facade/         # Public module interface (API)
│       ├── factory/        # Dependency injection factories
│       ├── gateway/        # Interface definitions for external deps
│       ├── repository/     # Data persistence layer
│       └── usecase/        # Application business logic
```

## 🛠️ Technology Stack

### Core Technologies

- **🔷 TypeScript** - Type-safe JavaScript with latest ES features
- **⚡ Node.js** - High-performance JavaScript runtime
- **🌐 Express** - Fast, unopinionated web framework

### Database & Persistence

- **🐘 PostgreSQL** - Production database (via Docker)
- **📁 SQLite** - Development and testing database
- **🔄 Sequelize** - Modern ORM with TypeScript support
- **🏗️ Redis** - Caching and session management

### Development & Quality

- **🧪 Jest** - Comprehensive testing framework
- **📏 ESLint** - Code linting and quality enforcement
- **🎨 Prettier** - Automatic code formatting
- **📋 Winston** - Advanced logging system
- **🐳 Docker** - Containerized development environment

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm 8+
- **Docker** and **Docker Compose**
- **Git**

### 1. Clone and Setup

```bash
git clone https://github.com/luizcurti/nodejs-monolith.git
cd nodejs-monolith
cp .env.example .env
npm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Redis, and PgAdmin
npm run docker:up

# View logs
npm run docker:logs
```

### 3. Development Commands

```bash
# Run tests
npm test

# Start development server with hot reload
npm run start:dev

# Build for production
npm run build && npm start

# Code quality
npm run lint
npm run format
```

## 🔧 Available Scripts

| Script                  | Description                        |
| ----------------------- | ---------------------------------- |
| `npm start`             | Run production build               |
| `npm run start:dev`     | Development server with hot reload |
| `npm run build`         | Build TypeScript to JavaScript     |
| `npm test`              | Run all tests with coverage        |
| `npm run test:watch`    | Run tests in watch mode            |
| `npm run test:coverage` | Generate test coverage report      |
| `npm run lint`          | Run ESLint code analysis           |
| `npm run lint:fix`      | Auto-fix ESLint issues             |
| `npm run format`        | Format code with Prettier          |
| `npm run docker:up`     | Start all Docker services          |
| `npm run docker:down`   | Stop all Docker services           |
| `npm run docker:logs`   | View Docker container logs         |

## 🗄️ Database Configuration

### Development & Production

- **Database**: PostgreSQL 16 (Docker)
- **Admin Panel**: PgAdmin 4 at `http://localhost:8080`
- **Connection**: localhost:5432
- **Cache**: Redis at localhost:6379

### Testing

- **Database**: SQLite (in-memory)
- **Fast execution**: No Docker dependency for tests

### Database Credentials

```
Database: monolith_db
User: monolith_user
Password: monolith_pass

PgAdmin: admin@monolith.com / admin123
```

## 📊 API Endpoints

### Health Check

```
GET /health - Application health and status
```

### Module Endpoints (Coming Soon)

- `GET|POST /api/clients` - Client management
- `GET|POST /api/products` - Product catalog
- `POST /api/payments` - Payment processing

## 🧪 Testing Strategy

### Test Categories

- **Unit Tests**: Individual component testing
- **Integration Tests**: Module interaction testing
- **Repository Tests**: Database interaction testing
- **Facade Tests**: Public API testing

### Test Coverage

```bash
npm run test:coverage
```

- Target: >90% code coverage
- All critical business logic tested
- Database operations verified

## 🔍 Code Quality

### Automated Quality Checks

- **ESLint**: Advanced TypeScript linting
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks (when configured)
- **TypeScript**: Strict type checking

### Quality Metrics

- Zero ESLint errors
- 100% Prettier compliance
- Strict TypeScript configuration
- Comprehensive test coverage

## 🚀 CI/CD Pipeline

### ⚡ Simple & Fast GitHub Actions

**Single job** que executa tudo de forma eficiente:

#### 🔍 Quality & Testing Pipeline

```bash
✓ TypeScript compilation check
✓ ESLint code analysis
✓ Prettier formatting validation
✓ Jest tests with 100% coverage
✓ npm audit security check
✓ Codecov upload (push only)
```

#### 🎯 Infrastructure

- **Node.js**: 20.x LTS only
- **Database**: PostgreSQL 16 (test services)
- **Cache**: npm dependency caching
- **Runtime**: ~3-4 minutes total

#### 🛠️ Local Testing

```bash
make ci-test    # Run same checks locally
```

## 🌍 Environment Configuration

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=monolith_db
DB_USER=monolith_user
DB_PASSWORD=monolith_pass

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Security
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## 🐳 Docker Services

```yaml
Services:
  - postgres:5432 # PostgreSQL database
  - pgadmin:8080 # Database admin interface
  - redis:6379 # Redis cache
```

## 🔮 Roadmap

### Version 2.1

- [ ] REST API endpoints for all modules
- [ ] JWT authentication system
- [ ] API documentation with Swagger
- [ ] Request validation middleware

### Version 2.2

- [ ] GraphQL API layer
- [ ] Real-time features with WebSockets
- [ ] Advanced caching strategies
- [ ] Performance monitoring

### Version 3.0

- [ ] Microservices migration path
- [ ] Event sourcing implementation
- [ ] CQRS pattern adoption
- [ ] Kubernetes deployment

## 📈 Performance Features

- **Connection Pooling**: Optimized database connections
- **Caching Strategy**: Redis for frequently accessed data
- **Graceful Shutdown**: Proper resource cleanup
- **Health Monitoring**: Application status endpoints
- **Structured Logging**: Comprehensive log management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Check code quality (`npm run lint && npm run format`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request
