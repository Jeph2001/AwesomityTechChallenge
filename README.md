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
├── admin/            # Admin-only management APIs
├── auth/             # Authentication & JWT
├── users/            # User profile
├── sellers/          # Seller applications & registration
├── stores/           # Store domain
├── products/         # Product domain (incl. featured)
├── categories/       # Category domain
├── orders/           # Order domain
├── config/           # Environment configuration
├── database/         # TypeORM setup
├── mail/             # Nodemailer email service
├── rabbitmq/         # RabbitMQ client service
├── health/           # Health check endpoint
├── app.module.ts
└── main.ts
```

## Shopper APIs

### Public catalog
- `GET /api/products?search=&categoryId=` — browse/search products
- `GET /api/products/featured`
- `GET /api/products/:id`
- `GET /api/products/:id/reviews`
- `GET /api/categories`

### Authenticated shopper (`SHOPPER` role)
| Area | Endpoints |
|------|-----------|
| Orders | `POST/GET /api/shoppers/me/orders`, `GET .../:id` |
| Payments | `POST /api/shoppers/me/orders/:id/pay`, `GET .../:id/payments` |
| Reviews | `POST/GET/PATCH/DELETE /api/shoppers/me/reviews` |

#### Mock payments
- **Card** (`method: "card"`): 16-digit number ending in an **even** digit succeeds (e.g. `4242424242424242`). Odd digit fails.
- **Mobile money** (`method: "mobile_money"`): phone ending in `0-7` succeeds; `8` or `9` fails. Providers: `mtn`, `airtel`.
- Successful payment confirms the order (`pending` → `confirmed`).

Order status changes (admin/seller) email the shopper automatically.

## Seller APIs

### Public
- `POST /api/sellers/apply` — apply with email (optional name/business details)
- `POST /api/sellers/complete-registration` — create account (+ optional shop) after approval

### Authenticated seller (`SELLER` role)
| Area | Endpoints |
|------|-----------|
| Store | `GET/POST/PATCH /api/stores/me` (one store only) |
| Products | `GET/POST/PATCH/DELETE /api/sellers/me/products` |
| Orders | `GET /api/sellers/me/orders`, `GET .../:id`, `PATCH .../:id/status` |

## Admin Setup

```bash
npm run seed:admin
```

Default admin credentials:
- Email: `admin@awesomity.com`
- Password: `Admin123!`

## Seller Approval Flow

1. Applicant: `POST /api/sellers/apply`
2. Admin: `POST /api/admin/sellers/applications/:id/approve` (sends invite email)
3. Seller: `POST /api/sellers/complete-registration` with invite token, password, and store details

## Admin APIs (JWT + ADMIN role)

| Area | Endpoints |
|------|-----------|
| Users | `GET/PATCH/DELETE /api/admin/users` |
| Sellers | `GET /api/admin/sellers/applications`, approve/reject |
| Stores | `GET/POST/PATCH/DELETE /api/admin/stores` |
| Products | `GET/POST/PATCH/DELETE /api/admin/products`, `PATCH .../featured` |
| Orders | `GET/PATCH/DELETE /api/admin/orders` |
| Categories | `GET/POST/PATCH/DELETE /api/admin/categories` |

Full docs: http://localhost:3000/api/docs

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

## CI/CD (dev branch)

Push/merge to `dev` triggers `.github/workflows/deploy-dev.yml`:

1. Builds and pushes `ghcr.io/<owner>/awesomity-api:latest` (+ short SHA tag)
2. On **push** to `dev`, SSHs to the server, pulls the image, ensures Postgres + RabbitMQ, then restarts the API container

Required GitHub secrets:

| Secret | Purpose |
|--------|---------|
| `DEPLOYER_HOST` | Server IP/hostname |
| `DEPLOYER_USER` | SSH username |
| `DEPLOYER_KEY` | SSH private key |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Database |
| `RABBITMQ_USER` / `RABBITMQ_PASSWORD` / `RABBITMQ_QUEUE` | RabbitMQ |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Auth |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token TTL |
| `APP_BASE_URL` | Public API URL |
| `MAIL_*` | SMTP settings |
| `TYPEORM_SYNCHRONIZE` / `TYPEORM_LOGGING` | TypeORM flags (`true`/`false`) |

Package visibility: make the GHCR package public, or use a PAT with `read:packages` if private pulls fail on the server.
