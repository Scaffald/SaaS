import { describe, expect, it } from 'vitest';

import {
  AdapterFetchParams,
  buildJobFingerprint,
} from '../utils';
import {
  JobSourceAdapter,
  type AdapterPullResult,
  type HydrateCompanyParams,
} from '../adapters/base';
import { NormalizedJobSchema } from '../domain/job';
import { NormalizedOrganizationSchema } from '../domain/organization';

const organization = NormalizedOrganizationSchema.parse({
  identifier: { externalId: 'acme', source: 'test-board' },
  name: 'Acme',
  websiteUrl: 'https://acme.example',
});

const jobRecord = NormalizedJobSchema.parse({
  identifier: { externalId: 'job-123', source: 'test-board' },
  title: 'Platform Engineer',
  url: 'https://jobs.example/platform-engineer',
  description: 'Own the platform infrastructure.',
  postedAt: '2024-03-01T00:00:00Z',
  locations: [
    {
      city: 'San Francisco',
      region: 'CA',
      country: 'United States',
      countryCode: 'US',
      timeZone: 'America/Los_Angeles',
    },
    {
      city: 'New York',
      region: 'NY',
      country: 'United States',
      countryCode: 'US',
      timeZone: 'America/New_York',
    },
  ],
  organization,
});

class TestAdapter extends JobSourceAdapter {
  constructor() {
    super('test-board');
  }

  async pullListings(params: AdapterFetchParams): Promise<AdapterPullResult> {
    const limit = params.pagination?.limit ?? params.pagination?.pageSize ?? 1;
    const jobs = Array.from({ length: limit }, () => jobRecord);

    return {
      jobs,
      organizations: [organization],
      nextCursor: params.pagination?.cursor ? undefined : 'cursor-1',
      telemetry: this.createTelemetry({
        requestCount: 1,
        itemsReceived: jobs.length,
      }),
    };
  }

  async hydrateCompany({ organization: org }: HydrateCompanyParams) {
    return {
      organization: {
        ...org,
        metadata: { hydrated: true },
      },
      telemetry: this.createTelemetry({
        requestCount: 1,
        itemsReceived: 1,
      }),
    };
  }
}

describe('JobSourceAdapter contract', () => {
  const adapter = new TestAdapter();

  it('returns normalized jobs with telemetry', async () => {
    const result = await adapter.pullListings({ pagination: { limit: 1 } });

    expect(result.jobs).toHaveLength(1);
    expect(result.organizations[0].name).toBe('Acme');
    expect(result.telemetry.source).toBe('test-board');
    expect(result.telemetry.itemsReceived).toBe(1);
    expect(result.telemetry.warnings).toEqual([]);
    expect(result.nextCursor).toBe('cursor-1');
  });

  it('hydrates company profiles with metadata', async () => {
    const hydrated = await adapter.hydrateCompany({ organization });

    expect(hydrated.organization.metadata?.hydrated).toBe(true);
    expect(hydrated.telemetry.source).toBe('test-board');
    expect(hydrated.telemetry.itemsReceived).toBe(1);
  });

  it('builds stable job fingerprints', () => {
    const fingerprint = buildJobFingerprint(jobRecord);
    const reversedLocations =
      jobRecord.locations !== undefined
        ? ([...jobRecord.locations].reverse() as typeof jobRecord.locations)
        : undefined;
    const shuffledFingerprint = buildJobFingerprint({
      ...jobRecord,
      locations: reversedLocations,
      title: jobRecord.title.toUpperCase(),
    });

    expect(shuffledFingerprint).toBe(fingerprint);
  });
});
