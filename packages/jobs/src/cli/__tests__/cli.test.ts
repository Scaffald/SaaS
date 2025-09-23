import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AdapterFetchParams } from '../../utils'
import {
  JobSourceAdapter,
  type AdapterPullResult,
  type HydrateCompanyParams,
  type HydrateCompanyResult,
} from '../../adapters/base'
import type { NormalizedJob } from '../../domain/job'
import type { NormalizedOrganization } from '../../domain/organization'

class TestAdapter extends JobSourceAdapter {
  constructor(source = 'jooble') {
    super(source)
  }

  async pullListings(_params: AdapterFetchParams): Promise<AdapterPullResult> {
    throw new Error('Not implemented')
  }

  async hydrateCompany({ organization }: HydrateCompanyParams): Promise<HydrateCompanyResult> {
    return {
      organization,
      telemetry: this.createTelemetry({ requestCount: 0, itemsReceived: 1 }),
    }
  }
}

describe('syncJobSources', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const baseEnv = { JOOBLE_API_KEY: 'test-key' } as NodeJS.ProcessEnv

  it('runs the ingestion service with parsed CLI arguments', async () => {
    const ingestResult = {
      runId: 'run-123',
      jobs: [] as NormalizedJob[],
      organizations: [] as NormalizedOrganization[],
      telemetry: { source: 'jooble', requestCount: 2, itemsReceived: 4, warnings: ['window'] },
      summary: { fetched: 4, processed: 3, deduplicated: 1, created: 2, updated: 1, closed: 0 },
    }
    const ingest = vi.fn().mockResolvedValue(ingestResult)
    const adapter = new TestAdapter()
    const adapterFactory = vi.fn().mockReturnValue(adapter)
    const logger = { info: vi.fn() }

    const argv = [
      '--adapter',
      'jooble',
      '--pagination.page',
      '2',
      '--pagination.page-size',
      '25',
      '--cursor',
      'cursor-1',
      '--since',
      '2024-01-01T00:00:00Z',
      '--until',
      '2024-02-01T00:00:00Z',
      '--search',
      'platform engineer',
      '--location',
      'Austin, TX',
      '--employment-types',
      'full_time,contract',
      '--experience-levels',
      'mid,senior',
      '--workplace-types',
      'remote',
      '--remote-only',
      '--include-closed=true',
      '--tags',
      'platform,backend',
      '--filters.metadata.windowStart',
      '2024-01-15T00:00:00Z',
      '--metadata.priority',
      'urgent',
    ]

    const { syncJobSources } = await import('../index')

    const result = await syncJobSources({
      argv,
      env: baseEnv,
      ingest,
      adapters: { jooble: adapterFactory },
      logger,
    })

    expect(result).toEqual(ingestResult)
    expect(adapterFactory).toHaveBeenCalledWith(baseEnv)
    expect(ingest).toHaveBeenCalledTimes(1)
    const options = ingest.mock.calls[0][0]
    expect(options.adapter).toBe(adapter)
    expect(options.fetchParams).toEqual({
      pagination: { cursor: 'cursor-1', page: 2, pageSize: 25 },
      since: new Date('2024-01-01T00:00:00Z'),
      until: new Date('2024-02-01T00:00:00Z'),
      metadata: { priority: 'urgent' },
      filters: {
        search: 'platform engineer',
        locations: [{ raw: 'Austin, TX', formatted: 'Austin, TX' }],
        employmentTypes: ['full_time', 'contract'],
        experienceLevels: ['mid', 'senior'],
        workplaceTypes: ['remote'],
        remoteOnly: true,
        includeClosed: true,
        tags: ['platform', 'backend'],
        metadata: { windowstart: '2024-01-15T00:00:00Z' },
      },
    })
    expect(logger.info).toHaveBeenNthCalledWith(1, 'Run ID: run-123')
    expect(logger.info).toHaveBeenNthCalledWith(2, 'Jobs fetched=4, processed=3, deduplicated=1')
    expect(logger.info).toHaveBeenNthCalledWith(3, 'Persistence: created=2, updated=1, closed=0')
    expect(logger.info).toHaveBeenNthCalledWith(4, 'Telemetry:', ingestResult.telemetry)
  })

  it('uses defaults when no CLI arguments are provided', async () => {
    const ingestResult = {
      runId: 'run-001',
      jobs: [] as NormalizedJob[],
      organizations: [] as NormalizedOrganization[],
      telemetry: { source: 'jooble', requestCount: 1, itemsReceived: 0 },
      summary: { fetched: 0, processed: 0, deduplicated: 0, created: 0, updated: 0, closed: 0 },
    }
    const ingest = vi.fn().mockResolvedValue(ingestResult)
    const adapter = new TestAdapter()
    const adapterFactory = vi.fn().mockReturnValue(adapter)
    const logger = { info: vi.fn() }

    const { syncJobSources } = await import('../index')

    const result = await syncJobSources({
      argv: [],
      env: baseEnv,
      ingest,
      adapters: { jooble: adapterFactory },
      logger,
    })

    expect(result).toEqual(ingestResult)
    expect(adapterFactory).toHaveBeenCalledWith(baseEnv)
    expect(ingest).toHaveBeenCalledTimes(1)
    expect(ingest.mock.calls[0][0].fetchParams).toEqual({})
  })

  it('throws when the adapter key is not supported', async () => {
    const { syncJobSources } = await import('../index')

    await expect(
      syncJobSources({
        argv: ['--adapter', 'unknown'],
        env: baseEnv,
        adapters: {},
      })
    ).rejects.toThrow('Unsupported adapter: unknown')
  })

  it('propagates ingestion failures', async () => {
    const error = new Error('boom')
    const ingest = vi.fn().mockRejectedValue(error)
    const adapterFactory = vi.fn().mockReturnValue(new TestAdapter())

    const { syncJobSources } = await import('../index')

    await expect(
      syncJobSources({ argv: [], env: baseEnv, ingest, adapters: { jooble: adapterFactory } })
    ).rejects.toBe(error)
    expect(adapterFactory).toHaveBeenCalledTimes(1)
    expect(ingest).toHaveBeenCalledTimes(1)
  })

  it('requires the Jooble API key from the environment', async () => {
    const original = process.env.JOOBLE_API_KEY
    delete process.env.JOOBLE_API_KEY
    const ingest = vi.fn()

    try {
      const { syncJobSources } = await import('../index')

      await expect(
        syncJobSources({ argv: [], env: {} as NodeJS.ProcessEnv, ingest })
      ).rejects.toThrow('JOOBLE_API_KEY is not defined')
      expect(ingest).not.toHaveBeenCalled()
    } finally {
      if (original === undefined) {
        delete process.env.JOOBLE_API_KEY
      } else {
        process.env.JOOBLE_API_KEY = original
      }
    }
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
