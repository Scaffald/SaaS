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
      return React.cloneElement(children, { href, 'data-href': href } as Record<string, unknown>)
    }

    return (
      <a href={href} data-href={href}>
        {children}
      </a>
    )
  },
}))

vi.mock('tamagui', () => {
  const createComponent =
    (tag: keyof JSX.IntrinsicElements & string) =>
    ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) =>
      React.createElement(tag, rest, children)

  const mockUseWindowDimensions = vi.fn(() => ({ width: 1440, height: 900 }))
  const useMedia = () => ({ sm: false })

  return {
    Button: createComponent('button'),
    ScrollView: createComponent('div'),
    XStack: createComponent('div'),
    YStack: createComponent('div'),
    Paragraph: createComponent('p'),
    useWindowDimensions: mockUseWindowDimensions,
    useMedia,
  }
})

const { OfficeTabs } = await import('../OfficeTabs')

describe('OfficeTabs', () => {
  const tabs = [
    { key: 'users', label: 'Manage Users', href: '/office/cms/users' },
    { key: 'jobs', label: 'Jobs', href: '/office/cms/jobs' },
    { key: 'teams', label: 'Teams', href: '/office/cms/teams' },
  ]

  it('renders tabs and highlights active route', () => {
    render(<OfficeTabs items={tabs} currentPath="/office/cms/jobs" />)

    const buttons = screen.getAllByRole('tab')
    expect(buttons).toHaveLength(3)

    const active = screen.getByRole('tab', { name: 'Jobs' })
    expect(active).toHaveAttribute('aria-selected', 'true')

    const inactive = screen.getByRole('tab', { name: 'Manage Users' })
    expect(inactive).toHaveAttribute('aria-selected', 'false')
  })

  it('passes href through to rendered anchors', () => {
    render(<OfficeTabs items={tabs} currentPath="/office/cms/users" />)

    const manageUsers = screen.getByRole('tab', { name: 'Manage Users' })
    expect(manageUsers).toHaveAttribute('data-href', '/office/cms/users')
  })

  it('supports explicit active state override', () => {
    const overrideTabs = [
      ...tabs,
      { key: 'reports', label: 'Reports', href: '/office/cms/reports', isActive: true },
    ]

    render(<OfficeTabs items={overrideTabs} currentPath="/office/cms/teams" />)

    const reports = screen.getByRole('tab', { name: 'Reports' })
    expect(reports).toHaveAttribute('aria-selected', 'true')
  })
})
