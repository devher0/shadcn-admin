import { logger } from '../logging'

export interface HealthCheck {
  name: string
  check: () => Promise<boolean>
  timeout?: number
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  checks: {
    [name: string]: {
      status: 'healthy' | 'unhealthy'
      message?: string
      duration?: number
    }
  }
}

class Health {
  private livenessChecks: Map<string, HealthCheck> = new Map()
  private readinessChecks: Map<string, HealthCheck> = new Map()

  registerLiveness(name: string, check: () => Promise<boolean>, timeout: number = 5000): void {
    this.livenessChecks.set(name, { name, check, timeout })
    logger.info('Liveness check registered', { checkName: name, timeout })
  }

  registerReadiness(name: string, check: () => Promise<boolean>, timeout: number = 5000): void {
    this.readinessChecks.set(name, { name, check, timeout })
    logger.info('Readiness check registered', { checkName: name, timeout })
  }

  private async runChecks(checks: Map<string, HealthCheck>): Promise<HealthStatus> {
    const results: HealthStatus['checks'] = {}
    let overallStatus: 'healthy' | 'unhealthy' = 'healthy'

    const checkPromises = Array.from(checks.entries()).map(async ([name, healthCheck]) => {
      const startTime = Date.now()
      
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Check timeout')), healthCheck.timeout || 5000)
        })

        const checkPromise = healthCheck.check()
        const result = await Promise.race([checkPromise, timeoutPromise])
        
        const duration = Date.now() - startTime
        
        results[name] = {
          status: result ? 'healthy' : 'unhealthy',
          duration
        }

        if (!result) {
          overallStatus = 'unhealthy'
        }

        logger.debug('Health check completed', { 
          checkName: name, 
          status: result ? 'healthy' : 'unhealthy', 
          duration 
        })

      } catch (error) {
        const duration = Date.now() - startTime
        results[name] = {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          duration
        }
        overallStatus = 'unhealthy'

        logger.error('Health check failed', { 
          checkName: name, 
          error: error instanceof Error ? error.message : 'Unknown error',
          duration 
        })
      }
    })

    await Promise.all(checkPromises)

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results
    }
  }

  async checkLiveness(): Promise<HealthStatus> {
    logger.debug('Running liveness checks', { checkCount: this.livenessChecks.size })
    return this.runChecks(this.livenessChecks)
  }

  async checkReadiness(): Promise<HealthStatus> {
    logger.debug('Running readiness checks', { checkCount: this.readinessChecks.size })
    return this.runChecks(this.readinessChecks)
  }

  // Express/Fastify/Koa router handlers
  getLivenessHandler() {
    return async (_req: unknown, res: { status: (code: number) => { json: (data: unknown) => void } }) => {
      try {
        const status = await this.checkLiveness()
        const httpStatus = status.status === 'healthy' ? 200 : 503
        
        res.status(httpStatus).json(status)
        
        logger.info('Liveness check response', { 
          status: status.status, 
          httpStatus,
          checkCount: Object.keys(status.checks).length 
        })
      } catch (error) {
        logger.error('Liveness check handler error', { error: error instanceof Error ? error.message : 'Unknown error' })
        res.status(500).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Internal server error'
        })
      }
    }
  }

  getReadinessHandler() {
    return async (_req: unknown, res: { status: (code: number) => { json: (data: unknown) => void } }) => {
      try {
        const status = await this.checkReadiness()
        const httpStatus = status.status === 'healthy' ? 200 : 503
        
        res.status(httpStatus).json(status)
        
        logger.info('Readiness check response', { 
          status: status.status, 
          httpStatus,
          checkCount: Object.keys(status.checks).length 
        })
      } catch (error) {
        logger.error('Readiness check handler error', { error: error instanceof Error ? error.message : 'Unknown error' })
        res.status(500).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Internal server error'
        })
      }
    }
  }

  // Router for Express/Fastify/Koa
  get router() {
    return {
      get: (path: string, handler: (req: unknown, res: unknown) => void) => {
        if (path === '/healthz') {
          return this.getLivenessHandler()
        } else if (path === '/readyz') {
          return this.getReadinessHandler()
        }
        return handler
      }
    }
  }
}

// Create default health instance
export const health = new Health()

// Export types for external use
