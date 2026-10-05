import { describe, expect, it } from 'vitest'
import { getNavItems } from '../config'
import { getSectionTabs } from '../section-tabs'
import type { OrganizationMembership } from '@scf/core/utils/useOrganizations'

const org = {
  organization_id: 'o1',
  organization_slug: 'acme',
  organization_name: 'Acme Corp',
} as OrganizationMembership

const worker = getNavItems(undefined, false)
const member = getNavItems([org], false)
const office = getNavItems(undefined, true)

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
    const strip = getSectionTabs('/workers/123', worker)
    expect(strip?.ownerKey).toBe('workers')
    expect(strip?.activeKey).toBeNull()
  })

  it('shows no strip outside every section', () => {
    expect(getSectionTabs('/dashboard/settings', worker)).toBeNull()
    expect(getSectionTabs('/search', worker)).toBeNull()
  })

  it('leaves Notifications to the drawer footer, not the Home tabs', () => {
    expect(keys('/dashboard')).not.toContain('dashboard-notifications')
    expect(getSectionTabs('/dashboard/notifications', worker)?.activeKey).toBeNull()
  })

  it("hands an organisation page the org's own tabs, with a way back", () => {
    const strip = getSectionTabs('/employers/org/acme/teams', member)
    expect(strip?.ownerKey).toBe('org-acme')
    expect(strip?.tabs.map((t) => t.key)).toEqual(['org-acme', 'org-acme-teams', 'org-acme-logs'])
    expect(strip?.activeKey).toBe('org-acme-teams')
    expect(getSectionTabs('/employers/org/acme', member)?.activeKey).toBe('org-acme')
  })

  it('keeps Employers tabs on the employer search and join pages', () => {
    expect(getSectionTabs('/employers/invitations', member)?.activeKey).toBe('employers-join')
    expect(getSectionTabs('/employers', member)?.ownerKey).toBe('employers')
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

  it('only lists My Listings for an organisation member', () => {
    expect(keys('/jobs/saved')).not.toContain('jobs-my-listings')
    expect(keys('/jobs/saved', member)).toContain('jobs-my-listings')
  })
})
