import { describe, expect, it } from 'vitest'
import { toATSApplication } from '../transform'
import type { ApplicationsListItem } from '../hooks/useApplications'

/**
 * The transform is now shared by the kanban board and the per-application
 * detail route (#537). That is the whole point of extracting it — two copies
 * drift, and the drift shows up as a field that renders on a card and is blank
 * on the detail page.
 *
 * These assertions pin the field names, because the version this replaced was
 * written against a `v_applications_with_user_profiles` view that exists in no
 * migration and read ~25 fields that are not columns on `core.applications`.
 */

function row(overrides: Partial<ApplicationsListItem> = {}): ApplicationsListItem {
  return {
    id: 'app_1',
    job_id: 'job_1',
    user_id: 'user_1',
    status: 'interview',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-02T10:00:00Z',
    stage_changed_at: '2026-08-02T10:00:00Z',
    score_total: 82,
    source: 'job_board',
    union_status: null,
    assigned_to: null,
    is_shortlisted: false,
    screening_answers: {},
    attachment_metadata: null,
    candidate: {
      id: 'user_1',
      display_name: 'Dana Reyes',
      username: 'dana',
      headline: 'Journeyman Electrician',
      avatar_url: null,
      avatar_path: null,
    },
    job: {
      id: 'job_1',
      title: 'Commercial Electrician',
      location: 'Charlotte, NC',
      employment_type: 'full_time',
      organization_id: 'org_1',
      pay_range_min_cents: 4_000_000,
      pay_range_max_cents: 6_000_000,
      pay_range_type: 'salary',
    },
    ...overrides,
  } as ApplicationsListItem
}

describe('toATSApplication', () => {
  it('reads the real column names', () => {
    const application = toATSApplication(row())

    // score_total, not application_score. created_at, not applied_at.
    expect(application.id).toBe('app_1')
    expect(application.score).toBe(82)
    expect(application.candidate.name).toBe('Dana Reyes')
    expect(application.job.title).toBe('Commercial Electrician')
    expect(application.job.organizationId).toBe('org_1')
  })

  it('reads screening answers from the JSON column, not flat fields', () => {
    // `current_location`, `years_experience` and friends are keys inside
    // `screening_answers`; they are not columns on core.applications.
    const application = toATSApplication(
      row({
        screening_answers: {
          current_location: 'Raleigh, NC',
          years_experience: 7,
          willing_to_relocate: true,
        },
      } as Partial<ApplicationsListItem>)
    )

    // They surface twice: once under screeningAnswers, once denormalised onto
    // the candidate the cards read.
    expect(application.screeningAnswers.currentLocation).toBe('Raleigh, NC')
    expect(application.screeningAnswers.yearsExperience).toBe(7)
    expect(application.screeningAnswers.willingToRelocate).toBe(true)
    expect(application.candidate.location).toBe('Raleigh, NC')
    expect(application.candidate.yearsExperience).toBe(7)
  })

  it('keeps withdrawn distinct from rejected', () => {
    // Collapsing them made every funnel conversion and adverse-impact count
    // wrong, since a candidate who pulled out was counted as one the employer
    // turned down (#533).
    const withdrawn = toATSApplication(row({ status: 'withdrawn' } as Partial<ApplicationsListItem>))
    const rejected = toATSApplication(row({ status: 'rejected' } as Partial<ApplicationsListItem>))

    expect(withdrawn.status).not.toBe(rejected.status)
    expect(withdrawn.status).toBe('withdrawn')
  })

  it('produces the same object for one row as for that row inside a list', () => {
    // The property the detail route depends on: the board maps a list through
    // this function, the route calls it with one row, and the results must be
    // identical or the two views disagree.
    const single = toATSApplication(row())
    const [fromList] = [row()].map(toATSApplication)

    expect(fromList).toEqual(single)
  })

  it('survives a row with nothing optional set', () => {
    // A detail route hitting an application with no candidate profile, no pay
    // range and no screening answers must render, not throw.
    const sparse = toATSApplication(
      row({
        score_total: null,
        candidate: null,
        job: null,
        screening_answers: null,
        attachment_metadata: null,
      } as unknown as Partial<ApplicationsListItem>)
    )

    expect(sparse.id).toBe('app_1')
    expect(typeof sparse.candidate.name).toBe('string')
  })
})
