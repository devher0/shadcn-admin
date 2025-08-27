import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { logger } from '@/shared'

export function handleServerError(error: unknown) {
  logger.error('Server error occurred', { 
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  })

  let errMsg = 'Something went wrong!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'Content not found.'
  }

  if (error instanceof AxiosError) {
    errMsg = error.response?.data.title
  }

  toast.error(errMsg)
}
