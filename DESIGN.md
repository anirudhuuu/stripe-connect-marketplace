# Stripe Marketplace POC - Design Document

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Contracts](#api-contracts)
4. [Stripe Integration](#stripe-integration)
5. [Authentication & Security](#authentication--security)
6. [Error Handling](#error-handling)
7. [POC Essentials & Error Handling](#poc-essentials--error-handling)
8. [Development & Setup](#development--setup)
9. [Docker Configuration](#docker-configuration)
10. [Testing Strategy (POC)](#testing-strategy-poc)
11. [Monitoring & Logging](#monitoring--logging)

## System Architecture

### Overview

The marketplace follows a modern web application architecture with:

- **Frontend**: React SPA with shadcn/ui components
- **Backend**: Node.js/Express REST API
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Firebase Auth with Google Sign-In
- **Payments**: Stripe Connect Express + Stripe Checkout
- **Development**: Docker-based development environment

### Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Express Backend│    │   PostgreSQL    │
│                 │    │                 │    │   (Docker)      │
│ - shadcn/ui     │◄──►│ - REST API      │◄──►│ - Prisma ORM    │
│ - Tailwind CSS  │    │ - Webhooks      │    │ - User data     │
│ - Firebase Auth │    │ - Stripe SDK    │    │ - Marketplace   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     Stripe      │
                       │                 │
                       │ - Connect       │
                       │ - Checkout      │
                       │ - Webhooks      │
                       │ - Transfers     │
                       └─────────────────┘
```

### Docker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Frontend      │    Backend      │      Database           │
│   (React)       │   (Node.js)     │    (PostgreSQL)         │
│   Port: 3000    │   Port: 5000    │    Port: 5432          │
│                 │                 │                         │
│ - shadcn/ui     │ - Express API   │ - Persistent volume    │
│ - Tailwind CSS  │ - Prisma ORM    │ - Initial migrations   │
│ - Vite dev      │ - Stripe SDK    │ - Seed data             │
│ - Hot reload    │ - Webhooks      │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Database Schema

### Core Tables

The database consists of the following core entities:

### Critical Indexes (POC Performance)

```sql
-- Performance indexes for POC
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sellers_user_id ON sellers(user_id);
CREATE INDEX idx_sellers_stripe_account_id ON sellers(stripe_account_id);
CREATE INDEX idx_spaces_seller_id ON spaces(seller_id);
CREATE INDEX idx_spaces_slug ON spaces(slug);
CREATE INDEX idx_offerings_space_id ON offerings(space_id);
CREATE INDEX idx_offerings_stripe_product_id ON offerings(stripe_product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_offering_id ON orders(offering_id);
CREATE INDEX idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
```

#### Users

```sql
users (
  id: UUID (PK)
  firebase_uid: String (unique)
  email: String (unique)
  name: String
  avatar_url: String?
  role: ENUM('USER', 'SELLER', 'ADMIN')
  stripe_customer_id: String?
  is_active: Boolean (default: true)
  email_verified: Boolean (default: false)
  last_login_at: DateTime?
  created_at: DateTime
  updated_at: DateTime
)
```

#### Sellers

```sql
sellers (
  id: UUID (PK)
  user_id: UUID (FK -> users.id)
  stripe_account_id: String (unique)
  business_name: String
  business_description: String?
  business_email: String?
  business_phone: String?
  business_address: Json?
  status: ENUM('PENDING', 'ACTIVE', 'SUSPENDED')
  onboarding_completed: Boolean (default: false)
  stripe_account_status: String?
  verification_status: ENUM('UNVERIFIED', 'PENDING', 'VERIFIED')
  created_at: DateTime
  updated_at: DateTime
)
```

#### Spaces

```sql
spaces (
  id: UUID (PK)
  seller_id: UUID (FK -> sellers.id)
  name: String
  description: String?
  slug: String (unique)
  cover_image_url: String?
  is_active: Boolean (default: true)
  is_featured: Boolean (default: false)
  created_at: DateTime
  updated_at: DateTime
)
```

#### Offerings

```sql
offerings (
  id: UUID (PK)
  space_id: UUID (FK -> spaces.id)
  name: String
  description: String?
  price: Decimal (cents)
  currency: ENUM('USD', 'CAD')
  stripe_product_id: String?
  stripe_price_id: String?
  image_url: String?
  is_active: Boolean (default: true)
  is_featured: Boolean (default: false)
  stock_quantity: Int? (for physical products)
  created_at: DateTime
  updated_at: DateTime
)
```

#### Orders

```sql
orders (
  id: UUID (PK)
  user_id: UUID (FK -> users.id)
  offering_id: UUID (FK -> offerings.id)
  stripe_session_id: String (unique)
  stripe_payment_intent_id: String?
  amount: Decimal (cents)
  currency: ENUM('USD', 'CAD')
  status: ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED')
  payment_method: String?
  billing_details: Json?
  metadata: Json?
  created_at: DateTime
  updated_at: DateTime
)
```

#### Payouts

```sql
payouts (
  id: UUID (PK)
  seller_id: UUID (FK -> sellers.id)
  order_id: UUID (FK -> orders.id)
  stripe_transfer_id: String?
  amount: Decimal (cents)
  fee_amount: Decimal (cents)
  net_amount: Decimal (cents)
  platform_fee_percentage: Decimal (default: 10.0)
  status: ENUM('PENDING', 'APPROVED', 'PROCESSED', 'FAILED', 'REJECTED')
  processed_at: DateTime?
  approved_by: UUID (FK -> users.id)?
  approved_at: DateTime?
  notes: String?
  created_at: DateTime
  updated_at: DateTime
)
```

#### WebhookEvents

```sql
webhook_events (
  id: UUID (PK)
  stripe_event_id: String (unique)
  event_type: String
  event_data: Json
  processed: Boolean (default: false)
  error_message: String?
  created_at: DateTime
  processed_at: DateTime?
)
```

## API Contracts

### Authentication

```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Users

```
GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### Sellers

```
GET    /api/sellers
POST   /api/sellers
GET    /api/sellers/:id
PUT    /api/sellers/:id
POST   /api/sellers/:id/stripe-connect
GET    /api/sellers/:id/dashboard
```

### Spaces

```
GET    /api/spaces
POST   /api/spaces
GET    /api/spaces/:id
PUT    /api/spaces/:id
DELETE /api/spaces/:id
GET    /api/spaces/:slug/offerings
```

### Offerings

```
GET    /api/offerings
POST   /api/offerings
GET    /api/offerings/:id
PUT    /api/offerings/:id
DELETE /api/offerings/:id
POST   /api/offerings/:id/purchase
```

### Orders

```
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders/:id/confirm
```

### Payouts

```
GET    /api/payouts
POST   /api/payouts/:id/approve
POST   /api/payouts/:id/reject
```

### Webhooks

```
POST   /api/webhooks/stripe
```

**Critical Implementation Details:**
- Webhook signature verification (required by Stripe)
- Idempotency handling to prevent duplicate processing
- Error logging and retry logic for failed webhooks
- Event type filtering and validation

### Admin

```
GET    /api/admin/dashboard
GET    /api/admin/users
GET    /api/admin/sellers
GET    /api/admin/orders
GET    /api/admin/payouts
```

## Stripe Integration

### Stripe Connect Express Flow

1. **Seller Registration**: Create Stripe Connect Express account
2. **Onboarding**: Redirect to Stripe hosted onboarding
3. **Account Activation**: Webhook notification when account is ready
4. **Payouts**: Server-side transfers to connected accounts

### Stripe Checkout Flow

1. **Product Creation**: Create Stripe products/prices for offerings
2. **Checkout Session**: Create session with success/cancel URLs
3. **Payment Processing**: Handle webhook events
4. **Order Confirmation**: Update order status and create payout record

### Webhook Events

- `account.updated` - Seller account status changes
- `checkout.session.completed` - Payment successful
- `payment_intent.succeeded` - Payment confirmed
- `payment_intent.payment_failed` - Payment failed

### Critical Implementation Requirements

- **Webhook Signature Verification**: Must verify `stripe-signature` header
- **Idempotency**: Use `stripe_event_id` to prevent duplicate processing
- **Error Handling**: Log failed webhooks and implement retry logic
- **Event Filtering**: Only process relevant event types
- **Database Transactions**: Wrap webhook processing in transactions

### Fee Structure

- **Platform Fee**: 10% of transaction amount
- **Processing Fee**: Stripe's standard fees (2.9% + 30¢)
- **Seller Payout**: Transaction amount - platform fee - processing fee

## Authentication & Security

### Firebase Auth Integration

- Google Sign-In only
- JWT token validation on backend
- Role-based access control (RBAC)
- Session management

### Security Measures

- **API Security**:

  - JWT token validation
  - Rate limiting
  - CORS configuration
  - Input validation and sanitization

- **Stripe Security**:

  - Webhook signature verification
  - Idempotency keys
  - Server-side only operations
  - No sensitive data storage

- **Database Security**:

  - Prepared statements (Prisma)
  - Row-level security
  - Encrypted connections
  - Regular backups

- **Environment Security**:
  - Environment variables for secrets
  - No hardcoded credentials
  - Secure deployment practices

### Data Privacy

- GDPR compliance considerations
- Minimal data collection
- Secure data transmission
- User data deletion capabilities

## Error Handling

### API Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {...}
  }
}
```

### Common Error Codes

- `AUTHENTICATION_ERROR` - Invalid/missing token
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `STRIPE_ERROR` - Stripe API errors
- `INTERNAL_ERROR` - Server errors

## POC Essentials & Error Handling

### Critical Error Handling

- **Stripe API Error Handling**: Try-catch blocks around all Stripe operations
- **Webhook Signature Verification**: Required for Stripe security
- **Database Connection Handling**: Basic connection failure recovery
- **Input Validation**: Basic validation to prevent crashes (price > 0, required fields)
- **Graceful Degradation**: App continues working even if Stripe is down

### Basic Security (POC Level)

- **JWT Token Validation**: Simple middleware for protected routes
- **Webhook Security**: Stripe signature verification (required)
- **Basic Input Sanitization**: Prevent SQL injection and XSS
- **Environment Variables**: Secure handling of API keys

### Database Essentials

- **Basic Indexes**: Foreign key indexes for performance
- **Connection Pooling**: Simple connection management
- **Basic Constraints**: NOT NULL, basic data validation
- **Transaction Boundaries**: Simple transaction handling for critical operations
- **Data Integrity**: Foreign key constraints and unique constraints
- **Migration Strategy**: Prisma migrations with rollback capability

## Development & Setup

### Project Structure

```
stripe-marketplace/
├── docker-compose.yml          # Main Docker orchestration
├── .env.example               # Environment template
├── .env                       # Local environment (gitignored)
├── frontend/                  # React application
│   ├── Dockerfile            # Frontend container
│   ├── package.json          # Frontend dependencies
│   ├── src/                  # React source code
│   └── public/               # Static assets
├── backend/                   # Node.js API
│   ├── Dockerfile            # Backend container
│   ├── package.json          # Backend dependencies
│   ├── src/                  # API source code
│   ├── prisma/               # Database schema & migrations
│   └── docker-entrypoint.sh  # Database initialization
└── database/                  # Database setup
    ├── init.sql              # Initial schema
    └── seed.sql              # Sample data
```

### Environment Variables (.env)

```bash
# Database (Docker)
DATABASE_URL="postgresql://postgres:password@db:5432/marketplace"

# Firebase
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL="your-client-email"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_CONNECT_CLIENT_ID="ca_..."

# App
JWT_SECRET="your-jwt-secret"
PORT=5000
NODE_ENV="development"

# Frontend
VITE_API_URL="http://localhost:5000"
```

### Docker Development Setup

1. **Prerequisites**: Install Docker and Docker Compose
2. **Firebase**: Create project and get service account
3. **Stripe**: Create test account and get API keys
4. **Environment**: Copy `.env.example` and fill in values
5. **Start Everything**: `docker-compose up -d`
6. **Database**: Auto-migrated and seeded on first run
7. **Access**: Frontend (http://localhost:3000), Backend (http://localhost:5000)

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Reset database (removes all data)
docker-compose down -v && docker-compose up -d

# Access database directly
docker-compose exec db psql -U postgres -d marketplace
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:5000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/marketplace
    depends_on:
      - db
    command: ["sh", "-c", "npm run migrate && npm run seed && npm run dev"]

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=marketplace
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/seed.sql

volumes:
  postgres_data:
```

## Docker Configuration

### Dockerfile Examples

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]
```

## Testing Strategy (POC)

### Basic Testing

- **API Testing**: Postman/Insomnia collections for endpoint testing
- **Database Testing**: Prisma Studio for data validation
- **Stripe Testing**: Test mode with webhook forwarding
- **Frontend Testing**: Manual testing with browser dev tools

### Test Data

- **Seed Data**: Sample users, sellers, spaces, and offerings
- **Test Accounts**: Stripe test accounts for payment testing
- **Mock Data**: Firebase auth emulator for development

## Monitoring & Logging

### Application Monitoring

- Basic console logging for development
- Error logging with stack traces
- Request/response logging for debugging
- Stripe webhook event logging

### Business Metrics

- Transaction volume tracking
- Revenue calculations
- Seller performance metrics
- User engagement analytics
```
