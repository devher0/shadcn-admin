# SupaStack

Modern admin dashboard built with React, Vite, and Clerk authentication. Features comprehensive user management, health monitoring, and scalable architecture.

![alt text](public/images/shadcn-admin.png)

I've been creating dashboard UIs at work and for my personal projects. I always wanted to make a reusable collection of dashboard UI for future projects; and here it is now. While I've created a few custom components, some of the code is directly adapted from ShadcnUI examples.

> This is not a starter project (template) though. I'll probably make one in the future.

## Features

- Light/dark mode
- Responsive
- Accessible
- With built-in Sidebar component
- Global search command
- 10+ pages
- Extra custom components
- RTL support
- **Structured logging with JSON format**
- **Prometheus-style metrics collection**
- **Health checks with liveness and readiness probes**

<details>
<summary>Customized Components (click to expand)</summary>

This project uses Shadcn UI components, but some have been slightly modified for better RTL (Right-to-Left) support and other improvements. These customized components differ from the original Shadcn UI versions.

If you want to update components using the Shadcn CLI (e.g., `npx shadcn@latest add <component>`), it's generally safe for non-customized components. For the listed customized ones, you may need to manually merge changes to preserve the project's modifications and avoid overwriting RTL support or other updates.

> If you don't require RTL support, you can safely update the 'RTL Updated Components' via the Shadcn CLI, as these changes are primarily for RTL compatibility. The 'Modified Components' may have other customizations to consider.

### Modified Components

- scroll-area
- sonner
- separator

### RTL Updated Components

- alert-dialog
- calendar
- command
- dialog
- dropdown-menu
- select
- table
- sheet
- sidebar
- switch

**Notes:**

- **Modified Components**: These have general updates, potentially including RTL adjustments.
- **RTL Updated Components**: These have specific changes for RTL language support (e.g., layout, positioning).
- For implementation details, check the source files in `src/components/ui/`.
- All other Shadcn UI components in the project are standard and can be safely updated via the CLI.

</details>

## Tech Stack

**Frontend:** React 19 + Vite 7 + TypeScript 5

**UI:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)

**Routing:** [TanStack Router](https://tanstack.com/router/latest)

**State Management:** Zustand + TanStack Query

**Authentication:** [Clerk](https://clerk.com) (complete integration)

**Database:** PostgreSQL + Prisma ORM

**Logging & Monitoring:** Structured JSON logging, Prometheus metrics, health checks

**Forms & Validation:** React Hook Form + Zod

**Charts:** Recharts

**Tables:** TanStack Table v8

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- Supabase account (for database)
- Clerk account (for authentication)

### Setup

1. **Clone and install**
```bash
git clone https://github.com/your-org/supastack.git
cd supastack
pnpm install
```

2. **Configure environment**
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase and Clerk credentials
```

3. **Setup database**
```bash
pnpm run db:generate
pnpm run db:push
pnpm run db:seed
```

4. **Start development**
```bash
pnpm run dev:health
```

Visit `http://localhost:5173` to see the application.

## Health Checks & Monitoring

This project includes comprehensive health checks and monitoring capabilities:

### Quick Start

```bash
# Start both Vite dev server and health check server
pnpm run dev:health

# Or start health server only
pnpm run health-server
```

### Available Endpoints

- **Liveness Probe**: `GET /healthz` - Checks if application is alive
- **Readiness Probe**: `GET /readyz` - Checks if application is ready to serve traffic
- **Metrics**: `GET /metrics` - Prometheus-formatted metrics
- **Status**: `GET /status` - Server information

### Testing Health Checks

```bash
# Test liveness
curl http://localhost:3001/healthz

# Test readiness
curl http://localhost:3001/readyz

# Get metrics
curl http://localhost:3001/metrics

# Through Vite proxy
curl http://localhost:5173/healthz
```

### Simulate Issues

```bash
# Simulate unhealthy liveness
curl -X POST http://localhost:3001/simulate-unhealthy \
  -H "Content-Type: application/json" \
  -d '{"type": "liveness"}'

# Restore healthy state
curl -X POST http://localhost:3001/restore-healthy
```

For detailed documentation, see [HEALTH_CHECKS.md](HEALTH_CHECKS.md).

## Database & Authentication

### SupaStack Integration
- **Clerk Authentication**: Complete user management and authentication
- **Prisma ORM**: Type-safe database operations
- **UserProfile Model**: Links Clerk users to application data
- **RBAC**: Role-based access control with tenant isolation

### API Endpoints
- `GET /api/user-profiles` - Get current user profile
- `PUT /api/user-profiles` - Update user profile
- `GET /api/user-settings` - Get user settings
- `PUT /api/user-settings` - Update user settings

### Database Commands
```bash
pnpm run db:generate    # Generate Prisma client
pnpm run db:push        # Push schema to database
pnpm run db:migrate     # Create and apply migrations
pnpm run db:seed        # Seed database with sample data
pnpm run db:studio      # Open Prisma Studio
```

For detailed integration guide, see [SUPASTACK_INTEGRATION.md](SUPASTACK_INTEGRATION.md).

## Logging and Monitoring

This project includes comprehensive logging and monitoring capabilities:

### Features
- **Structured Logging**: JSON-formatted logs with trace IDs and context
- **Metrics Collection**: Prometheus-style metrics for monitoring
- **Health Checks**: Liveness and readiness probes for Kubernetes deployments
- **API Instrumentation**: Automatic HTTP request/response logging and metrics

### Usage

```typescript
import { logger, metrics, health } from '@/shared'

// Structured logging
logger.info('User created', { userId: '123', email: 'user@example.com' })
logger.error('Database error', { error: 'Connection timeout' })

// Metrics
metrics.counter('users_created_total', 1, { role: 'admin' })
metrics.gauge('active_users_count', 150)

// Health checks
health.registerReadiness('database', async () => db.ping())
```

### Documentation
See [src/shared/README.md](src/shared/README.md) for detailed documentation and examples.

## Sponsoring this project ❤️

If you find this project helpful or use this in your own work, consider [sponsoring me](https://github.com/sponsors/satnaing) to support development and maintenance. You can [buy me a coffee](https://buymeacoffee.com/satnaing) as well. Don't worry, every penny helps. Thank you! 🙏

For questions or sponsorship inquiries, feel free to reach out at [contact@satnaing.dev](mailto:contact@satnaing.dev).

### Current Sponsor

- [Clerk](https://go.clerk.com/GttUAaK) - for backing the implementation of Clerk in this project

## Author

Crafted with 🤍 by [@satnaing](https://github.com/satnaing)

## License

Licensed under the [MIT License](https://choosealicense.com/licenses/mit/)
