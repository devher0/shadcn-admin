import express from 'express'
import cors from 'cors'
import { health, logger, metrics } from '../src/shared'
import { prisma } from '../src/lib/database/client'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Health check endpoints
app.get('/healthz', async (req, res) => {
  logger.info('Healthz endpoint called')
  try {
    const result = await health.checkLiveness()
    logger.info('Healthz check completed', { status: result.status, checkCount: result.checks.length })
    res.json(result)
  } catch (error) {
    logger.error('Healthz check failed', { error: error instanceof Error ? error.message : 'Unknown error' })
    res.status(500).json({ error: 'Health check failed' })
  }
})

app.get('/readyz', async (req, res) => {
  logger.info('Readyz endpoint called')
  try {
    const result = await health.checkReadiness()
    logger.info('Readyz check completed', { status: result.status, checkCount: result.checks.length })
    res.json(result)
  } catch (error) {
    logger.error('Readyz check failed', { error: error instanceof Error ? error.message : 'Unknown error' })
    res.status(500).json({ error: 'Readiness check failed' })
  }
})

app.get('/metrics', (req, res) => {
  logger.info('Metrics endpoint called')
  try {
    const metricsData = metrics.getMetrics()
    logger.info('Metrics endpoint completed', { metricsLength: metricsData.length })
    res.set('Content-Type', 'text/plain')
    res.send(metricsData)
  } catch (error) {
    logger.error('Metrics endpoint failed', { error: error instanceof Error ? error.message : 'Unknown error' })
    res.status(500).json({ error: 'Metrics failed' })
  }
})

// API endpoints for user profiles with real database
app.get('/api/user-profiles', async (req, res) => {
  logger.info('GET /api/user-profiles called')
  
  try {
    // Get all user profiles from database
    const userProfiles = await prisma.userProfile.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    logger.info('Retrieved user profiles from database', { count: userProfiles.length })
    res.json(userProfiles)
  } catch (error) {
    logger.error('Failed to get user profiles', { error: error instanceof Error ? error.message : 'Unknown error' })
    res.status(500).json({ error: 'Failed to get user profiles' })
  }
})

app.post('/api/user-profiles', async (req, res) => {
  logger.info('POST /api/user-profiles called', { body: req.body })
  
  const { clerkUserId, displayName, email, avatar } = req.body
  
  if (!clerkUserId) {
    return res.status(400).json({ error: 'clerkUserId is required' })
  }

  try {
    // Check if user profile already exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { clerkUserId }
    })

    if (existingProfile) {
      logger.info('User profile already exists', { 
        profileId: existingProfile.id,
        clerkUserId: existingProfile.clerkUserId 
      })
      return res.json(existingProfile)
    }

    // Create new user profile in database
    const newUserProfile = await prisma.userProfile.create({
      data: {
        clerkUserId,
        displayName: displayName || 'New User',
        role: 'USER',
        avatar: avatar || null,
        email: email || null,
      }
    })

    logger.info('User profile created successfully in database', { 
      profileId: newUserProfile.id,
      clerkUserId: newUserProfile.clerkUserId 
    })
    
    res.status(201).json(newUserProfile)
  } catch (error) {
    logger.error('Failed to create user profile', { error: error instanceof Error ? error.message : 'Unknown error' })
    res.status(500).json({ error: 'Failed to create user profile' })
  }
})

app.put('/api/user-profiles/:id', async (req, res) => {
  const { id } = req.params
  logger.info('PUT /api/user-profiles called', { id, body: req.body })
  
  const { displayName, email, avatar, role } = req.body

  try {
    const updatedProfile = await prisma.userProfile.update({
      where: { id },
      data: {
        displayName,
        email,
        avatar,
        role,
        updatedAt: new Date()
      }
    })

    logger.info('User profile updated successfully in database', { profileId: updatedProfile.id })
    res.json(updatedProfile)
  } catch (error) {
    logger.error('Failed to update user profile', { error: error instanceof Error ? error.message : 'Unknown error' })
    res.status(500).json({ error: 'Failed to update user profile' })
  }
})

// Get user profile by clerkUserId
app.get('/api/user-profiles/clerk/:clerkUserId', async (req, res) => {
  const { clerkUserId } = req.params
  logger.info('GET /api/user-profiles/clerk called', { clerkUserId })
  
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { clerkUserId }
    })
    
    if (!userProfile) {
      logger.info('User profile not found', { clerkUserId })
      return res.status(404).json({ error: 'User profile not found' })
    }
    
    logger.info('Retrieved user profile from database', { profileId: userProfile.id })
    res.json(userProfile)
  } catch (error) {
    logger.error('Failed to get user profile', { error: error instanceof Error ? error.message : 'Unknown error' })
    res.status(500).json({ error: 'Failed to get user profile' })
  }
})

// Simulation endpoints
app.post('/simulate-unhealthy', (req, res) => {
  logger.info('Simulating unhealthy state')
  // Note: Health simulation methods not implemented yet
  res.json({ message: 'Unhealthy state simulation not implemented' })
})

app.post('/restore-healthy', (req, res) => {
  logger.info('Restoring healthy state')
  // Note: Health restoration methods not implemented yet
  res.json({ message: 'Healthy state restoration not implemented' })
})

app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/healthz',
      readiness: '/readyz',
      metrics: '/metrics',
      api: '/api/*'
    }
  })
})

app.listen(PORT, () => {
  logger.info(`Health check server running on http://localhost:${PORT}`)
  console.log(`Health check server running on http://localhost:${PORT}`)
  console.log('Available endpoints:')
  console.log('  GET  /healthz - Liveness probe')
  console.log('  GET  /readyz - Readiness probe')
  console.log('  GET  /metrics - Prometheus metrics')
  console.log('  POST /simulate-unhealthy - Simulate unhealthy state')
  console.log('  POST /restore-healthy - Restore healthy state')
  console.log('  GET  /status - Server status')
  console.log('  GET  /api/user-profiles - Get all user profiles')
  console.log('  POST /api/user-profiles - Create user profile')
  console.log('  PUT  /api/user-profiles/:id - Update user profile')
  console.log('  GET  /api/user-profiles/clerk/:clerkUserId - Get user profile by Clerk ID')
})
