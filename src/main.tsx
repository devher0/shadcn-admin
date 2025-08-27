import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { logger, health } from '@/shared'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        logger.debug('Query retry attempt', { failureCount, error: error instanceof Error ? error.message : 'Unknown error' })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)
        logger.error('Mutation error', { error: error instanceof Error ? error.message : 'Unknown error' })

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error('Content not modified!')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        logger.error('Query cache error', { 
          status: error.response?.status, 
          url: error.config?.url,
          method: error.config?.method 
        })
        
        if (error.response?.status === 401) {
          toast.error('Session expired!')
          useAuthStore.getState().auth.reset()
          const redirect = `${router.history.location.href}`
          router.navigate({ to: '/sign-in', search: { redirect } })
        }
        if (error.response?.status === 500) {
          toast.error('Internal Server Error!')
          router.navigate({ to: '/500' })
        }
        if (error.response?.status === 403) {
          // router.navigate("/forbidden", { replace: true });
        }
      }
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Initialize logging and metrics
logger.info('Application starting', { 
  environment: import.meta.env.MODE,
  version: import.meta.env.VITE_APP_VERSION || 'unknown'
})

// Register default health checks
health.registerLiveness('app', async () => {
  logger.debug('Running app liveness check')
  return true
})

health.registerLiveness('memory', async () => {
  logger.debug('Running memory liveness check')
  // Simulate memory check - in browser we can't access process.memoryUsage
  const isHealthy = true // Always healthy in browser environment
  return isHealthy
})

health.registerReadiness('database', async () => {
  logger.debug('Running database readiness check')
  try {
    // Real database connection check
    const { prisma } = await import('@/lib/database/client')
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    logger.error('Database readiness check failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return false
  }
}, 5000) // 5 second timeout

health.registerReadiness('redis', async () => {
  logger.debug('Running redis readiness check')
  try {
    // Simulate Redis connection check
    await new Promise(resolve => setTimeout(resolve, 30))
    const isHealthy = Math.random() > 0.05 // 95% success rate
    if (!isHealthy) {
      logger.warn('Redis readiness check failed')
    }
    return isHealthy
  } catch (error) {
    logger.error('Redis readiness check error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return false
  }
})

health.registerReadiness('external-api', async () => {
  logger.debug('Running external API readiness check')
  try {
    // Simulate external API check
    await new Promise(resolve => setTimeout(resolve, 100))
    const isHealthy = Math.random() > 0.15 // 85% success rate
    if (!isHealthy) {
      logger.warn('External API readiness check failed')
    }
    return isHealthy
  } catch (error) {
    logger.error('External API readiness check error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return false
  }
})

logger.info('Health checks registered', {
  livenessChecks: ['app', 'memory'],
  readinessChecks: ['database', 'redis', 'external-api']
})

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <RouterProvider router={router} />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
