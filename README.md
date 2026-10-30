# PenniWise

Nigeria's First WhatsApp-Native Investment Platform

## Overview

PenniWise is an AI-powered investment and savings platform that runs entirely on WhatsApp. Users can trade NGX-listed equities, open savings wallets, and receive personalized investment insights — all through a conversational interface they already use daily.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express 5
- **Language:** TypeScript 6
- **Database:** PostgreSQL 16 (via Docker)
- **ORM:** Prisma 7
- **Cache:** Redis 7
- **Validation:** Zod
- **Logging:** Winston
- **Security:** Helmet, CORS, Rate Limiting

## Project Structure

```
PenniWise/
├── server/
│   ├── src/
│   │   ├── config/         # Environment, database, Redis, logger
│   │   ├── controller/     # Request handlers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility classes
│   │   ├── app.ts          # Express app setup
│   │   └── server.ts       # Entry point with graceful shutdown
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── docs/               # Planning & architecture docs
│   ├── docker-compose.yml  # PostgreSQL + Redis
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd PenniWise

# Navigate to server
cd server

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start PostgreSQL and Redis
docker compose up -d

# Run database migrations
pnpm prisma migrate dev

# Start development server
pnpm dev
```

### Environment Variables

| Variable       | Description                  | Default       |
| -------------- | ---------------------------- | ------------- |
| `PORT`         | Server port                  | `3000`        |
| `NODE_ENV`     | Environment                  | `development` |
| `DATABASE_URL` | PostgreSQL connection string | -             |
| `REDIS_URL`    | Redis connection string      | -             |


## Database

```bash
# Start database
docker compose up -d

# Run migrations
pnpm prisma migrate dev

# Generate Prisma client
pnpm prisma generate

# Open Prisma Studio
pnpm prisma studio
```

## License

ISC
