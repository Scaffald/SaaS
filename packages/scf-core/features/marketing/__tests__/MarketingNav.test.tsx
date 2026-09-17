import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MarketingNav } from '../components/MarketingNav'

vi.mock('expo-router', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@scaffald/ui', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useResponsive: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}))

const hydrated = vi.fn<() => boolean>(() => true)
vi.mock('../../../hooks/useHydrated', () => ({
  useHydrated: () => hydrated(),
}))

const authStatus = vi.fn(() => ({ isAuthenticated: false, isLoading: false, isLoggedOut: true }))
vi.mock('../../../provider/auth/useAuth', () => ({
  useAuthStatus: () => authStatus(),
}))

const linkHrefs = () =>
  screen.getAllByRole('link').map((a) => [a.textContent?.trim(), a.getAttribute('href')])

describe('MarketingNav', () => {
  beforeEach(() => {
    hydrated.mockReturnValue(true)
    authStatus.mockReturnValue({ isAuthenticated: false, isLoading: false, isLoggedOut: true })
  })

  it('links to the jobs listing and the landing sections, and offers sign in to a visitor', () => {
    render(<MarketingNav sectionBasePath="/" />)

    expect(linkHrefs()).toEqual(
      expect.arrayContaining([
        ['Jobs', '/jobs'],
        ['How it works', '/#how-it-works'],
        ['Sign in', '/auth'],
        ['Get started', '/auth?intent=worker'],
      ])
    )
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('replaces the sign-in area with a Dashboard link once a signed-in session has hydrated', () => {
    authStatus.mockReturnValue({ isAuthenticated: true, isLoading: false, isLoggedOut: false })
    render(<MarketingNav />)

    expect(linkHrefs()).toEqual(expect.arrayContaining([['Dashboard', '/dashboard']]))
    expect(screen.queryByText('Sign in')).not.toBeInTheDocument()
    expect(screen.queryByText('Get started')).not.toBeInTheDocument()
  })

  it('renders signed-out chrome before hydration even when a session is already present, so the client tree matches the server', () => {
    hydrated.mockReturnValue(false)
    authStatus.mockReturnValue({ isAuthenticated: true, isLoading: false, isLoggedOut: false })
    render(<MarketingNav />)

    expect(screen.getByText('Sign in')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('section links are bare fragments on the landing page itself', () => {
    render(<MarketingNav />)
    expect(linkHrefs()).toEqual(expect.arrayContaining([['FAQs', '#faq']]))
  })
})
