import { describe, expect, it } from 'vitest'
import { activeNavKey, getEmployerMobileSections, getNavItems, screeningLanding } from '../config'
import { getSectionTabs, stripEdgeFades, stripScrollTarget } from '../section-tabs'
import type { OrganizationMembership } from '@scf/core/utils/useOrganizations'

const org = {
  organization_id: 'o1',
  organization_slug: 'acme',
  organization_name: 'Acme Corp',
} as OrganizationMembership

const worker = getNavItems(undefined, false)
const member = getNavItems([org], false)
const office = getNavItems(undefined, true, 'worker', true)
// Office staff without the background-check admin role (#1297).
const officeNoChecks = getNavItems(undefined, true)
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
    expect(getSectionTabs('/office/compliance/eeo-reports', office)?.activeKey).toBe(
      'office-compliance'
    )
  })

  // #1439 took platform setup to Admin; #1441 split Content Management into
  // People, Organizations and Jobs.
  it('gives Office its seven tabs, with no Integrations, Payments or Transactions', () => {
    const officeTabs = office[0].subItems?.map((t) => t.key)
    expect(officeTabs).toEqual([
      'office-overview',
      'office-screening',
      'office-people',
      'office-organizations',
      'office-jobs',
      'office-reports',
      'office-compliance',
    ])
    expect(officeTabs?.length).toBeLessThanOrEqual(7)
  })

  // #1441: CMS opened on Users and nothing led on to the rest of it.
  describe('People, Organizations and Jobs', () => {
    const tabs: Array<[string, string]> = [
      ['/office/cms', 'office-people'],
      ['/office/cms/workers', 'office-people'],
      ['/office/cms/workers/abc/edit', 'office-people'],
      ['/office/cms/organizations', 'office-organizations'],
      ['/office/cms/organizations/create', 'office-organizations'],
      ['/office/cms/organizations/abc/edit', 'office-organizations'],
      ['/office/cms/teams', 'office-organizations'],
      ['/office/cms/teams/create', 'office-organizations'],
      ['/office/cms/teams/abc', 'office-organizations'],
      ['/office/cms/teams/abc/analytics', 'office-organizations'],
      ['/office/cms/teams/abc/settings', 'office-organizations'],
      ['/office/cms/projects', 'office-organizations'],
      ['/office/cms/projects/abc', 'office-organizations'],
      ['/office/cms/projects/abc/edit', 'office-organizations'],
      ['/office/cms/universities', 'office-organizations'],
      ['/office/cms/universities/abc/edit', 'office-organizations'],
      ['/office/cms/jobs', 'office-jobs'],
      ['/office/cms/jobs/create', 'office-jobs'],
      ['/office/cms/jobs/abc/edit', 'office-jobs'],
    ]

    it.each(tabs)('%s lights %s', (pathname, key) => {
      for (const items of [office, officeNoChecks, employerAdmin]) {
        expect(activeNavKey(items, pathname)).toBe('office')
        const strip = getSectionTabs(pathname, items)
        expect(strip?.ownerKey).toBe('office')
        expect(strip?.activeKey).toBe(key)
      }
    })

    it('lands each tab on its list', () => {
      const href = (key: string) => office[0].subItems?.find((t) => t.key === key)?.href
      expect(href('office-people')).toBe('/office/cms')
      expect(href('office-organizations')).toBe('/office/cms/organizations')
      expect(href('office-jobs')).toBe('/office/cms/jobs')
      expect(href('office-reports')).toBe('/office/violations')
    })
  })

  // #1312: the pipeline is the employer's, under /hiring, not an Office tab.
  it('has no Applications tab in Office', () => {
    expect(office[0].subItems?.map((t) => t.key)).not.toContain('office-applications')
  })

  // #1203: no Office tab owned /office/ats/*, so screening lit nothing.
  describe('Screening', () => {
    const atsPages = [
      '/office/ats/admin',
      '/office/ats/checks',
      '/office/ats/request',
      '/office/ats/id-verifications',
      '/office/ats/scheduling',
      '/office/ats/self-schedule',
      '/office/ats/metrics',
    ]

    it.each(atsPages)('%s lights exactly the Screening tab', (pathname) => {
      for (const items of [office, employerAdmin]) {
        const strip = getSectionTabs(pathname, items)
        expect(strip?.ownerKey).toBe('office')
        expect(strip?.activeKey).toBe('office-screening')
      }
    })

    it('owns community verification, which is a screening queue', () => {
      expect(getSectionTabs('/office/communities/verification', office)?.activeKey).toBe(
        'office-screening'
      )
    })

    const screeningTab = (items: ReturnType<typeof getNavItems>) =>
      items
        .find((item) => item.key === 'office')
        ?.subItems?.find((tab) => tab.key === 'office-screening')

    it('lands on the review queue, the same page as the phone tab', () => {
      expect(screeningTab(office)?.href).toBe(screeningLanding(true))
      expect(screeningLanding(true)).toBe('/office/ats/admin')
      const phone = getEmployerMobileSections({ hasOfficeRole: true, isCheckAdmin: true }).find(
        (s) => s.key === 'screening'
      )
      expect(phone?.route).toBe(screeningLanding(true))
    })

    it("lands staff without the admin role on their organisation's checks, as the phone does (#1297)", () => {
      // The review queue turns them away with "Admin access required".
      expect(screeningTab(officeNoChecks)?.href).toBe('/office/ats/checks')
      const phone = getEmployerMobileSections({ hasOfficeRole: true, isCheckAdmin: false }).find(
        (s) => s.key === 'screening'
      )
      expect(phone?.route).toBe(screeningTab(officeNoChecks)?.href)
    })

    it('leaves the other Office tabs their own pages', () => {
      expect(getSectionTabs('/office/violations', office)?.activeKey).toBe('office-reports')
      expect(getSectionTabs('/office/cms/workers', office)?.activeKey).toBe('office-people')
    })
  })

  it('lights Overview on the Office home only', () => {
    expect(getSectionTabs('/office', office)?.activeKey).toBe('office-overview')
    expect(getSectionTabs('/office/violations', office)?.activeKey).toBe('office-reports')
  })

  // #1439
  describe('Admin', () => {
    const tabs: Array<[string, string]> = [
      ['/admin/general/geographic', 'admin-general'],
      ['/admin/general', 'admin-general'],
      ['/admin/billing/stripe', 'admin-billing'],
      ['/admin/billing/payments', 'admin-billing'],
      ['/admin/billing/transactions', 'admin-billing'],
      ['/admin/integrations/background-checks', 'admin-integrations'],
      ['/admin/integrations/hris', 'admin-integrations'],
      ['/admin/oauth-apps', 'admin-developer'],
      ['/admin/oauth-apps/abc-123', 'admin-developer'],
      ['/admin/system/notifications', 'admin-system'],
      ['/admin/system/storage', 'admin-system'],
    ]

    it('has the tabs General, Billing, Integrations, Developer platform, System', () => {
      const admin = office.find((item) => item.key === 'admin')
      expect(admin?.subItems?.map((t) => t.key)).toEqual([
        'admin-general',
        'admin-billing',
        'admin-integrations',
        'admin-developer',
        'admin-system',
      ])
    })

    it.each(tabs)('%s lights %s', (pathname, tab) => {
      for (const items of [office, employerAdmin]) {
        const strip = getSectionTabs(pathname, items)
        expect(strip?.ownerKey).toBe('admin')
        expect(strip?.activeKey).toBe(tab)
      }
    })

    it('lights no tab on the bare /admin landing', () => {
      expect(getSectionTabs('/admin', office)?.ownerKey).toBe('admin')
      expect(getSectionTabs('/admin', office)?.activeKey).toBeNull()
    })

    it('lands each tab on a page it owns', () => {
      const admin = office.find((item) => item.key === 'admin')
      for (const tab of admin?.subItems ?? []) {
        expect(getSectionTabs(tab.href, office)?.activeKey).toBe(tab.key)
      }
    })

    it('is not offered to someone without the office role', () => {
      expect(getSectionTabs('/admin/billing/payments', worker)).toBeNull()
      expect(getSectionTabs('/admin/billing/payments', employer)).toBeNull()
    })
  })

  it('does not offer Office tabs to someone without the role', () => {
    expect(getSectionTabs('/office/cms', worker)).toBeNull()
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

  it('puts Office first for an admin, in either mode, with Admin right after (#1439)', () => {
    expect(top(office).slice(0, 2)).toEqual(['office', 'admin'])
    expect(top(employerAdmin).slice(0, 2)).toEqual(['office', 'admin'])
    expect(top(worker)).not.toContain('admin')
    expect(top(employer)).not.toContain('admin')
  })

  it('claims /admin pages for Admin and leaves /office to Office', () => {
    for (const items of [office, employerAdmin]) {
      expect(activeNavKey(items, '/admin')).toBe('admin')
      expect(activeNavKey(items, '/admin/oauth-apps/abc-123')).toBe('admin')
      expect(activeNavKey(items, '/admin/system/notifications')).toBe('admin')
      expect(activeNavKey(items, '/office')).toBe('office')
      expect(activeNavKey(items, '/office/violations')).toBe('office')
    }
    expect(activeNavKey(worker, '/admin/billing/payments')).toBeNull()
  })

  it("lights the employer's Applications on the pipeline and its candidates (#1312)", () => {
    for (const items of [employer, employerAdmin]) {
      expect(activeNavKey(items, '/hiring/applications')).toBe('employer-applications')
      expect(activeNavKey(items, '/hiring/applications/abc')).toBe('employer-applications')
      expect(activeNavKey(items, '/hiring/applications/abc/hire')).toBe('employer-applications')
      expect(getSectionTabs('/hiring/applications', items)).toBeNull()
    }
  })

  it('still gives an admin Office and its tabs everywhere else under /office', () => {
    expect(activeNavKey(employerAdmin, '/office/cms/jobs')).toBe('office')
    expect(getSectionTabs('/office/cms/jobs', employerAdmin)?.ownerKey).toBe('office')
    // Office's own Jobs tab, never the employer's Jobs row (#1441).
    expect(getSectionTabs('/office/cms/jobs', employerAdmin)?.activeKey).toBe('office-jobs')
  })

  it('lights exactly one row per page', () => {
    expect(activeNavKey(worker, '/jobs/applications')).toBe('jobs')
    expect(activeNavKey(worker, '/dashboard/notifications')).toBeNull()
    expect(activeNavKey(employer, '/jobs/my-listings')).toBe('employer-jobs')
  })
})
