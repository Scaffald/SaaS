import { describe, expect, it } from 'vitest'

import { CompensationSchema, NormalizedJobSchema } from '../domain/job'
import { NormalizedOrganizationSchema } from '../domain/organization'

const organizationFixture = {
  identifier: { externalId: 'acme-123' },
  name: 'Acme Corp',
  websiteUrl: 'https://acme.example',
  industries: ['software'],
  headquarters: {
    city: 'New York',
    region: 'NY',
    country: 'United States',
    countryCode: 'US',
    timeZone: 'America/New_York',
  },
}

describe('domain schemas', () => {
  it('parses normalized organization data', () => {
    const organization = NormalizedOrganizationSchema.parse(organizationFixture)

    expect(organization.name).toBe('Acme Corp')
    expect(organization.headquarters?.timeZone).toBe('America/New_York')
  })

  it('parses normalized job data and coerces dates', () => {
    const job = NormalizedJobSchema.parse({
      identifier: {
        externalId: 'job-1',
        source: 'test-board',
      },
      title: 'Senior Engineer',
      url: 'https://jobs.example/senior-engineer',
      description: 'Design and build features.',
      postedAt: '2024-01-01T12:00:00Z',
      updatedAt: new Date('2024-01-02T09:00:00Z'),
      employmentType: 'full_time',
      experienceLevel: 'senior',
      workplaceType: 'hybrid',
      compensation: {
        currency: 'usd',
        minAmount: 120000,
        periodicity: 'year',
      },
      locations: [
        {
          city: 'New York',
          region: 'NY',
          country: 'United States',
          countryCode: 'US',
          timeZone: 'America/New_York',
        },
      ],
      organization: organizationFixture,
    })

    expect(job.postedAt).toBeInstanceOf(Date)
    expect(job.compensation?.currency).toBe('USD')
    expect(job.organization.name).toBe('Acme Corp')
  })

  it('enforces description or summary presence', () => {
    expect(() =>
      NormalizedJobSchema.parse({
        identifier: { externalId: 'missing-copy', source: 'board' },
        title: 'Copyless role',
        url: 'https://jobs.example/copyless',
        organization: organizationFixture,
      })
    ).toThrow(/description/)
  })

  it('requires compensation ranges to provide an amount', () => {
    expect(() =>
      CompensationSchema.parse({
        currency: 'usd',
        periodicity: 'year',
      })
    ).toThrow(/Provide at least one compensation amount/)
  })
})
