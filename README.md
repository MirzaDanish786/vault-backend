# Vault Backend 🛡️

> A robust, type-safe backend API built with Node.js, Express, and TypeScript, leveraging Supabase and Prisma for secure data management.

## 📖 Description

**Vault Backend** is a scalable and secure backend infrastructure designed to power modern web applications. It provides a solid foundation for user management, authentication, and role-based access control (RBAC). Built with a focus on type safety and developer experience, it utilizes **TypeScript** for logic, **Prisma** for ORM, and **Supabase** for enhanced authentication and database capabilities.

Key features include a modular architecture, environment-based configuration, centralized error handling, and a comprehensive suite of utilities for validation and logging.

## ✨ Features

- **🔐 Authentication & Authorization**: Secure user authentication powered by Supabase and custom JWT handling.
- **bust User Management**: Complete lifecycle management for Users, including Profiles and Addresses.
- **👮 Role-Based Access Control (RBAC)**: Fine-grained permissions for internal roles (ADMIN, USER, SELLER).
- **🗄️ Database Management**: Postgres database interaction via Prisma ORM with type-safe queries.
- **🛡️ Validation**: Request validation using Zod schemas to ensure data integrity.
- **📝 Logging**: Centralized logging system using Winston for monitoring and debugging.
- **⚙️ Configuration**: Strictly typed environment variable management.

## 🛠️ Technologies

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL (via [Supabase](https://supabase.com/))
- **Auth**: [Supabase Auth](https://supabase.com/docs/guides/auth)

# 🏦 VAULT Backend - Professional E-Commerce API

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![Express](https://img.shields.io/badge/Express-5.0-black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-orange)
![Prisma](https://img.shields.io/badge/Prisma-ORM-purple)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

A production-ready Node.js/TypeScript backend for a modern e-commerce platform with multi-role authentication, secure payment processing, and scalable architecture. Built with enterprise patterns used at top tech companies.

---

## 📋 Table of Contents

🚀 Features

🛠️ Tech Stack

📁 Project Architecture

⚙️ Installation & Setup

🚦 Running the Project

📡 API Endpoints

🏗️ Folder Structure

🔒 Security Features

🧪 Testing

📈 Deployment

🤝 Contributing

📄 License

---

## 🚀 Features

✅ Implemented

- 🔐 Secure Authentication - JWT-based auth with Supabase integration
- 👥 Multi-Role System - USER, ADMIN, SELLER roles with RBAC
- 💾 Database Integration - PostgreSQL with Prisma ORM
- 📊 Structured Logging - Winston logger with file rotation
- 🔄 API Standardization - Consistent response/error formats
- ⚡ Rate Limiting - Protection against brute force attacks
- 🔍 Input Validation - Zod schema validation
- 🎯 Path Aliases - Clean imports with @/ notation
- 🧹 Error Handling - Centralized error management
- 📦 Transaction Safety - Atomic database operations

🚧 Planned Features

- 💰 Payment Processing - Stripe/PayPal integration
- 📧 Email Service - Welcome emails, password reset
- 📄 File Uploads - Cloud storage for product images
- 📊 Analytics - User behavior tracking
- 🔔 Real-time Notifications - WebSocket support
- 🧪 Comprehensive Testing - Unit & integration tests
- 🐳 Docker Support - Containerization
- 📝 API Documentation - Swagger/OpenAPI specs
- 📱 Mobile Optimization - API optimizations for mobile

---

## 🛠️ Tech Stack

| Category     | Technology     | Purpose                                |
| ------------ | -------------- | -------------------------------------- |
| Runtime      | Node.js 20+    | JavaScript runtime                     |
| Language     | TypeScript 5.9 | Type safety & developer experience     |
| Framework    | Express.js 5   | Web server framework                   |
| Database     | PostgreSQL 15  | Primary data store                     |
| Auth Service | Supabase Auth  | Secure authentication & authorization  |
| ORM          | Prisma         | Database client & migrations           |
| Validation   | Zod            | Runtime schema validation              |
| Logging      | Winston        | Structured logging with transports     |
| Security     | Helmet, CORS   | HTTP headers & cross-origin protection |
| Dev Tools    | tsx, nodemon   | Development experience                 |

---

## 📁 Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYERED ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│  PRESENTATION LAYER    │  Controllers, Routes, Middleware   │
│  BUSINESS LAYER        │  Services, Validators, Logic       │
│  DATA LAYER            │  Repositories, Database Clients    │
│  INFRASTRUCTURE LAYER  │  Config, Utilities, External APIs  │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Installation & Setup

**Prerequisites**

- Node.js 20 or higher
- PostgreSQL 15+ (or Supabase account)
- npm or yarn package manager
- Git

**Step-by-Step Setup**

1. Clone the repository
   ```bash
   git clone https://github.com/MirzaDanish786/vault-backend.git
   cd vault-backend
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Environment Configuration
   ```bash
   # Copy example environment file
   cp .env.example .env
   # Edit .env file with your credentials
   nano .env
   ```
4. Configure Environment Variables

   ```env
   # Application
   NODE_ENV=development
   PORT=3000
   LOG_LEVEL=info

   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxxxxxxxxx
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Database (from Supabase)
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres

   # Optional Features
   ENABLE_RATE_LIMITING=true
   ENABLE_LOGGING=true
   ```

5. Database Setup
   ```bash
   # Generate Prisma client
   npx prisma generate
   # Push schema to database
   npx prisma db push
   # (Optional) Seed database with sample data
   npx prisma db seed
   ```
6. Generate Types (Optional)
   ```bash
   # Generate TypeScript types from Supabase
   npx supabase gen types typescript --project-id your-project-id > src/types/database.types.ts
   ```

---

## 🚦 Running the Project

**Development Mode**

```bash
# Start development server with hot reload
npm run dev
```

**Production Build**

```bash
npm run build
npm start
```

# Using PM2 for process management (recommended)

```bash
pm2 start dist/server.js --name vault-backend
```

### Docker (Coming Soon)

```bash
# Build and run with Docker
docker build -t vault-backend .
docker run -p 3000:3000 --env-file .env vault-backend
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint          | Description          | Auth Required |
| ------ | ----------------- | -------------------- | ------------- |
| POST   | /api/auth/signup  | Register new user    | No            |
| POST   | /api/auth/signin  | User login           | No            |
| POST   | /api/auth/signout | User logout          | Yes           |
| POST   | /api/auth/refresh | Refresh access token | Yes           |
| GET    | /api/auth/me      | Get current user     | Yes           |

### Users

| Method | Endpoint       | Description    | Roles       |
| ------ | -------------- | -------------- | ----------- |
| GET    | /api/users     | List all users | ADMIN       |
| GET    | /api/users/:id | Get user by ID | ADMIN, SELF |
| PUT    | /api/users/:id | Update user    | ADMIN, SELF |
| DELETE | /api/users/:id | Delete user    | ADMIN       |

### Products (Coming Soon)

| Method | Endpoint          | Description         | Roles         |
| ------ | ----------------- | ------------------- | ------------- |
| GET    | /api/products     | List products       | Any           |
| POST   | /api/products     | Create product      | SELLER, ADMIN |
| GET    | /api/products/:id | Get product details | Any           |
| PUT    | /api/products/:id | Update product      | SELLER, ADMIN |
| DELETE | /api/products/:id | Delete product      | ADMIN         |

### Orders (Coming Soon)

| Method | Endpoint               | Description         | Roles       |
| ------ | ---------------------- | ------------------- | ----------- |
| POST   | /api/orders            | Create order        | USER        |
| GET    | /api/orders            | List user orders    | USER        |
| GET    | /api/orders/:id        | Get order details   | USER, ADMIN |
| PUT    | /api/orders/:id/status | Update order status | ADMIN       |

### Health & Monitoring

| Method | Endpoint     | Description         |
| ------ | ------------ | ------------------- |
| GET    | /api/health  | System health check |
| GET    | /api/metrics | Application metrics |

---

## 🏗️ Folder Structure

```
vault-backend/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── env.ts             # Environment validation
│   │   └── constants.ts       # Application constants
│   │
│   ├── controllers/           # HTTP controllers
│   │   └── auth.controller.ts # Authentication controller
│   │
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts           # Authentication middleware
│   │   ├── error-handler.ts  # Global error handler
│   │   ├── rate-limiter.ts   # Rate limiting
│   │   └── request-id.ts     # Request tracing
│   │
│   ├── routes/                # API routes
│   │   ├── auth.routes.ts    # Authentication routes
│   │   ├── user.routes.ts    # User management routes
│   │   └── index.ts          # Route aggregator
│   │
│   ├── services/             # Business logic layer
│   │   └── auth/
│   │       ├── auth.service.ts      # Auth business logic
│   │       ├── auth.validators.ts   # Input validation
│   │       └── auth.types.ts        # Type definitions
│   │
│   ├── lib/                  # External library wrappers
│   │   ├── prisma/          # Database client
│   │   └── supabase/        # Supabase client
│   │
│   ├── utils/               # Utility functions
│   │   ├── api-response.ts  # Standardized API responses
│   │   ├── error.ts         # Custom error classes
│   │   ├── logger.ts        # Logging utilities
│   │   └── helpers.ts       # Helper functions
│   │
│   ├── types/               # TypeScript type definitions
│   │   └── express.d.ts     # Extended Express types
│   │
│   └── server.ts            # Application entry point
│
├── prisma/                  # Database schema & migrations
│   ├── schema.prisma       # Prisma schema
│   └── migrations/         # Database migrations
│
├── scripts/                # Utility scripts
│   ├── seed.ts            # Database seeding
│   └── test-auth.ts       # Authentication testing
│
├── tests/                  # Test files
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
│
├── logs/                   # Application logs
├── dist/                   # Compiled JavaScript
├── .env.example           # Environment template
├── .env                   # Environment variables (gitignored)
├── package.json           # Dependencies & scripts
├── tsconfig.json          # TypeScript configuration
├── docker-compose.yml     # Docker configuration
└── README.md              # This file
```

---

## 🔒 Security Features

- JWT Authentication - Stateless token-based authentication
- Role-Based Access Control - Granular permissions system
- Password Hashing - Bcrypt with appropriate work factor
- Rate Limiting - Protection against brute force attacks
- CORS Configuration - Strict origin policies
- Input Validation - Zod schema validation on all endpoints
- SQL Injection Prevention - Prisma ORM with parameterized queries
- XSS Protection - Sanitized input/output
- CSRF Protection - State-changing operations require tokens
- Security Headers - Helmet.js for HTTP headers
- Logging & Monitoring - Audit trails for security events

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test
# Run tests with coverage
npm run test:coverage
# Run specific test suite
npm run test:auth
npm run test:users
```

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   │   └── auth.service.test.ts
│   └── utils/
│       └── api-response.test.ts
│
└── integration/
    ├── auth/
    │   └── signup.test.ts
    └── api/
        └── health.test.ts
```

---

## 📈 Deployment

### Deployment Platforms

- Vercel - Serverless deployment
- Railway - Easy database + app deployment
- AWS EC2/ECS - Full control deployment
- DigitalOcean App Platform - Simplified PaaS
- Heroku - Traditional PaaS (if still available)

### Environment Variables for Production

```env
NODE_ENV=production
PORT=8080
LOG_LEVEL=warn

# Use environment-specific Supabase project
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_prod_xxxx

# Use connection pooling in production
DATABASE_URL=postgresql://postgres:****@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Monitoring & Observability

- Logging - Winston with file/console transports
- Metrics - Prometheus metrics endpoint
- Health Checks - /api/health endpoint
- Error Tracking - Sentry integration (planned)
- APM - New Relic/DataDog integration (planned)

---

## 🤝 Contributing

We welcome contributions! Please see our Contributing Guidelines for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Use conventional commits
- Maintain backward compatibility

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

```
MIT License

Copyright (c) 2024 VAULT Backend Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

- Supabase for amazing authentication and database services
- Prisma for the excellent ORM experience
- Express.js team for the robust web framework
- TypeScript team for bringing types to JavaScript
- All contributors who help improve this project

---

## 📞 Support

For support, please:

- Check the Documentation Wiki
- Search existing Issues
- Create a new Issue if your problem isn't covered

<div align="center"> <p>Built with ❤️ by <a href="https://github.com/MirzaDanish786">Mirza M Danish Baig</a></p> <p>Star ⭐ this repository if you found it helpful!</p> </div>
