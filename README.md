# NodeJS Monolith 🚀

[![CI/CD Pipeline](https://github.com/luizcurti/nodejs-monolith/actions/workflows/ci.yml/badge.svg)](https://github.com/luizcurti/nodejs-monolith/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/luizcurti/nodejs-monolith/branch/main/graph/badge.svg)](https://codecov.io/gh/luizcurti/nodejs-monolith)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.0-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Modular TypeScript monolith built with Clean Architecture principles, full test coverage (unit + E2E), and production-ready infrastructure.

## 🏗️ Architecture

The project follows **Clean Architecture** with clear separation of concerns. Each module is independent and communicates exclusively through its **Facades**.

### 📂 Modules

| Module            | Responsibility                                             |
| ----------------- | ---------------------------------------------------------- |
| **client-adm**    | Client registration and lookup                             |
| **product-adm**   | Product registration and inventory control                 |
| **store-catalog** | Product catalog for storefront                             |
| **payment**       | Payment transaction processing                             |
| **invoice**       | Invoice generation and retrieval                           |
| **checkout**      | Orchestrator: validate → check stock → pay → issue invoice |

### 🎯 Module layers

```
src/
├── infrastructure/          # Infrastructure (DB, logging)
└── modules/
    ├── @shared/             # Shared domain entities and interfaces
    └── [module]/
        ├── domain/          # Business entities and domain rules
        ├── facade/          # Public module interface
        ├── factory/         # Dependency injection
        ├── gateway/         # Interfaces for external dependencies
        ├── repository/      # Data persistence
        ├── routes/          # HTTP routes + E2E tests
        └── usecase/         # Application use cases
```

### 🔄 Checkout flow

```
POST /api/checkout
  │
  ├─ ClientAdmFacade    → validates client exists
  ├─ ProductAdmFacade   → checks stock for each product
  ├─ StoreCatalogFacade → retrieves product name and sale price
  ├─ PaymentFacade      → processes payment
  │     ├─ total ≥ 100 → approved (200)
  │     └─ total < 100 → declined (422)
  ├─ InvoiceFacade      → generates invoice (only if approved)
  └─ OrderRepository    → persists the order
```

## 🛠️ Stack

| Category      | Technology                       |
| ------------- | -------------------------------- |
| Language      | TypeScript 5.6                   |
| Runtime       | Node.js 18+                      |
| Framework     | Express                          |
| ORM           | Sequelize + sequelize-typescript |
| Production DB | PostgreSQL 16 (Docker)           |
| Test DB       | SQLite (in-memory)               |
| Cache         | Redis 7                          |
| Testing       | Jest + Supertest                 |
| Validation    | Joi                              |
| Lint/Format   | ESLint + Prettier                |
| Logging       | Winston                          |
| Containers    | Docker Compose                   |

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18 and npm
- **Docker** and **Docker Compose** (CLI v2)

### Installation

```bash
git clone https://github.com/luizcurti/nodejs-monolith.git
cd nodejs-monolith
npm install
```

### Start infrastructure

```bash
npm run docker:up
```

This starts:

- **PostgreSQL 16** on port `5432`
- **PgAdmin 4** at `http://localhost:8080`
- **Redis 7** on port `6379`

### Run

```bash
# Development (hot reload)
npm run start:dev

# Production
npm run build && npm start
```

## 🔧 Available scripts

| Script                  | Description                        |
| ----------------------- | ---------------------------------- |
| `npm start`             | Run production build               |
| `npm run start:dev`     | Development server with hot reload |
| `npm run build`         | Compile TypeScript                 |
| `npm test`              | Run all tests                      |
| `npm run test:watch`    | Tests in watch mode                |
| `npm run test:coverage` | Generate coverage report           |
| `npm run lint`          | ESLint analysis                    |
| `npm run lint:fix`      | Auto-fix lint errors               |
| `npm run format`        | Format code with Prettier          |
| `npm run docker:up`     | Start Docker containers            |
| `npm run docker:down`   | Stop Docker containers             |
| `npm run docker:logs`   | Stream container logs              |

## 🗄️ Database

### Credentials

```
PostgreSQL:
  database: monolith_db
  user:     monolith_user
  password: monolith_pass
  host:     localhost:5432

PgAdmin:
  email:    admin@monolith.com
  password: admin123
  url:      http://localhost:8080
```

### Testing strategy

- **Unit and integration tests**: SQLite in-memory — no Docker dependency
- **Production / development**: PostgreSQL via Docker

## 📊 API Endpoints

All routes with a body are validated via **Joi**. Validation errors return `400` with `{ error: "<details>" }`.

---

### Health Check

```
GET /health
```

`200` → `{ status, timestamp, uptime, environment }`

---

### Client Administration

#### `POST /api/clients`

| Field     | Type   | Required | Constraints        |
| --------- | ------ | -------- | ------------------ |
| `id`      | string | no       |                    |
| `name`    | string | **yes**  |                    |
| `email`   | string | **yes**  | valid email format |
| `address` | string | **yes**  |                    |

| Status | Body                                         |
| ------ | -------------------------------------------- |
| `201`  | `{ message: 'Client created successfully' }` |
| `400`  | `{ error: "..." }`                           |
| `500`  | `{ error: "..." }`                           |

#### `GET /api/clients/:id`

| Status | Body                                                 |
| ------ | ---------------------------------------------------- |
| `200`  | `{ id, name, email, address, createdAt, updatedAt }` |
| `404`  | `{ error: "Client not found" }`                      |
| `500`  | `{ error: "..." }`                                   |

---

### Product Administration

#### `POST /api/products`

| Field           | Type   | Required | Constraints    |
| --------------- | ------ | -------- | -------------- |
| `id`            | string | no       |                |
| `name`          | string | **yes**  |                |
| `description`   | string | **yes**  |                |
| `purchasePrice` | number | **yes**  | positive (> 0) |
| `stock`         | number | **yes**  | integer ≥ 0    |

| Status | Body                                          |
| ------ | --------------------------------------------- |
| `201`  | `{ message: 'Product created successfully' }` |
| `400`  | `{ error: "..." }`                            |
| `500`  | `{ error: "..." }`                            |

#### `GET /api/products/:id/stock`

| Status | Body                             |
| ------ | -------------------------------- |
| `200`  | `{ productId, stock }`           |
| `404`  | `{ error: "Product not found" }` |
| `500`  | `{ error: "..." }`               |

---

### Store Catalog

#### `GET /api/catalog/products`

| Status | Body                                                    |
| ------ | ------------------------------------------------------- |
| `200`  | `{ products: [{ id, name, description, salesPrice }] }` |
| `500`  | `{ error: "..." }`                                      |

#### `GET /api/catalog/products/:id`

| Status | Body                                    |
| ------ | --------------------------------------- |
| `200`  | `{ id, name, description, salesPrice }` |
| `404`  | `{ error: "Product not found" }`        |
| `500`  | `{ error: "..." }`                      |

---

### Payments

Business rule: `amount ≥ 100` → `approved`; `amount < 100` → `declined`.

#### `POST /api/payments`

| Field     | Type   | Required | Constraints    |
| --------- | ------ | -------- | -------------- |
| `orderId` | string | **yes**  |                |
| `amount`  | number | **yes**  | positive (> 0) |

| Status | Body                                                                           |
| ------ | ------------------------------------------------------------------------------ |
| `200`  | `{ transactionId, orderId, amount, status: 'approved', createdAt, updatedAt }` |
| `400`  | `{ error: "..." }`                                                             |
| `422`  | `{ transactionId, orderId, amount, status: 'declined', createdAt, updatedAt }` |
| `500`  | `{ error: "..." }`                                                             |

---

### Invoice

#### `POST /api/invoices`

| Field           | Type   | Required | Constraints     |
| --------------- | ------ | -------- | --------------- |
| `id`            | string | no       |                 |
| `name`          | string | **yes**  |                 |
| `document`      | string | **yes**  |                 |
| `address`       | string | **yes**  |                 |
| `items`         | array  | **yes**  | at least 1 item |
| `items[].name`  | string | **yes**  |                 |
| `items[].price` | number | **yes**  | positive (> 0)  |
| `items[].id`    | string | no       |                 |

| Status | Body                                                                            |
| ------ | ------------------------------------------------------------------------------- |
| `201`  | `{ id, name, document, address, items: [{id, name, price}], total, createdAt }` |
| `400`  | `{ error: "..." }`                                                              |
| `500`  | `{ error: "..." }`                                                              |

#### `GET /api/invoices/:id`

| Status | Body                                                                            |
| ------ | ------------------------------------------------------------------------------- |
| `200`  | `{ id, name, document, address, items: [{id, name, price}], total, createdAt }` |
| `404`  | `{ error: "Invoice not found" }`                                                |
| `500`  | `{ error: "..." }`                                                              |

---

### Checkout

Orchestrates all modules in a single transactional flow.

#### `POST /api/checkout`

| Field                  | Type   | Required | Constraints             |
| ---------------------- | ------ | -------- | ----------------------- |
| `clientId`             | string | **yes**  | client must exist       |
| `products`             | array  | **yes**  | at least 1 item         |
| `products[].productId` | string | **yes**  | product must have stock |

| Status | Condition                       | Body                                                                          |
| ------ | ------------------------------- | ----------------------------------------------------------------------------- |
| `200`  | Payment approved (total ≥ 100)  | `{ id, invoiceId, transactionId, status: 'approved', total, products }`       |
| `400`  | Input validation failed         | `{ error: "..." }`                                                            |
| `422`  | Payment declined (total < 100)  | `{ id, invoiceId: null, transactionId, status: 'declined', total, products }` |
| `422`  | Client not found / out of stock | `{ error: "..." }`                                                            |
| `500`  | Internal error                  | `{ error: "..." }`                                                            |

> **Note:** `invoiceId` is `null` for declined orders — invoices are only generated for approved payments.

---

## 🧪 Tests

### Suites

| Type                             | Suites | Tests   |
| -------------------------------- | ------ | ------- |
| Unit (domain, usecase)           | 9      | —       |
| Integration (repository, facade) | 9      | —       |
| E2E (routes with SQLite)         | 6      | —       |
| **Total**                        | **24** | **160** |

### Running tests

```bash
# All tests
npm test

# E2E only (routes)
./node_modules/.bin/jest --testPathPattern="routes" --forceExit

# With coverage
npm run test:coverage
```

### Coverage thresholds (jest.config.ts)

| Scope                        | Statements | Branches | Functions | Lines |
| ---------------------------- | ---------- | -------- | --------- | ----- |
| Global                       | 95%        | 85%      | 90%       | 95%   |
| `domain/*.entity.ts`         | 95%        | 90%      | 90%       | 95%   |
| `usecase/**/*.usecase.ts`    | 100%       | 100%     | 100%      | 100%  |
| `repository/*.repository.ts` | 95%        | 80%      | 100%      | 95%   |
| `facade/*.facade.ts`         | 100%       | 100%     | 100%      | 100%  |
| `factory/*.factory.ts`       | 100%       | 100%     | 100%      | 100%  |

## 🔍 Code Quality

```bash
npm run lint        # ESLint
npm run lint:fix    # ESLint with auto-fix
npm run format      # Prettier
```

- Zero ESLint errors
- 100% Prettier compliance
- TypeScript strict mode

## 🐳 Docker

```bash
npm run docker:up    # Start PostgreSQL, PgAdmin and Redis
npm run docker:down  # Stop all containers
npm run docker:logs  # Stream logs in real time
```

### Services

| Service    | Image              | Port |
| ---------- | ------------------ | ---- |
| PostgreSQL | postgres:16-alpine | 5432 |
| PgAdmin 4  | dpage/pgadmin4     | 8080 |
| Redis      | redis:7-alpine     | 6379 |

## 🌍 Environment Variables

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
```

## 🤝 Contributing

1. Fork the repository
2. Create a branch (`git checkout -b feature/my-feature`)
3. Run tests (`npm test`)
4. Check lint and formatting (`npm run lint && npm run format`)
5. Commit (`git commit -m 'feat: my feature'`)
6. Push (`git push origin feature/my-feature`)
7. Open a Pull Request
