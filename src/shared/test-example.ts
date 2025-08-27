import { logger, metrics, health } from '@/shared'

// Example function to demonstrate logging and metrics
export function demonstrateLoggingAndMetrics() {
  // Generate a trace ID for this operation
  const traceId = logger.generateTraceId()
  logger.setTraceId(traceId)
  
  logger.info('Starting demonstration of logging and metrics', { 
    traceId,
    timestamp: new Date().toISOString()
  })

  // Demonstrate different log levels
  logger.debug('Debug information', { 
    operation: 'demonstration',
    step: 'logging'
  })

  logger.info('User action performed', { 
    action: 'button_click',
    component: 'UserProfile',
    userId: '12345'
  })

  logger.warn('High memory usage detected', { 
    memoryUsage: '85%',
    threshold: '80%'
  })

  // Demonstrate metrics
  metrics.counter('demo_operations_total', 1, { type: 'logging_demo' })
  metrics.gauge('demo_memory_usage', 85, { unit: 'percent' })
  metrics.histogram('demo_operation_duration', 0.5, { operation: 'logging_demo' })

  // Demonstrate context-aware logging
  const userLogger = logger.withContext({ 
    userId: '12345', 
    sessionId: 'session-abc123',
    traceId 
  })

  userLogger.info('User profile updated', { 
    field: 'email',
    oldValue: 'old@example.com',
    newValue: 'new@example.com'
  })

  // Demonstrate error logging
  try {
    throw new Error('Simulated error for demonstration')
  } catch (error) {
    logger.error('Error occurred during demonstration', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      traceId
    })
    
    // Record error metrics
    metrics.counter('demo_errors_total', 1, { type: 'simulated_error' })
  }

  // Demonstrate health check registration
  health.registerLiveness('demo', async () => {
    logger.debug('Running demo liveness check')
    return true
  })

  health.registerReadiness('demo-service', async () => {
    logger.debug('Running demo readiness check')
    // Simulate a service check
    await new Promise(resolve => setTimeout(resolve, 100))
    return true
  })

  logger.info('Demonstration completed successfully', { 
    traceId,
    metricsRecorded: 4,
    healthChecksRegistered: 2
  })

  return {
    traceId,
    metrics: metrics.getMetrics(),
    healthStatus: 'demonstration_completed'
  }
}

// Example of using the API client with logging and metrics
export async function demonstrateApiClient() {
  const { apiClient } = await import('@/lib/api/client')
  const { usersService } = await import('@/lib/api/users-service')

  logger.info('Starting API client demonstration')

  try {
    // This would make a real API call in a real application
    // For demonstration, we'll just log the attempt
    logger.info('Attempting to fetch users', { page: 1, limit: 10 })
    
    // In a real app, this would be:
    // const users = await usersService.getUsers(1, 10)
    
    logger.info('API client demonstration completed')
  } catch (error) {
    logger.error('API client demonstration failed', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Export for use in development/testing
export { logger, metrics, health }
