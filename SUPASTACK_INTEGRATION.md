# SupaStack Integration Guide

This document describes the integration of SupaStack with Clerk authentication and Prisma database.

## Architecture Overview

SupaStack uses a hybrid authentication approach:
- **Clerk**: Handles authentication, user management, and sessions
- **Prisma + PostgreSQL**: Stores business logic, user profiles, and application data
- **UserProfile**: Links Clerk users to application data via `clerkUserId`

## Database Schema

### Core Models

#### UserProfile
```prisma
model UserProfile {
  id           String   @id @default(cuid())
  clerkUserId  String   @unique  // Links to Clerk user
  displayName  String?
  role         String   @default("USER")
  avatar       String?
  email        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  sessions    Session[]
  activities  Activity[]
  settings    UserSettings?
  memberships UserTenantMembership[]
}
```

#### Tenant & RBAC
```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  // ... relations
}

model UserTenantMembership {
  id       String   @id @default(cuid())
  userId   String
  tenantId String
  role     String   @default("MEMBER") // OWNER, ADMIN, MEMBER
  // ... relations
}
```

## Authentication Flow

### 1. User Signs In via Clerk
```typescript
// Clerk handles authentication
const { userId } = await auth()
```

### 2. Get or Create UserProfile
```typescript
// Automatically create UserProfile if doesn't exist
const userProfile = await UserProfileService.getOrCreateUserProfile(userId, {
  displayName: user.displayName,
  email: user.email,
  avatar: user.avatar,
})
```

### 3. API Authentication
```typescript
// Use middleware for API routes
const authenticatedRequest = await withClerkAuth(request)
const user = getCurrentUser(authenticatedRequest)

// Check permissions
requireAdmin(authenticatedRequest)
```

## API Endpoints

### User Profile Management
- `GET /api/user-profiles` - Get current user profile
- `PUT /api/user-profiles` - Update current user profile
- `POST /api/user-profiles` - List all users (admin only)

### User Settings
- `GET /api/user-settings` - Get user settings
- `PUT /api/user-settings` - Update user settings

## Environment Variables

Create `.env.local` with:

```bash
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_[YOUR-KEY]"
CLERK_SECRET_KEY="sk_test_[YOUR-KEY]"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# App
SUPASTACK_APP_URL="http://localhost:5173"
```

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm add @prisma/client
pnpm add -D prisma
```

### 2. Initialize Database
```bash
# Generate Prisma client
pnpm run db:generate

# Push schema to database (development)
pnpm run db:push

# Or create migrations (production)
pnpm run db:migrate

# Seed database
pnpm run db:seed
```

### 3. Configure Clerk
1. Create Clerk application
2. Add environment variables
3. Configure sign-in/sign-up URLs

### 4. Test Integration
```bash
# Start development server
pnpm run dev:health

# Test health checks
curl http://localhost:5173/healthz
curl http://localhost:5173/readyz
```

## Security Considerations

### 1. Authentication
- Never store passwords in database
- Always use Clerk for authentication
- Validate `clerkUserId` in all operations

### 2. Authorization
- Use role-based access control (RBAC)
- Implement tenant isolation
- Validate permissions on all API endpoints

### 3. Data Protection
- Use Zod for input validation
- Implement proper error handling
- Log all sensitive operations

## Development Workflow

### 1. Database Changes
```bash
# Make schema changes
# Edit prisma/schema.prisma

# Generate migration
pnpm run db:migrate

# Apply to database
pnpm run db:push
```

### 2. API Development
```typescript
// Always use Clerk middleware
const authenticatedRequest = await withClerkAuth(request)
const user = getCurrentUser(authenticatedRequest)

// Validate input
const validatedData = Schema.parse(body)

// Check permissions
requireAdmin(authenticatedRequest)
```

### 3. Testing
```bash
# Run database tests
pnpm run db:studio

# Test API endpoints
curl -H "Authorization: Bearer [TOKEN]" http://localhost:5173/api/user-profiles
```

## Monitoring & Health Checks

### Database Health
```typescript
health.registerReadiness('database', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    return false
  }
}, 5000)
```

### Activity Logging
```typescript
await UserProfileService.logActivity(
  clerkUserId,
  'LOGIN',
  'User authenticated via API'
)
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` environment variable
   - Verify Supabase project is active
   - Check network connectivity

2. **Clerk Authentication Failed**
   - Verify Clerk environment variables
   - Check Clerk application configuration
   - Ensure proper CORS settings

3. **UserProfile Not Found**
   - Check if user exists in Clerk
   - Verify `clerkUserId` is correct
   - Run database seed if needed

### Debug Commands
```bash
# Check database connection
pnpm run db:studio

# View logs
tail -f logs/app.log

# Test health checks
curl http://localhost:3001/healthz
```

## Production Deployment

### 1. Database Setup
```bash
# Apply migrations
pnpm run db:migrate:deploy

# Seed production data
pnpm run db:seed
```

### 2. Environment Configuration
- Set production environment variables
- Configure Clerk for production domain
- Set up proper SSL certificates

### 3. Monitoring
- Enable health checks
- Set up logging aggregation
- Configure error tracking

## Best Practices

1. **Always validate input** with Zod schemas
2. **Use proper error handling** and logging
3. **Implement RBAC** for all operations
4. **Test thoroughly** before deployment
5. **Monitor performance** and errors
6. **Keep dependencies updated**
7. **Document API changes**
8. **Use TypeScript strictly**
