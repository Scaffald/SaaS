import { describe, expect, it, vi } from 'vitest'

import type { AdapterFetchParams } from '../../utils'
import {
  JobSourceAdapter,
  type AdapterPullResult,
  type HydrateCompanyParams,
} from '../../adapters/base'
import { NormalizedJobSchema } from '../../domain/job'
import { NormalizedOrganizationSchema } from '../../domain/organization'
import { runJobIngestion } from '../index'
import type {
  CompleteJobIngestRunParams,
  FailJobIngestRunParams,
  IngestedJob,
  JobIngestionRepository,
  JobIngestRunRecord,
  PersistJobIngestionParams,
  PersistJobIngestionResult,
  StartJobIngestRunParams,
} from '../types'

type MockRepository = JobIngestionRepository & {
  startRun: ReturnType<typeof vi.fn>
  persistIngestion: ReturnType<typeof vi.fn>
  completeRun: ReturnType<typeof vi.fn>
  failRun: ReturnType<typeof vi.fn>
}

const createOrganization = (id: string, externalId: string) =>
  NormalizedOrganizationSchema.parse({
    id,
    name: `Org ${id}`,
    identifier: { externalId, source: 'test-board' },
    websiteUrl: `https://org-${id}.example.com`,
  })

const createJob = (externalId: string, organizationId: string) => {
  const organization = createOrganization(organizationId, `${organizationId}-ext`)
  return NormalizedJobSchema.parse({
    identifier: {
      externalId,
      source: 'test-board',
      url: `https://jobs.example/${externalId}`,
    },
    title: `Role ${externalId}`,
    url: `https://jobs.example/${externalId}`,
    description: `Description for ${externalId}`,
    postedAt: '2024-01-01T00:00:00Z',
    organization,
  })
}

const createAdapter = () => {
  const pullListings = vi.fn<[_params: AdapterFetchParams], Promise<AdapterPullResult>>()

  class TestAdapter extends JobSourceAdapter {
    constructor() {
      super('test-board')
    }

    pullListings(params: AdapterFetchParams = {}): Promise<AdapterPullResult> {
      return pullListings(params)
    }

    async hydrateCompany({ organization }: HydrateCompanyParams) {
      return {
        organization,
        telemetry: this.createTelemetry({ requestCount: 0, itemsReceived: 1 }),
      }
    }
  }

  return { adapter: new TestAdapter(), pullListings }
}

const createRepository = (
  persistResult: PersistJobIngestionResult = { created: 0, updated: 0, closed: 0 }
): MockRepository => {
  const startedAt = new Date('2024-03-01T00:00:00Z')
  const startRun = vi
    .fn<[StartJobIngestRunParams], Promise<JobIngestRunRecord>>()
    .mockResolvedValue({ id: 'run-1', startedAt })
  const persistIngestion = vi
    .fn<[PersistJobIngestionParams], Promise<PersistJobIngestionResult>>()
    .mockResolvedValue(persistResult)
  const completeRun = vi
    .fn<[CompleteJobIngestRunParams], Promise<void>>()
    .mockResolvedValue(undefined)
  const failRun = vi.fn<[FailJobIngestRunParams], Promise<void>>().mockResolvedValue(undefined)

  return {
    startRun,
    persistIngestion,
    completeRun,
    failRun,
  }
}

describe('runJobIngestion', () => {
  it('paginates, deduplicates, and aggregates telemetry', async () => {
    const { adapter, pullListings } = createAdapter()
    const persistResult = { created: 2, updated: 1, closed: 1 }
    const repository = createRepository(persistResult)

    const job1 = createJob('job-1', 'org-1')
    const job2 = createJob('job-2', 'org-1')
    const job3 = createJob('job-3', 'org-2')

    const firstPageTelemetry = adapter.createTelemetry({
      requestCount: 1,
      itemsReceived: 2,
      durationMs: 30,
      warnings: ['page-1'],
      metadata: { page: 1 },
    })
    const secondPageTelemetry = adapter.createTelemetry({
      requestCount: 1,
      itemsReceived: 2,
      durationMs: 20,
      warnings: ['page-2'],
      metadata: { page: 2 },
    })

    pullListings.mockResolvedValueOnce({
      jobs: [job1, job2],
      organizations: [job1.organization],
      nextCursor: 'cursor-1',
      telemetry: firstPageTelemetry,
    })

    pullListings.mockResolvedValueOnce({
      jobs: [job2, job3],
      organizations: [job2.organization, job3.organization],
      telemetry: secondPageTelemetry,
    })

    const controller = new AbortController()
    const timestamps = [
      new Date('2024-03-01T00:00:00Z'),
      new Date('2024-03-01T02:00:00Z'),
      new Date('2024-03-01T02:00:00Z'),
    ]
    let index = 0
    const now = vi.fn(() => {
      const value = timestamps[Math.min(index, timestamps.length - 1)]
      index += 1
      return value
    })

    const fetchParams: AdapterFetchParams = {
      pagination: { pageSize: 2 },
      since: new Date('2024-02-01T00:00:00Z'),
      metadata: { search: 'platform', window: { start: new Date('2024-02-15T00:00:00Z') } },
      signal: controller.signal,
    }

    const result = await runJobIngestion({ adapter, repository, fetchParams, now })

    expect(pullListings).toHaveBeenCalledTimes(2)
    expect(pullListings.mock.calls[0][0]).toEqual(fetchParams)
    expect(pullListings.mock.calls[1][0]).toEqual({
      ...fetchParams,
      pagination: { ...fetchParams.pagination, cursor: 'cursor-1' },
    })

    expect(repository.startRun).toHaveBeenCalledTimes(1)
    expect(repository.persistIngestion).toHaveBeenCalledTimes(1)
    expect(repository.completeRun).toHaveBeenCalledTimes(1)
    expect(repository.failRun).not.toHaveBeenCalled()

    const startParams = repository.startRun.mock.calls[0][0]
    expect(startParams.adapter).toBe(adapter.constructor.name)
    expect(startParams.provider).toBe(adapter.source)
    expect(startParams.parameters).toEqual({
      pagination: { pageSize: 2 },
      since: '2024-02-01T00:00:00.000Z',
      metadata: { search: 'platform', window: { start: '2024-02-15T00:00:00.000Z' } },
    })

    const persistParams = repository.persistIngestion.mock.calls[0][0]
    expect(persistParams.runId).toBe('run-1')
    expect(persistParams.jobs).toHaveLength(3)
    expect(persistParams.organizations).toHaveLength(2)
    expect(
      new Set((persistParams.jobs as IngestedJob[]).map((entry) => entry.fingerprint)).size
    ).toBe(3)

    expect(result.summary).toEqual({
      fetched: 4,
      processed: 3,
      deduplicated: 1,
      created: persistResult.created,
      updated: persistResult.updated,
      closed: persistResult.closed,
    })

    expect(result.telemetry).toEqual({
      source: adapter.source,
      requestCount: 2,
      itemsReceived: 4,
      durationMs: 50,
      warnings: ['page-1', 'page-2'],
      rateLimit: undefined,
      metadata: { page: 2 },
    })

    const completeParams = repository.completeRun.mock.calls[0][0]
    expect(completeParams.summary).toEqual(result.summary)
    expect(completeParams.telemetry).toEqual(result.telemetry)
  })

  it('only persists unique jobs when duplicates are returned', async () => {
    const { adapter, pullListings } = createAdapter()
    const repository = createRepository({ created: 1, updated: 0, closed: 0 })

    const job = createJob('job-1', 'org-1')

    pullListings.mockResolvedValueOnce({
      jobs: [job, { ...job }],
      organizations: [job.organization],
      telemetry: adapter.createTelemetry({ requestCount: 1, itemsReceived: 2 }),
    })

    await runJobIngestion({ adapter, repository, now: () => new Date('2024-03-01T00:00:00Z') })

    expect(repository.persistIngestion).toHaveBeenCalledTimes(1)
    const persistParams = repository.persistIngestion.mock.calls[0][0]
    expect(persistParams.jobs).toHaveLength(1)
    expect(persistParams.jobs[0].job.identifier.externalId).toBe('job-1')
  })

  it('records failures when persistence throws', async () => {
    const { adapter, pullListings } = createAdapter()
    const repository = createRepository()
    const error = new Error('boom')

    repository.persistIngestion.mockRejectedValue(error)

    pullListings.mockResolvedValueOnce({
      jobs: [createJob('job-1', 'org-1')],
      organizations: [],
      telemetry: adapter.createTelemetry({ requestCount: 1, itemsReceived: 1 }),
    })

    await expect(
      runJobIngestion({ adapter, repository, now: () => new Date('2024-03-01T00:00:00Z') })
    ).rejects.toThrow('boom')

    expect(repository.completeRun).not.toHaveBeenCalled()
    expect(repository.failRun).toHaveBeenCalledTimes(1)
    expect(repository.failRun.mock.calls[0][0].error).toBe(error)
  })
})
