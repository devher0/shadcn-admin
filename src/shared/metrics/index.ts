export interface MetricLabels {
  [key: string]: string
}

export interface MetricValue {
  value: number
  labels?: MetricLabels
  timestamp?: number
}

class Metrics {
  private counters: Map<string, Map<string, number>> = new Map()
  private gauges: Map<string, Map<string, number>> = new Map()
  private histograms: Map<string, number[]> = new Map()
  private httpMetrics: {
    requests: Map<string, number>
    responseTimes: Map<string, number[]>
    errors: Map<string, number>
  } = {
    requests: new Map(),
    responseTimes: new Map(),
    errors: new Map()
  }

  private getLabelKey(labels?: MetricLabels): string {
    if (!labels) return 'default'
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',')
  }

  counter(name: string, value: number = 1, labels?: MetricLabels): void {
    const labelKey = this.getLabelKey(labels)
    
    if (!this.counters.has(name)) {
      this.counters.set(name, new Map())
    }
    
    const counterMap = this.counters.get(name)!
    const currentValue = counterMap.get(labelKey) || 0
    counterMap.set(labelKey, currentValue + value)
  }

  gauge(name: string, value: number, labels?: MetricLabels): void {
    const labelKey = this.getLabelKey(labels)
    
    if (!this.gauges.has(name)) {
      this.gauges.set(name, new Map())
    }
    
    const gaugeMap = this.gauges.get(name)!
    gaugeMap.set(labelKey, value)
  }

  histogram(name: string, value: number, labels?: MetricLabels): void {
    const labelKey = this.getLabelKey(labels)
    const metricKey = `${name}${labelKey !== 'default' ? `{${labelKey}}` : ''}`
    
    if (!this.histograms.has(metricKey)) {
      this.histograms.set(metricKey, [])
    }
    
    this.histograms.get(metricKey)!.push(value)
  }

  observeHttp(method: string, path: string, statusCode: number, responseTime: number): void {
    // Increment request counter
    this.counter('http_requests_total', 1, { method, path, status: statusCode.toString() })
    
    // Track response time
    this.histogram('http_request_duration_seconds', responseTime / 1000, { method, path })
    
    // Track errors
    if (statusCode >= 400) {
      this.counter('http_errors_total', 1, { method, path, status: statusCode.toString() })
    }
  }

  getMetrics(): string {
    const lines: string[] = []
    
    // Add help and type comments
    lines.push('# HELP http_requests_total Total number of HTTP requests')
    lines.push('# TYPE http_requests_total counter')
    
    // Counters
    for (const [name, labelMap] of this.counters) {
      for (const [labelKey, value] of labelMap) {
        const labels = labelKey !== 'default' ? `{${labelKey}}` : ''
        lines.push(`${name}${labels} ${value}`)
      }
    }
    
    lines.push('')
    lines.push('# HELP http_request_duration_seconds HTTP request duration in seconds')
    lines.push('# TYPE http_request_duration_seconds histogram')
    
    // Histograms
    for (const [name, values] of this.histograms) {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0)
        const count = values.length
        const sorted = values.sort((a, b) => a - b)
        const p50 = sorted[Math.floor(sorted.length * 0.5)]
        const p95 = sorted[Math.floor(sorted.length * 0.95)]
        const p99 = sorted[Math.floor(sorted.length * 0.99)]
        
        lines.push(`${name}_sum ${sum}`)
        lines.push(`${name}_count ${count}`)
        lines.push(`${name}_bucket{le="0.1"} ${values.filter(v => v <= 0.1).length}`)
        lines.push(`${name}_bucket{le="0.5"} ${values.filter(v => v <= 0.5).length}`)
        lines.push(`${name}_bucket{le="1"} ${values.filter(v => v <= 1).length}`)
        lines.push(`${name}_bucket{le="5"} ${values.filter(v => v <= 5).length}`)
        lines.push(`${name}_bucket{le="+Inf"} ${count}`)
        lines.push(`${name}_p50 ${p50}`)
        lines.push(`${name}_p95 ${p95}`)
        lines.push(`${name}_p99 ${p99}`)
      }
    }
    
    lines.push('')
    lines.push('# HELP http_errors_total Total number of HTTP errors')
    lines.push('# TYPE http_errors_total counter')
    
    return lines.join('\n')
  }

  reset(): void {
    this.counters.clear()
    this.gauges.clear()
    this.histograms.clear()
    this.httpMetrics.requests.clear()
    this.httpMetrics.responseTimes.clear()
    this.httpMetrics.errors.clear()
  }
}

// Create default metrics instance
export const metrics = new Metrics()

// HTTP middleware for Express/Fastify/Koa
export function httpMiddleware(_req: unknown, _res: unknown, next?: () => void): void {
  // This is a simplified middleware - in a real implementation, you would use proper types
  // for Express/Fastify/Koa request and response objects
  if (next) next()
}

// Metrics router for Express/Fastify/Koa
export const router = {
  get: (_req: unknown, res: { setHeader: (name: string, value: string) => void; send: (data: string) => void }) => {
    res.setHeader('Content-Type', 'text/plain')
    res.send(metrics.getMetrics())
  }
}
