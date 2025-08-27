import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { logger, metrics } from '@/shared'

export interface ApiClientConfig {
  baseURL: string
  timeout?: number
  headers?: Record<string, string>
}

class ApiClient {
  private client: AxiosInstance
  private serviceName: string

  constructor(config: ApiClientConfig, serviceName: string = 'api-client') {
    this.serviceName = serviceName
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const startTime = Date.now()
        const traceId = logger.generateTraceId()
        
        // Add trace ID to request headers
        config.headers = config.headers || {}
        config.headers['X-Trace-Id'] = traceId
        
        // Log request
        logger.info('API request started', {
          method: config.method?.toUpperCase(),
          url: config.url,
          traceId,
          service: this.serviceName
        })

        // Store start time for response interceptor
        ;(config as unknown as { startTime: number; traceId: string }).startTime = startTime
        ;(config as unknown as { startTime: number; traceId: string }).traceId = traceId

        return config
      },
      (error: unknown) => {
        logger.error('API request failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          service: this.serviceName
        })
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const startTime = (response.config as unknown as { startTime: number }).startTime
        const traceId = (response.config as unknown as { traceId: string }).traceId
        const responseTime = Date.now() - startTime

        // Record metrics
        metrics.observeHttp(
          response.config.method?.toUpperCase() || 'GET',
          response.config.url || '/',
          response.status,
          responseTime
        )

        // Log response
        logger.info('API request completed', {
          method: response.config.method?.toUpperCase(),
          url: response.config.url,
          status: response.status,
          responseTime,
          traceId,
          service: this.serviceName
        })

        return response
      },
      (error: unknown) => {
        const startTime = (error as { config?: { startTime: number } })?.config?.startTime
        const traceId = (error as { config?: { traceId: string } })?.config?.traceId
        const responseTime = startTime ? Date.now() - startTime : 0

        // Record error metrics
        const errorConfig = (error as { config?: { method?: string; url?: string } })?.config
        const errorResponse = (error as { response?: { status?: number } })?.response
        if (errorConfig) {
          metrics.observeHttp(
            errorConfig.method?.toUpperCase() || 'GET',
            errorConfig.url || '/',
            errorResponse?.status || 0,
            responseTime
          )
        }

        // Log error
        logger.error('API request failed', {
          method: errorConfig?.method?.toUpperCase(),
          url: errorConfig?.url,
          status: errorResponse?.status,
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
          traceId,
          service: this.serviceName
        })

        return Promise.reject(error)
      }
    )
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }
}

// Create default API client instance
export const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
}, 'shadcn-admin-api')

// Export factory function for creating service-specific clients
export function createApiClient(config: ApiClientConfig, serviceName?: string): ApiClient {
  return new ApiClient(config, serviceName)
}

export type { ApiClient }
