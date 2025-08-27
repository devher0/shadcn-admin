import { metrics, logger } from '@/shared'

export async function GET() {
  try {
    logger.info('Metrics endpoint called')
    
    const prometheusMetrics = metrics.getMetrics()
    
    logger.info('Metrics endpoint completed', { 
      metricsLength: prometheusMetrics.length 
    })
    
    return new Response(prometheusMetrics, {
      status: 200,
      headers: { 
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    logger.error('Metrics endpoint failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    
    return new Response('# Error generating metrics', {
      status: 500,
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}
