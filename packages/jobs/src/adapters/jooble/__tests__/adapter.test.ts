import nock from 'nock'
import { createEnvStub } from '@app/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { JoobleAdapter } from '../adapter'
import { JoobleClient } from '../client'

const API_HOST = 'https://jooble.org'
const env = createEnvStub()

function createAdapter() {
  return new JoobleAdapter(new JoobleClient({ apiKey: 'test-key' }))
}

describe('JoobleAdapter', () => {
  beforeAll(() => {
    nock.disableNetConnect()
    env.set({ JOOBLE_API_KEY: 'test-key' })
    env.clear(
      'HTTPS_PROXY',
      'https_proxy',
      'HTTP_PROXY',
      'http_proxy',
      'ALL_PROXY',
      'all_proxy'
    )
  })

  beforeEach(() => {
    env.clear(
      'JOOBLE_SEARCH_KEYWORDS',
      'JOOBLE_SEARCH_LOCATION',
      'JOOBLE_SEARCH_RADIUS',
      'JOOBLE_SEARCH_PAGE_SIZE'
    )
  })

  afterEach(() => {
    nock.cleanAll()
  })

  afterAll(() => {
    nock.enableNetConnect()
    env.restore()
  })

  it('normalizes Jooble responses into jobs and organizations', async () => {
    const scope = nock(API_HOST)
      .post('/api/test-key', {
        keywords: 'software engineer',
        location: 'Remote',
        radius: 10,
        page: 2,
        size: 5,
      })
      .reply(200, {
        totalCount: 42,
        jobs: [
          {
            id: '123',
            title: 'Software Engineer',
            location: 'Remote, USA',
            snippet: 'Work on exciting problems.',
            salary: '$120k',
            type: 'Full-time',
            company: 'Acme Corp',
            link: 'https://example.com/jobs/123',
            updated: '2024-01-02',
            published: '2024-01-01',
          },
        ],
      })

    const adapter = createAdapter()
    const result = await adapter.pullListings({
      metadata: {
        keywords: ['software', 'engineer'],
        location: 'Remote',
        radius: 10,
      },
      pagination: {
        page: 2,
        pageSize: 5,
      },
    })

    expect(scope.isDone()).toBe(true)
    expect(result.jobs).toHaveLength(1)
    expect(result.organizations).toHaveLength(1)

    const job = result.jobs[0]
    expect(job.id).toBe('jooble-123')
    expect(job.identifier.externalId).toBe('123')
    expect(job.identifier.source).toBe('jooble')
    expect(job.title).toBe('Software Engineer')
    expect(job.organization.name).toBe('Acme Corp')
    expect(job.organization.identifier?.slug).toBe('acme-corp')
    expect(job.primaryLocation?.raw).toBe('Remote, USA')
    expect(job.metadata?.rawSalary).toBe('$120k')
    expect(job.postedAt?.toISOString()).toBe('2024-01-01T00:00:00.000Z')
    expect(job.updatedAt?.toISOString()).toBe('2024-01-02T00:00:00.000Z')

    const organization = result.organizations[0]
    expect(organization.name).toBe('Acme Corp')
    expect(organization.identifier?.slug).toBe('acme-corp')

    expect(result.nextCursor).toBe('3')
    expect(result.telemetry.source).toBe('jooble')
    expect(result.telemetry.itemsReceived).toBe(1)
    expect(result.telemetry.metadata?.totalCount).toBe(42)
    expect(result.telemetry.metadata?.config).toEqual(
      expect.objectContaining({
        page: 2,
        pageSize: 5,
        keywords: ['software', 'engineer'],
        location: 'Remote',
      })
    )
    expect(result.telemetry.metadata?.status).toBe(200)
  })

  it('handles empty responses gracefully', async () => {
    const scope = nock(API_HOST).post('/api/test-key', { page: 1, size: 20 }).reply(200, {
      totalCount: 0,
      jobs: [],
    })

    const adapter = createAdapter()
    const result = await adapter.pullListings()

    expect(scope.isDone()).toBe(true)
    expect(result.jobs).toEqual([])
    expect(result.organizations).toEqual([])
    expect(result.telemetry.itemsReceived).toBe(0)
    expect(result.telemetry.metadata?.totalCount).toBe(0)
  })

  it('propagates errors from the Jooble API', async () => {
    const scope = nock(API_HOST).post('/api/test-key').reply(500, { error: 'Internal error' })

    const adapter = createAdapter()

    await expect(adapter.pullListings()).rejects.toThrow(
      'Jooble request failed (500): Internal error'
    )
    expect(scope.isDone()).toBe(true)
  })
})
