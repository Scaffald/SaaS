import { describe, expect, it, vi } from 'vitest'

vi.mock('expo-router', () => ({ useRouter: () => ({ back: vi.fn() }) }))
// JobForm makes the create's idempotency id with it (#1408); the native
// module doesn't load under vitest.
vi.mock('expo-crypto', () => ({ randomUUID: () => 'uuid-test' }))

const { officeJobToFormData } = await import('../JobForm')

describe('officeJobToFormData (#1342)', () => {
  it('carries every saved field into the form and splits skills by required', () => {
    const form = officeJobToFormData({
      id: 'job-1',
      title: 'Pipefitter',
      internal_job_code: 'PF-1',
      travel_percentage: 20,
      require_work_authorization: true,
      cost_center: null,
      application_deadline: '2027-01-31T17:00:00+00:00',
      target_start_date: '2027-02-15',
      skills: [
        { id: 's1', name: 'Welding', is_required: true },
        { id: 's2', name: 'Rigging', is_required: false },
      ],
      certifications: [{ id: 'c1', name: 'OSHA 10' }],
      team_ids: ['t1'],
    })
    expect(form).toMatchObject({
      internal_job_code: 'PF-1',
      travel_percentage: 20,
      require_work_authorization: true,
      application_deadline: '2027-01-31',
      target_start_date: '2027-02-15',
      skill_ids: ['s1'],
      optional_skill_ids: ['s2'],
      certification_ids: ['c1'],
      team_ids: ['t1'],
    })
    expect('cost_center' in form).toBe(false)
    expect('skills' in form).toBe(false)
  })
})
