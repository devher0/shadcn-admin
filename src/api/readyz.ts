import { health, logger } from '@/shared'

export async function GET() {
  try {
    logger.info('Readyz endpoint called')
    const status = await health.checkReadiness()
    
    logger.info('Readyz check completed', { 
      status: status.status,
      checkCount: Object.keys(status.checks).length 
    })
    
    return new Response(JSON.stringify(status), {
      status: status.status === 'healthy' ? 200 : 503,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    logger.error('Readyz check failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}
