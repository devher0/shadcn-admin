import { v4 as uuidv4 } from 'uuid'

export interface LogContext {
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: string
  level: 'info' | 'error' | 'warn' | 'debug'
  service: string
  message: string
  context?: LogContext
  traceId?: string
}

class Logger {
  private service: string
  private traceId?: string
  private context?: LogContext

  constructor(service: string) {
    this.service = service
  }

  private formatLog(level: LogEntry['level'], message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      context,
      traceId: this.traceId
    }
  }

  private output(entry: LogEntry): void {
    // In browser environment, use console with JSON formatting
    if (typeof window !== 'undefined') {
      const logMethod = entry.level === 'error' ? 'error' : 
                       entry.level === 'warn' ? 'warn' : 
                       entry.level === 'debug' ? 'debug' : 'log'
      
      // eslint-disable-next-line no-console
      console[logMethod](JSON.stringify(entry))
    } else {
      // In Node.js environment, use process.stdout
      process.stdout.write(JSON.stringify(entry) + '\n')
    }
  }

  info(message: string, context?: LogContext): void {
    const entry = this.formatLog('info', message, context)
    this.output(entry)
  }

  error(message: string, context?: LogContext): void {
    const entry = this.formatLog('error', message, context)
    this.output(entry)
  }

  warn(message: string, context?: LogContext): void {
    const entry = this.formatLog('warn', message, context)
    this.output(entry)
  }

  debug(message: string, context?: LogContext): void {
    const entry = this.formatLog('debug', message, context)
    this.output(entry)
  }

  withContext(context: LogContext): Logger {
    const newLogger = new Logger(this.service)
    newLogger.traceId = this.traceId
    newLogger.context = { ...this.context, ...context }
    return newLogger
  }

  setTraceId(traceId: string): void {
    this.traceId = traceId
  }

  generateTraceId(): string {
    this.traceId = uuidv4()
    return this.traceId
  }

  getTraceId(): string | undefined {
    return this.traceId
  }
}

// Create default logger instance
export const logger = new Logger('shadcn-admin')

// Export factory function for creating service-specific loggers
export function createLogger(service: string): Logger {
  return new Logger(service)
}

// Export types for external use
export type { Logger }
