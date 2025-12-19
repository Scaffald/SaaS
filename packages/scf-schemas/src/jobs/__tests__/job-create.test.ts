import { describe, expect, it } from 'vitest';

import { jobCreateSchema, jobUpdateSchema } from '../job-create.schema';

const validJobPayload = {
  organization_id: '00000000-0000-0000-0000-000000000000',
  title: 'Senior Software Engineer',
  description: 'Builds resilient systems and mentors the team.',
}

describe('jobCreateSchema', () => {
  it('accepts the minimal valid payload', () => {
    expect(() => jobCreateSchema.parse(validJobPayload)).not.toThrow()
  })

  it('validates organization id and basic fields', () => {
    const invalid = {
      ...validJobPayload,
      organization_id: 'not-a-uuid',
      title: 'Go',
      description: 'Too short',
    }

    const result = jobCreateSchema.safeParse(invalid)

    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message)
      expect(messages).toContain('Invalid organization ID')
      expect(messages).toContain('Title must be at least 3 characters')
      expect(messages).toContain('Description must be at least 10 characters')
    }
  })

  it('requires pay range type when min and max are provided', () => {
    const result = jobCreateSchema.safeParse({
      ...validJobPayload,
      pay_range_min_cents: 50_000,
      pay_range_max_cents: 100_000,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Pay range must include min, max, and type (hourly/salary/contract/project)',
      )
    }
  })

  it('rejects pay ranges where minimum is greater than maximum', () => {
    const result = jobCreateSchema.safeParse({
      ...validJobPayload,
      pay_range_min_cents: 120_000,
      pay_range_max_cents: 100_000,
      pay_range_type: 'salary',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Minimum pay must be less than or equal to maximum pay')
    }
  })

  it('accepts a full payload with pay range and nested data', () => {
    const result = jobCreateSchema.safeParse({
      ...validJobPayload,
      pay_range_min_cents: 80_000,
      pay_range_max_cents: 120_000,
      pay_range_type: 'salary',
      language_requirements: [
        {
          language: 'English',
          proficiency: 'fluent',
        },
      ],
      auto_reject_criteria: {
        score_minimum: 60,
        require_work_authorization: true,
      },
    })

    expect(result.success).toBe(true)
  })
})

describe('jobUpdateSchema', () => {
  it('shares the same validation rules as creation', () => {
    expect(() =>
      jobUpdateSchema.parse({
        id: validJobPayload.organization_id,
        ...validJobPayload,
      }),
    ).not.toThrow()

    const result = jobUpdateSchema.safeParse({
      id: validJobPayload.organization_id,
      ...validJobPayload,
      pay_range_min_cents: 120_000,
      pay_range_max_cents: 100_000,
      pay_range_type: 'salary',
    })

    expect(result.success).toBe(false)
  })
})
