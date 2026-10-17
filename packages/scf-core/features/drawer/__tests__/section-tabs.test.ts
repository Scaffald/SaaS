import { describe, expect, it } from 'vitest'
import { activeNavKey, getNavItems } from '../config'
import { getSectionTabs, stripEdgeFades, stripScrollTarget } from '../section-tabs'
import type { OrganizationMembership } from '@scf/core/utils/useOrganizations'

const org = {
  organization_id: 'o1',
  organization_slug: 'acme',
  organization_name: 'Acme Corp',
} as OrganizationMembership

const worker = getNavItems(undefined, false)
const member = getNavItems([org], false)
const office = getNavItems(undefined, true)
// Find talent, the employer directory's create/join tabs and each org's own
// tabs are the employer's — the worker tree no longer has them (#1157).
const employer = getNavItems([org], false, 'employer')
const employerAdmin = getNavItems([org], true, 'employer')

const keys = (pathname: string, items = worker) =>
  getSectionTabs(pathname, items)?.tabs.map((t) => t.key)

describe('getSectionTabs', () => {
  it('gives a section its tabs and lights the one you are on', () => {
    const strip = getSectionTabs('/dashboard/news', worker)
    expect(strip?.ownerKey).toBe('dashboard')
    expect(strip?.activeKey).toBe('dashboard-news')
  })

  it('lights the section index only on the index itself', () => {
    expect(getSectionTabs('/dashboard', worker)?.activeKey).toBe('dashboard-index')
    expect(getSectionTabs('/dashboard/analytics/engagement', worker)?.activeKey).toBe(
      'dashboard-analytics'
    )
  })

  it('shows the strip on a detail page with nothing lit', () => {
    const strip = getSectionTabs('/workers/123', employer)
    expect(strip?.ownerKey).toBe('workers')
    expect(strip?.activeKey).toBeNull()
  })

  it('shows no strip outside every section', () => {
    expect(getSectionTabs('/dashboard/settings', worker)).toBeNull()
    expect(getSectionTabs('/search', worker)).toBeNull()
  })

  it('leaves Notifications to the drawer footer, not the Home tabs', () => {
    expect(keys('/dashboard')).not.toContain('dashboard-notifications')
    // No strip at all: Home's tabs with none lit sat over the inbox (#1167).
    expect(getSectionTabs('/dashboard/notifications', worker)).toBeNull()
    expect(getSectionTabs('/dashboard/notifications/settings', worker)).toBeNull()
  })

  it("hands an organisation page the org's own tabs, with a way back", () => {
    const strip = getSectionTabs('/employers/org/acme/teams', employer)
    expect(strip?.ownerKey).toBe('org-acme')
    expect(strip?.tabs.map((t) => t.key)).toEqual(['org-acme', 'org-acme-teams', 'org-acme-logs'])
    expect(strip?.activeKey).toBe('org-acme-teams')
    expect(getSectionTabs('/employers/org/acme', employer)?.activeKey).toBe('org-acme')
  })

  it('keeps Employers tabs on the employer search and join pages', () => {
    expect(getSectionTabs('/employers/invitations', employer)?.activeKey).toBe('employers-join')
    expect(getSectionTabs('/employers', employer)?.ownerKey).toBe('employers')
  })

  it('lights an Office tab for every page under its prefix', () => {
    expect(getSectionTabs('/office/compliance/project-hiring', office)?.activeKey).toBe(
      'office-compliance'
    )
    expect(getSectionTabs('/office/integrations/hris', office)?.activeKey).toBe(
      'office-integrations'
    )
    expect(getSectionTabs('/office/applications/abc', office)?.activeKey).toBe(
      'office-applications'
    )
  })

  it('does not offer Office tabs to someone without the role', () => {
    expect(getSectionTabs('/office/applications', worker)).toBeNull()
  })

  it('lands Jobs on the signed-in listing and owns the rest of /jobs', () => {
    expect(getSectionTabs('/jobs/browse', worker)?.activeKey).toBe('jobs-index')
    expect(getSectionTabs('/jobs/saved', worker)?.ownerKey).toBe('jobs')
    expect(getSectionTabs('/jobs/view/42', worker)?.activeKey).toBeNull()
    const jobs = worker.find((item) => item.key === 'jobs')
    expect(jobs?.href).toBe('/jobs/browse')
  })

  it("keeps My Listings out of the worker's Jobs tabs, even for a member (#1157)", () => {
    expect(keys('/jobs/saved')).not.toContain('jobs-my-listings')
    expect(keys('/jobs/saved', member)).not.toContain('jobs-my-listings')
  })

  it('gives a worker the employer directory with no create, join or own-org tabs', () => {
    expect(getSectionTabs('/employers', member)).toBeNull()
    expect(getSectionTabs('/employers/abc', member)).toBeNull()
  })

  // #1120: every sub-route lights its parent tab, the most specific one when
  // several prefixes claim it.
  describe('active tab on a sub-route (longest-prefix match)', () => {
    const active = (pathname: string, items = worker) => getSectionTabs(pathname, items)?.activeKey

    it.each([
      ['/assessments', 'assessments-index'],
      ['/assessments/occupation', 'assessments-occupation'],
      ['/assessments/career-explorer', 'assessments-career-explorer'],
      ['/assessments/career-explorer/15-1252.00', 'assessments-career-explorer'],
      ['/assessments/ipip/results', 'assessments-ipip'],
      ['/assessments/ipip/shared/abc', 'assessments-ipip'],
      ['/profile/resume/review', 'profile-resume'],
      ['/profile/verification', 'profile-verification'],
      ['/profile/background-check', 'profile-verification'],
      ['/profile/background-check/initiate', 'profile-verification'],
      ['/profile/background-check/c1/dispute', 'profile-verification'],
    ])('%s lights %s', (pathname, key) => {
      expect(active(pathname)).toBe(key)
    })

    it('prefers the more specific tab over the section index that also owns the path', () => {
      // The Assessments index owns all of /assessments; the IPIP tab's
      // longer prefix must win on its results page.
      expect(active('/assessments/ipip/results')).not.toBe('assessments-index')
    })

    it('does not light a tab for a path that only shares a leading substring', () => {
      expect(active('/profile/background-checker')).toBeNull()
    })

    it('still lights nothing where no tab claims the page', () => {
      expect(active('/workers/123', employer)).toBeNull()
    })
  })
})

describe('stripEdgeFades', () => {
  it('fades nothing when the strip fits', () => {
    expect(stripEdgeFades(0, 300, 390)).toEqual({ start: false, end: false })
    expect(stripEdgeFades(0, 390.5, 390)).toEqual({ start: false, end: false })
  })

  it('fades the trailing edge at rest when more tabs sit past it', () => {
    expect(stripEdgeFades(0, 600, 390)).toEqual({ start: false, end: true })
  })

  it('fades both edges mid-scroll and only the leading edge at the end', () => {
    expect(stripEdgeFades(100, 600, 390)).toEqual({ start: true, end: true })
    expect(stripEdgeFades(210, 600, 390)).toEqual({ start: true, end: false })
  })

  it('fades nothing before the strip is measured', () => {
    expect(stripEdgeFades(0, 600, 0)).toEqual({ start: false, end: false })
  })
})

describe('stripScrollTarget', () => {
  it('leaves a tab that is already on screen alone', () => {
    expect(stripScrollTarget({ x: 16, width: 80 }, 390, 16)).toBeNull()
  })

  it('brings a tab past the trailing edge in, a gutter from the leading edge', () => {
    expect(stripScrollTarget({ x: 480, width: 120 }, 390, 16)).toBe(464)
  })

  it('counts a tab under the trailing gutter as off screen', () => {
    expect(stripScrollTarget({ x: 300, width: 80 }, 390, 16)).toBe(284)
  })

  it('does nothing before the strip is measured', () => {
    expect(stripScrollTarget({ x: 480, width: 120 }, 0, 16)).toBeNull()
  })
})

describe('navigation follows the mode (#1157)', () => {
  const top = (items: ReturnType<typeof getNavItems>) => items.map((item) => item.key)

  it("gives a worker the prototype's sections", () => {
    expect(top(worker)).toEqual(['dashboard', 'profile', 'assessments', 'jobs', 'employers', 'communities'])
  })

  it('gives an employer Find talent, their postings, their pipeline and their organisations', () => {
    expect(top(employer)).toEqual([
      'dashboard',
      'workers',
      'employer-jobs',
      'employer-applications',
      'employers',
    ])
  })

  it('puts Office first for an admin, in either mode', () => {
    expect(top(office)[0]).toBe('office')
    expect(top(employerAdmin)[0]).toBe('office')
  })

  it("lights the employer's Applications, not Office, on the pipeline — and draws no admin tabs there", () => {
    expect(activeNavKey(employerAdmin, '/office/applications')).toBe('employer-applications')
    expect(activeNavKey(employerAdmin, '/office/applications/abc')).toBe('employer-applications')
    expect(getSectionTabs('/office/applications', employerAdmin)).toBeNull()
  })

  it('still gives an admin Office and its tabs everywhere else under /office', () => {
    expect(activeNavKey(employerAdmin, '/office/cms/jobs')).toBe('office')
    expect(getSectionTabs('/office/cms/jobs', employerAdmin)?.ownerKey).toBe('office')
  })

  it('lights exactly one row per page', () => {
    expect(activeNavKey(worker, '/jobs/applications')).toBe('jobs')
    expect(activeNavKey(worker, '/dashboard/notifications')).toBeNull()
    expect(activeNavKey(employer, '/jobs/my-listings')).toBe('employer-jobs')
  })
})
