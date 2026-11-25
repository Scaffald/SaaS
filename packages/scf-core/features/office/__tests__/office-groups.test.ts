import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getNavItems } from '../../drawer/config'
import { officeGroupPages } from '../office-groups'

const hrefs = (pathname: string, isCheckAdmin = false) =>
  officeGroupPages(pathname, { isCheckAdmin })?.pages.map((p) => p.href)
const active = (pathname: string, isCheckAdmin = false) =>
  officeGroupPages(pathname, { isCheckAdmin })?.activeHref

describe('officeGroupPages (#1441)', () => {
  it("gives Organizations a row of its four kinds, lit on each one's pages", () => {
    const row = [
      '/office/cms/organizations',
      '/office/cms/teams',
      '/office/cms/projects',
      '/office/cms/universities',
    ]
    expect(hrefs('/office/cms/organizations')).toEqual(row)
    expect(active('/office/cms/teams')).toBe('/office/cms/teams')
    expect(active('/office/cms/teams/abc/analytics')).toBe('/office/cms/teams')
    expect(active('/office/cms/projects/abc')).toBe('/office/cms/projects')
    expect(active('/office/cms/universities/create')).toBe('/office/cms/universities')
    expect(active('/office/cms/organizations/abc/edit')).toBe('/office/cms/organizations')
  })

  it('gives Compliance its two reports', () => {
    expect(hrefs('/office/compliance/eeo-reports')).toEqual([
      '/office/compliance/eeo-reports',
      '/office/compliance/project-hiring',
    ])
    expect(active('/office/compliance/project-hiring')).toBe('/office/compliance/project-hiring')
  })

  describe('Screening', () => {
    it('lists the queues, scheduling and metrics, and community verification', () => {
      expect(hrefs('/office/ats/checks')).toEqual([
        '/office/ats/checks',
        '/office/ats/id-verifications',
        '/office/ats/scheduling',
        '/office/ats/self-schedule',
        '/office/ats/metrics',
        '/office/communities/verification',
      ])
      expect(active('/office/communities/verification')).toBe('/office/communities/verification')
      expect(active('/office/ats/metrics')).toBe('/office/ats/metrics')
    })

    it('lights Background checks on requesting one', () => {
      expect(active('/office/ats/request')).toBe('/office/ats/checks')
      expect(active('/office/ats/request', true)).toBe('/office/ats/checks')
    })

    // #1297: the review queue turns away staff without the admin role.
    it('gives only check admins a review-queue tab', () => {
      expect(hrefs('/office/ats/checks', true)?.[0]).toBe('/office/ats/admin')
      expect(active('/office/ats/admin', true)).toBe('/office/ats/admin')
      expect(hrefs('/office/ats/checks')).not.toContain('/office/ats/admin')
      expect(active('/office/ats/admin')).toBe('/office/ats/checks')
    })
  })

  it('has no row for single-page tabs or pages outside Office', () => {
    for (const path of [
      '/office',
      '/office/cms',
      '/office/cms/workers',
      '/office/cms/jobs',
      '/office/cms/jobs/abc/edit',
      '/office/violations',
      '/office/communities',
      '/admin/billing/payments',
      '/hiring/applications',
    ]) {
      expect(officeGroupPages(path), path).toBeNull()
    }
    expect(officeGroupPages(null)).toBeNull()
  })
})

/**
 * Every page under `(admin)/office/` must be reachable by clicking: from an
 * Office tab, or from a row beneath one. Detail, create and edit pages are
 * reached from their lists. What is left at the old paths is redirects
 * (#1312 to /hiring, #1439 to /admin, #1440 to the org Developers tab).
 */
describe('every Office page has a way in', () => {
  const officeDir = join(__dirname, '../../../../../apps/scaffald/app/(admin)/office')
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name)
      return statSync(path).isDirectory() ? files(path) : [path]
    })

  const redirectsOrNested = [
    /^\/office\/applications(\/|$)/,
    /^\/office\/(integrations|notifications|storage|payments|transactions|settings|oauth-apps)(\/|$)/,
    /^\/office\/(api-keys|webhooks)(\/|$)/,
    /^\/office\/ats$/, // redirects to the Screening landing
    /^\/office\/cms\/workers$/, // the same users list as /office/cms, which People lands on
    /^\/office\/ats\/(request)$/, // a button on Background checks
    /\/(create|edit|analytics|settings)$/,
    /\/\[[^/]+\](\/|$)/,
  ]

  const pages = files(officeDir)
    .filter((f) => f.endsWith('.tsx') && !f.endsWith('_layout.tsx'))
    .map((f) =>
      `/office/${relative(officeDir, f)}`.replace(/\.tsx$/, '').replace(/\/index$/, '')
    )
    .filter((p) => !redirectsOrNested.some((re) => re.test(p)))

  const tabHrefs = new Set(
    [true, false].flatMap((isCheckAdmin) => {
      const office = getNavItems(undefined, true, 'worker', isCheckAdmin)[0]
      const fromStrip = office.subItems?.map((t) => t.href) ?? []
      const fromRows = (office.subItems ?? []).flatMap(
        (t) => officeGroupPages(t.href, { isCheckAdmin })?.pages.map((p) => p.href) ?? []
      )
      return [office.href, ...fromStrip, ...fromRows]
    })
  )

  it('finds the pages', () => {
    expect(pages.length).toBeGreaterThan(15)
  })

  it.each(pages)('%s is a tab or a row entry', (page) => {
    expect(tabHrefs.has(page)).toBe(true)
  })
})
