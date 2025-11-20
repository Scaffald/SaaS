import { buildRoute, ROUTES } from '@app/core/constants/routes'
import { render, screen } from '@testing-library/react'
import type { JSX } from 'react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('expo-router', () => ({
  Link: ({
    children,
    href,
    asChild,
  }: {
    children: React.ReactElement
    href: string
    asChild?: boolean
  }) => {
    if (asChild && React.isValidElement(children)) {
      const additionalProps: Record<string, unknown> = {
        'data-href': href,
        href,
      }

      return React.cloneElement(children, additionalProps)
    }

    return (
      <a href={href} data-href={href} data-testid="quick-link-anchor">
        {children}
      </a>
    )
  },
}))

vi.mock('@tamagui/lucide-icons', () => ({
  ChevronRight: ({ ...props }) => <span data-icon="chevron" {...props} />,
}))

vi.mock('tamagui', () => {
  const createComponent =
    (tag: keyof JSX.IntrinsicElements & string) =>
    ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) =>
      React.createElement(tag, rest, children)

  return {
    Text: createComponent('span'),
    XStack: createComponent('div'),
    YStack: createComponent('div'),
  }
})

const { QuickLinksWidget } = await import('../QuickLinksWidget')

const getRouteKeys = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-route-key]')).map(
    (element) => element.dataset.routeKey
  )

describe('QuickLinksWidget', () => {
  it('renders quick links for tier-3 office CMS routes', () => {
    render(<QuickLinksWidget currentPath={ROUTES.OFFICE_CMS_JOBS.path} />)

    expect(screen.getByTestId('quick-links-widget')).toBeInTheDocument()

    const routeKeys = getRouteKeys()
    expect(routeKeys).toEqual(['OFFICE_CMS_JOBS', 'OFFICE_CMS_JOBS_CREATE'])

    const createLink = document.querySelector<HTMLElement>(
      '[data-route-key="OFFICE_CMS_JOBS_CREATE"]'
    )
    expect(createLink?.dataset.href).toBe(ROUTES.OFFICE_CMS_JOBS_CREATE.path)
  })

  it('lists tier-3 children when the current route is tier-2', () => {
    render(<QuickLinksWidget currentPath={ROUTES.OFFICE_CMS.path} />)

    const routeKeys = getRouteKeys()
    expect(routeKeys).toEqual([
      'OFFICE_CMS_WELCOME',
      'OFFICE_CMS_WORKERS',
      'OFFICE_CMS_JOBS',
      'OFFICE_CMS_ORGANIZATIONS',
      'OFFICE_CMS_TEAMS',
      'OFFICE_CMS_UNIVERSITIES',
    ])
  })

  it('fills dynamic parameters for sibling routes in the same subtree', () => {
    const currentPath = buildRoute(ROUTES.OFFICE_CMS_TEAMS_EDIT, {
      id: 'team-42',
    })

    render(<QuickLinksWidget currentPath={currentPath} />)

    const routeKeys = getRouteKeys()
    expect(routeKeys).toEqual([
      'OFFICE_CMS_TEAMS_DETAIL',
      'OFFICE_CMS_TEAMS_EDIT',
      'OFFICE_CMS_TEAMS_ANALYTICS',
      'OFFICE_CMS_TEAMS_SETTINGS',
    ])

    const analyticsEntry = document.querySelector<HTMLElement>(
      '[data-route-key="OFFICE_CMS_TEAMS_ANALYTICS"]'
    )
    expect(analyticsEntry?.dataset.href).toBe('/office/cms/teams/team-42/analytics')
  })

  it('shows an empty state message when no quick links are available', () => {
    render(<QuickLinksWidget currentPath="/unknown" />)

    expect(screen.getByTestId('quick-links-widget')).toHaveTextContent('No quick links available.')
  })
})
