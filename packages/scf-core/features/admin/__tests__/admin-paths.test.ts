import { describe, expect, it } from 'vitest'
import { adminGroupPages } from '../admin-groups'
import { movedToAdminTarget } from '../moved-paths'

describe('movedToAdminTarget (#1439)', () => {
  it.each([
    ['/office/settings/geographic', '/admin/general/geographic'],
    ['/office/settings/stripe', '/admin/billing/stripe'],
    ['/office/payments', '/admin/billing/payments'],
    ['/office/transactions', '/admin/billing/transactions'],
    ['/office/integrations/background-checks', '/admin/integrations/background-checks'],
    ['/office/integrations/hris', '/admin/integrations/hris'],
    ['/office/oauth-apps', '/admin/oauth-apps'],
    ['/office/oauth-apps/abc-123', '/admin/oauth-apps/abc-123'],
    ['/office/notifications', '/admin/system/notifications'],
    ['/office/notifications/', '/admin/system/notifications'],
    ['/office/storage', '/admin/system/storage'],
  ])('%s → %s', (from, to) => {
    expect(movedToAdminTarget(from)).toBe(to)
  })

  it('leaves everything that stayed in Office alone', () => {
    for (const path of [
      '/office',
      '/office/cms/jobs',
      '/office/api-keys',
      '/office/webhooks',
      '/office/violations',
      '/office/paymentsx',
      '/office/settings',
    ]) {
      expect(movedToAdminTarget(path)).toBeNull()
    }
    expect(movedToAdminTarget(null)).toBeNull()
  })
})

describe('adminGroupPages', () => {
  it('lists Billing’s pages and lights the one you are on', () => {
    const billing = adminGroupPages('/admin/billing/transactions')
    expect(billing?.pages.map((p) => p.href)).toEqual([
      '/admin/billing/payments',
      '/admin/billing/transactions',
      '/admin/billing/stripe',
    ])
    expect(billing?.activeHref).toBe('/admin/billing/transactions')
    expect(adminGroupPages('/admin/system/storage')?.activeHref).toBe('/admin/system/storage')
  })

  it('has no row for single-page tabs', () => {
    expect(adminGroupPages('/admin/general/geographic')).toBeNull()
    expect(adminGroupPages('/admin/oauth-apps/abc')).toBeNull()
    expect(adminGroupPages('/office/payments')).toBeNull()
  })
})
