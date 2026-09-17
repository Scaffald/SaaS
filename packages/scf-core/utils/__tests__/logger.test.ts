import { describe, it, expect, vi, beforeEach } from 'vitest'

// The '@sentry/react-native' mock that used to sit here existed only so the
// import in logger.ts would resolve. Sentry is gone (#791); the logger writes
// to the console and nowhere else, which is what these assertions check.

const { logger } = await import('../logger')

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.console.log = vi.fn()
    global.console.info = vi.fn()
    global.console.warn = vi.fn()
    global.console.error = vi.fn()
  })

  it('should log debug messages in development', () => {
    logger.debug('Test message', { key: 'value' })
    expect(console.log).toHaveBeenCalledWith(
      '[DEBUG] Test message',
      { key: 'value' }
    )
  })

  it('should log info messages in development', () => {
    logger.info('Test info', { key: 'value' })
    expect(console.info).toHaveBeenCalledWith(
      '[INFO] Test info',
      { key: 'value' }
    )
  })

  it('should log warnings in development', () => {
    logger.warn('Test warning', { key: 'value' })
    expect(console.warn).toHaveBeenCalledWith(
      '[WARN] Test warning',
      { key: 'value' }
    )
  })

  it('should log errors always', () => {
    const error = new Error('Test error')
    logger.error('Error occurred', error)
    expect(console.error).toHaveBeenCalled()
  })

  it('should handle missing context gracefully', () => {
    logger.debug('No context')
    expect(console.log).toHaveBeenCalledWith('[DEBUG] No context', '')
  })
})
