# Awesomity REST API

NestJS REST API with PostgreSQL, TypeORM, RabbitMQ, Swagger, and Nodemailer.

## Tech Stack

- **NestJS** — REST API framework
- **TypeORM** — PostgreSQL ORM
- **PostgreSQL** — Database (Docker)
- **RabbitMQ** — Message broker (Docker)
- **Swagger** — API documentation
- **Nodemailer** — Email sending

## Prerequisites

- Node.js 20+
- Docker & Docker Compose

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your settings (especially mail credentials when needed).

### 3. Start infrastructure

```bash
npm run docker:up
```

This starts:
- **PostgreSQL** on port `5433` (mapped from container port 5432)
- **RabbitMQ** on port `5672` (management UI on `15672`)

### 4. Run the API

```bash
# development
npm run start:dev

# production build
npm run build
npm run start:prod
```

### 5. Access the API

| Resource | URL |
|----------|-----|
| API base | http://localhost:3000/api |
| Swagger docs | http://localhost:3000/api/docs |
| Health check | http://localhost:3000/api/health |
| RabbitMQ UI | http://localhost:15672 (guest/guest) |

## Project Structure

```
src/
├── config/           # Environment configuration
├── database/         # TypeORM setup
├── mail/             # Nodemailer email service
├── rabbitmq/         # RabbitMQ client service
├── health/           # Health check endpoint
├── app.module.ts     # Root module
└── main.ts           # Bootstrap + Swagger
```

## Usage Examples

### Send an email

Inject `MailService` in any service:

```typescript
await this.mailService.sendMail({
  to: 'user@example.com',
  subject: 'Welcome',
  html: '<p>Hello!</p>',
});
```

### Publish to RabbitMQ

Inject `RabbitmqService` in any service:

```typescript
await this.rabbitmqService.emit('event.name', { data: 'payload' });
```

### Add a TypeORM entity

Create entities in `src/` and they are auto-loaded via `autoLoadEntities: true`.

## Docker Commands

```bash
npm run docker:up      # Start PostgreSQL & RabbitMQ
npm run docker:down    # Stop containers
npm run docker:logs    # View container logs
```
