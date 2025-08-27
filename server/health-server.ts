import express from 'express'
import cors from 'cors'
import { health, logger, metrics } from '../src/shared'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check endpoints
app.get('/healthz', async (req, res) => {
  try {
    logger.info('Healthz endpoint called')
    const status = await health.checkLiveness()
    
    logger.info('Healthz check completed', { 
      status: status.status,
      checkCount: Object.keys(status.checks).length 
    })
    
    res.status(status.status === 'healthy' ? 200 : 503).json(status)
  } catch (error) {
    logger.error('Healthz check failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error'
    })
  }
})

app.get('/readyz', async (req, res) => {
  try {
    logger.info('Readyz endpoint called')
    const status = await health.checkReadiness()
    
    logger.info('Readyz check completed', { 
      status: status.status,
      checkCount: Object.keys(status.checks).length 
    })
    
    res.status(status.status === 'healthy' ? 200 : 503).json(status)
  } catch (error) {
    logger.error('Readyz check failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error'
    })
  }
})

// Metrics endpoint
app.get('/metrics', (req, res) => {
  try {
    logger.info('Metrics endpoint called')
    
    const prometheusMetrics = metrics.getMetrics()
    
    logger.info('Metrics endpoint completed', { 
      metricsLength: prometheusMetrics.length 
    })
    
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
    res.send(prometheusMetrics)
  } catch (error) {
    logger.error('Metrics endpoint failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    
    res.status(500).send('# Error generating metrics')
  }
})

// Test endpoint to simulate unhealthy state
app.post('/simulate-unhealthy', (req, res) => {
  const { type } = req.body
  
  logger.info('Simulating unhealthy state', { type })
  
  if (type === 'liveness') {
    health.registerLiveness('test-failure', async () => {
      logger.warn('Simulated liveness check failure')
      return false
    })
  } else if (type === 'readiness') {
    health.registerReadiness('test-failure', async () => {
      logger.warn('Simulated readiness check failure')
      return false
    })
  }
  
  res.json({ message: `Simulated ${type} unhealthy state` })
})

// Test endpoint to restore healthy state
app.post('/restore-healthy', (req, res) => {
  logger.info('Restoring healthy state')
  
  health.registerLiveness('test-failure', async () => {
    logger.debug('Restored liveness check')
    return true
  })
  
  health.registerReadiness('test-failure', async () => {
    logger.debug('Restored readiness check')
    return true
  })
  
  res.json({ message: 'Restored healthy state' })
})

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    server: 'Health Check Server',
    port: PORT,
    endpoints: {
      '/healthz': 'Liveness probe',
      '/readyz': 'Readiness probe',
      '/metrics': 'Prometheus metrics',
      '/simulate-unhealthy': 'POST to simulate unhealthy state',
      '/restore-healthy': 'POST to restore healthy state'
    }
  })
})

app.listen(PORT, () => {
  logger.info(`Health check server running on http://localhost:${PORT}`)
  console.log(`Health check server running on http://localhost:${PORT}`)
  console.log(`Available endpoints:`)
  console.log(`  GET  /healthz - Liveness probe`)
  console.log(`  GET  /readyz - Readiness probe`)
  console.log(`  GET  /metrics - Prometheus metrics`)
  console.log(`  POST /simulate-unhealthy - Simulate unhealthy state`)
  console.log(`  POST /restore-healthy - Restore healthy state`)
  console.log(`  GET  /status - Server status`)
})
