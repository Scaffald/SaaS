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
    // Warnings print in development only. They used to also go to Sentry in
    // production; Sentry was removed (#791 — it was 22.9% of the web bundle,
    // ~2 MB of it the same library bundled five times). Nothing replaced it,
    // so production warnings now go nowhere by design rather than by accident.
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, context || '')
    }
  }

  /**
   * Errors always print, in every environment — `shouldLog` returns true for
   * them unconditionally, and that is now the whole of error reporting.
   *
   * There is no remote sink any more. On web that means the browser console;
   * on native, the device log and whatever the store's crash reporting picks
   * up. Losing aggregated error reporting is a real cost of removing Sentry
   * and is recorded here rather than left to be discovered.
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, error || '', context || '')
  }
}

export const logger = new Logger()
