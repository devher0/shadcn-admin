# Shared Modules - Logging, Metrics, and Health Checks

This directory contains shared modules for logging, metrics collection, and health checks that follow the conventions defined in `.cursor/rules/logs-metrics.mdc`.

## Modules

### 1. Logging Module (`./logging`)

A structured logging system with JSON output format, trace ID support, and context-aware logging.

#### Features:
- JSON-formatted log output
- Trace ID generation and propagation
- Context-aware logging with structured data
- Service-specific loggers
- Browser and Node.js compatibility

#### Usage:

```typescript
import { logger, createLogger } from '@/shared'

// Using default logger
logger.info('User created', { userId: '123', email: 'user@example.com' })
logger.error('Database connection failed', { error: 'Connection timeout' })
logger.warn('High memory usage detected', { memoryUsage: '85%' })
logger.debug('Processing request', { requestId: 'req-123' })

// Using context-aware logger
const userLogger = logger.withContext({ userId: '123', service: 'user-service' })
userLogger.info('User profile updated', { field: 'email' })

// Creating service-specific logger
const apiLogger = createLogger('api-service')
apiLogger.info('API request received', { method: 'POST', path: '/users' })

// Trace ID management
const traceId = logger.generateTraceId()
logger.setTraceId(traceId)
```

#### Log Format:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "shadcn-admin",
  "message": "User created",
  "context": {
    "userId": "123",
    "email": "user@example.com"
  },
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 2. Metrics Module (`./metrics`)

A Prometheus-style metrics collection system with HTTP instrumentation.

#### Features:
- Counter, gauge, and histogram metrics
- HTTP request/response metrics
- Prometheus-compatible output format
- Express/Fastify/Koa middleware support

#### Usage:

```typescript
import { metrics, httpMiddleware } from '@/shared'

// Recording metrics
metrics.counter('users_created_total', 1, { role: 'admin' })
metrics.gauge('active_users_count', 150)
metrics.histogram('request_duration_seconds', 0.5, { endpoint: '/api/users' })

// HTTP metrics (automatic with middleware)
app.use(httpMiddleware)

// Getting metrics in Prometheus format
const prometheusMetrics = metrics.getMetrics()
```

#### Metrics Endpoint:
```bash
GET /metrics
```

Example output:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/users",status="200"} 42
http_requests_total{method="POST",path="/api/users",status="201"} 15

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_sum 12.5
http_request_duration_seconds_count 57
http_request_duration_seconds_bucket{le="0.1"} 10
http_request_duration_seconds_bucket{le="0.5"} 35
http_request_duration_seconds_bucket{le="1"} 50
http_request_duration_seconds_bucket{le="+Inf"} 57
```

### 3. Health Checks Module (`./health`)

A comprehensive health check system with liveness and readiness probes.

#### Features:
- Liveness and readiness probes
- Configurable timeouts
- Structured health status responses
- Express/Fastify/Koa router support

#### Usage:

```typescript
import { health } from '@/shared'

// Register health checks
health.registerLiveness('app', async () => {
  // Check if application is alive
  return true
})

health.registerReadiness('database', async () => {
  // Check if database is ready
  return await db.ping()
})

health.registerReadiness('external-service', async () => {
  // Check if external service is available
  return await externalService.checkHealth()
})

// Using with Express
app.get('/healthz', health.getLivenessHandler())
app.get('/readyz', health.getReadinessHandler())
```

#### Health Check Endpoints:
```bash
GET /healthz  # Liveness probe
GET /readyz   # Readiness probe
```

Example response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "healthy",
      "duration": 45
    },
    "external-service": {
      "status": "healthy",
      "duration": 120
    }
  }
}
```

## Integration Examples

### 1. API Service with Full Integration

```typescript
import { logger, metrics } from '@/shared'
import { apiClient } from '@/lib/api/client'

class UserService {
  private serviceLogger = logger.withContext({ service: 'user-service' })

  async createUser(data: CreateUserRequest): Promise<User> {
    this.serviceLogger.info('Creating user', { email: data.email })
    
    try {
      const response = await apiClient.post<User>('/users', data)
      
      // Record metrics
      metrics.counter('user_created_total', 1, { role: data.role })
      
      this.serviceLogger.info('User created successfully', { 
        userId: response.id,
        email: response.email 
      })
      
      return response
    } catch (error) {
      this.serviceLogger.error('Failed to create user', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        email: data.email
      })
      throw error
    }
  }
}
```

### 2. Express Server with Middleware

```typescript
import express from 'express'
import { logger, metrics, health, httpMiddleware } from '@/shared'

const app = express()

// Add metrics middleware
app.use(httpMiddleware)

// Health check endpoints
app.get('/healthz', health.getLivenessHandler())
app.get('/readyz', health.getReadinessHandler())

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send(metrics.getMetrics())
})

// Register health checks
health.registerReadiness('database', async () => db.ping())
health.registerReadiness('redis', async () => redis.ping())
```

### 3. React Component with Logging

```typescript
import { useEffect } from 'react'
import { logger } from '@/shared'

export function UserProfile({ userId }: { userId: string }) {
  useEffect(() => {
    logger.info('User profile component mounted', { userId })
    
    return () => {
      logger.debug('User profile component unmounted', { userId })
    }
  }, [userId])

  const handleUpdate = async (data: UpdateUserData) => {
    logger.info('Updating user profile', { userId, fields: Object.keys(data) })
    
    try {
      await updateUser(userId, data)
      logger.info('User profile updated successfully', { userId })
    } catch (error) {
      logger.error('Failed to update user profile', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  return <div>User Profile Component</div>
}
```

## Environment Variables

Recommended environment variables for production:

```bash
# Metrics
METRICS_ENABLED=true
METRICS_ENDPOINT=/metrics

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Health Checks
HEALTH_CHECK_TIMEOUT=5000
```

## Best Practices

1. **Always use structured logging** with context objects
2. **Include trace IDs** for request tracing
3. **Record metrics for all important operations**
4. **Register health checks for all dependencies**
5. **Use service-specific loggers** for better organization
6. **Validate input data** before logging or processing
7. **Handle errors gracefully** with proper logging
8. **Use appropriate log levels** (debug, info, warn, error)

## Testing

The modules include comprehensive error handling and are designed to work in both browser and Node.js environments. All logging operations are safe and won't throw errors that could break your application.

## Migration from console.log

Replace console.log statements with structured logging:

```typescript
// Before
console.log('User created:', user)
console.error('Database error:', error)

// After
logger.info('User created', { userId: user.id, email: user.email })
logger.error('Database error', { error: error.message, stack: error.stack })
```
