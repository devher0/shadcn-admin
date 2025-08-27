import { PrismaClient } from '@prisma/client'
import { logger } from '@/shared'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
})

// Logging middleware
prisma.$on('query', (e) => {
  logger.debug('Database query', {
    query: e.query,
    params: e.params,
    duration: e.duration,
  })
})

prisma.$on('error', (e) => {
  logger.error('Database error', {
    error: e.message,
    target: e.target,
  })
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
