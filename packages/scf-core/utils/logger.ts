import * as Sentry from '@sentry/react-native'

interface LogContext {
  [key: string]: unknown
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // Always log errors
    if (level === 'error') return true

    // In production, only log errors
    if (!__DEV__) return false

    // In development, log everything
    return true
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, context || '')
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, context || '')
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, context || '')
    }

    // Send warnings to Sentry in production
    if (!__DEV__) {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      })
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, error || '', context || '')

    // Always send errors to Sentry
    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: { message, ...context },
      })
    } else {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: { error, ...context },
      })
    }
  }
}

export const logger = new Logger()
