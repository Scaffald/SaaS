import { describe, expect, it } from 'vitest';

import {
  applicationCreateSchema,
  applicationQuerySchema,
  applicationUpdateStatusSchema,
  applicationWithdrawSchema,
} from '../application.schema.ts';

const validJobId = '00000000-0000-4000-8000-000000000000'
const validApplicationId = '11111111-1111-4111-8111-111111111111'

describe('applicationCreateSchema', () => {
  it('accepts minimal valid payloads', () => {
    expect(() =>
      applicationCreateSchema.parse({
        job_id: validJobId,
      }),
    ).not.toThrow()
  })

  it('validates job ids', () => {
    expect(() =>
      applicationCreateSchema.parse({
        job_id: 'not-a-uuid',
      }),
    ).toThrowError(/Invalid job ID/)
  })
})

describe('applicationUpdateStatusSchema', () => {
  it('accepts known statuses', () => {
    expect(() =>
      applicationUpdateStatusSchema.parse({
        id: validApplicationId,
        status: 'reviewing',
        notes: 'Looks promising',
      }),
    ).not.toThrow()
  })

  it('rejects unknown statuses', () => {
    expect(() =>
      applicationUpdateStatusSchema.parse({
        id: validApplicationId,
        status: 'unknown' as never,
      }),
    ).toThrowError(/invalid_value/)
  })
})

describe('applicationWithdrawSchema', () => {
  it('requires a valid application id', () => {
    expect(() =>
      applicationWithdrawSchema.parse({
        id: 'bad-id',
      }),
    ).toThrowError(/Invalid application ID/)
  })
})

describe('applicationQuerySchema', () => {
  it('applies defaults when paging is omitted', () => {
    const parsed = applicationQuerySchema.parse({})
    expect(parsed.limit).toBe(50)
    expect(parsed.offset).toBe(0)
  })

  it('enforces bounds on paging parameters', () => {
    expect(() =>
      applicationQuerySchema.parse({
        limit: 0,
      }),
    ).toThrowError(/Too small|>=1/)

    expect(() =>
      applicationQuerySchema.parse({
        limit: 200,
      }),
    ).toThrowError(/Too large|<=100/)

    expect(() =>
      applicationQuerySchema.parse({
        offset: -1,
      }),
    ).toThrowError(/Too small|>=0/)
  })
})
