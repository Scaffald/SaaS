import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_JOOBLE_KEY = process.env.JOOBLE_API_KEY

describe('syncJobSources', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.JOOBLE_API_KEY = 'test-key'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (ORIGINAL_JOOBLE_KEY === undefined) {
      delete process.env.JOOBLE_API_KEY
    } else {
      process.env.JOOBLE_API_KEY = ORIGINAL_JOOBLE_KEY
    }
  })

  it('invokes the ingestion service with default arguments and logs the result', async () => {
    const ingestionResult = {
      runId: 'run-123',
      jobs: [],
      organizations: [],
      summary: {
        fetched: 10,
        processed: 5,
        deduplicated: 5,
        created: 3,
        updated: 2,
        closed: 0,
      },
      telemetry: {
        source: 'jooble',
        requestCount: 2,
        itemsReceived: 10,
        durationMs: 1500,
        warnings: ['note'],
        rateLimit: { limit: 100, remaining: 75 },
      },
    }

    const services = await import('../../services')
    const runJobIngestion = vi
      .spyOn(services, 'runJobIngestion')
      .mockResolvedValue(ingestionResult as any)
    const logSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    const { syncJobSources } = await import('../index')

    const result = await syncJobSources([])

    expect(result).toBe(ingestionResult)
    expect(runJobIngestion).toHaveBeenCalledTimes(1)
    const callOptions = runJobIngestion.mock.calls[0][0]
    expect(callOptions.adapter.source).toBe('jooble')
    expect(callOptions.fetchParams).toEqual({})
    expect(logSpy).toHaveBeenCalledWith('Job ingestion run completed.', {
      runId: ingestionResult.runId,
      jobsProcessed: ingestionResult.summary.processed,
      summary: ingestionResult.summary,
      telemetry: {
        source: ingestionResult.telemetry.source,
        requestCount: ingestionResult.telemetry.requestCount,
        itemsReceived: ingestionResult.telemetry.itemsReceived,
        durationMs: ingestionResult.telemetry.durationMs,
        warnings: ingestionResult.telemetry.warnings,
        rateLimit: ingestionResult.telemetry.rateLimit,
      },
    })
  })

  it('parses pagination and filter arguments when provided', async () => {
    const ingestionResult = {
      runId: 'run-456',
      jobs: [],
      organizations: [],
      summary: {
        fetched: 0,
        processed: 0,
        deduplicated: 0,
        created: 0,
        updated: 0,
        closed: 0,
      },
      telemetry: {
        source: 'jooble',
        requestCount: 0,
        itemsReceived: 0,
        warnings: [],
      },
    }

    const services = await import('../../services')
    const runJobIngestion = vi
      .spyOn(services, 'runJobIngestion')
      .mockResolvedValue(ingestionResult as any)
    vi.spyOn(console, 'info').mockImplementation(() => {})

    const { syncJobSources } = await import('../index')

    await syncJobSources([
      '--cursor',
      'cursor-1',
      '--page',
      '2',
      '--page-size=25',
      '--limit',
      '50',
      '--search',
      'Data Engineer',
      '--location',
      'Remote',
      '--remote-only',
      '--include-closed=false',
      '--tag',
      'featured',
      '--tag',
      'urgent',
      '--since',
      '2024-01-01T00:00:00Z',
      '--until',
      '2024-02-01T00:00:00Z',
    ])

    expect(runJobIngestion).toHaveBeenCalledTimes(1)
    const options = runJobIngestion.mock.calls[0][0]
    expect(options.fetchParams).toMatchObject({
      pagination: { cursor: 'cursor-1', page: 2, pageSize: 25, limit: 50 },
      filters: {
        search: 'Data Engineer',
        locations: [{ raw: 'Remote', formatted: 'Remote' }],
        remoteOnly: true,
        includeClosed: false,
        tags: ['featured', 'urgent'],
      },
    })
    expect(options.fetchParams?.since?.toISOString()).toBe('2024-01-01T00:00:00.000Z')
    expect(options.fetchParams?.until?.toISOString()).toBe('2024-02-01T00:00:00.000Z')
  })

  it('throws an error when the adapter cannot be resolved', async () => {
    const services = await import('../../services')
    const runJobIngestion = vi.spyOn(services, 'runJobIngestion')
    vi.spyOn(console, 'info').mockImplementation(() => {})

    const { syncJobSources } = await import('../index')

    await expect(syncJobSources(['--adapter', 'unknown'])).rejects.toThrow(
      'Unknown job source adapter: unknown'
    )
    expect(runJobIngestion).not.toHaveBeenCalled()
  })

  it('propagates errors from the ingestion service', async () => {
    const services = await import('../../services')
    const error = new Error('ingestion failed')
    vi.spyOn(services, 'runJobIngestion').mockRejectedValue(error)
    const logSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    const { syncJobSources } = await import('../index')

    await expect(syncJobSources([])).rejects.toThrow(error)
    expect(logSpy).not.toHaveBeenCalled()
  })
})

describe('cli run entrypoint', () => {
  beforeEach(() => {
    vi.resetModules()
    process.exitCode = undefined
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = undefined
  })

  it('invokes the sync routine when the script loads', async () => {
    const syncJobSources = vi.fn().mockResolvedValue(undefined)
    vi.doMock('../index', () => ({ syncJobSources }))

    await import('../run')

    expect(syncJobSources).toHaveBeenCalledTimes(1)
    expect(process.exitCode).toBeUndefined()
  })

  it('reports errors and sets the exit code when the sync fails', async () => {
    const error = new Error('boom')
    const syncJobSources = vi.fn().mockRejectedValue(error)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.doMock('../index', () => ({ syncJobSources }))

    await import('../run')
    await Promise.resolve()

    expect(syncJobSources).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith('Failed to run job sourcing sync.', error)
    expect(process.exitCode).toBe(1)
  })
})
