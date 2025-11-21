import { fireEvent, render, screen } from '@testing-library/react'
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

  const Accordion = ({
    children,
    ...rest
  }: { children?: React.ReactNode } & Record<string, unknown>) =>
    React.createElement('div', rest, children)
  Accordion.Item = createComponent('div')
  Accordion.Trigger = ({
    children,
    ...rest
  }: { children?: (props: { open: boolean }) => React.ReactNode } & Record<string, unknown>) => (
    <button {...rest} data-testid="accordion-trigger">
      {typeof children === 'function' ? children({ open: false }) : children}
    </button>
  )
  Accordion.Content = createComponent('div')

  return {
    Accordion,
    Button: createComponent('button'),
    Paragraph: createComponent('span'),
    YStack: createComponent('div'),
    XStack: createComponent('div'),
    ChevronDown: () => <span data-testid="chevron" />,
  }
})

const { OfficeAccordion } = await import('../OfficeAccordion')

describe('OfficeAccordion', () => {
  const sections = [
    {
      key: 'users',
      title: 'Manage Users',
      links: [
        { key: 'list', label: 'User List', href: '/office/cms/users' },
        { key: 'create', label: 'Create User', href: '/office/cms/users/create' },
      ],
      defaultOpen: true,
    },
    {
      key: 'jobs',
      title: 'Job Management',
      links: [{ key: 'list', label: 'Jobs', href: '/office/cms/jobs' }],
    },
  ]

  it('renders accordion sections and links', () => {
    render(<OfficeAccordion sections={sections} currentPath="/office/cms/users" />)

    expect(screen.getByText('Manage Users')).toBeInTheDocument()
    expect(screen.getByText('Job Management')).toBeInTheDocument()

    const userListButton = screen.getByRole('button', { name: /User List/i })
    expect(userListButton).toHaveAttribute('data-href', '/office/cms/users')
  })

  it('marks links active when matching current path', () => {
    render(<OfficeAccordion sections={sections} currentPath="/office/cms/users/create" />)

    const createButton = screen.getByRole('button', { name: /Create User/i })
    expect(createButton).toHaveAttribute('aria-selected', 'false')
    expect(createButton).toHaveAttribute('data-href', '/office/cms/users/create')
  })

  it('allows toggling sections open and closed', () => {
    render(<OfficeAccordion sections={sections} currentPath="/office/cms/users" />)

    const triggers = screen.getAllByTestId('accordion-trigger')
    expect(triggers.length).toBeGreaterThan(0)

    fireEvent.click(triggers[0])
  })
})
