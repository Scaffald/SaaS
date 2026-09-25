import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CertificationsWidget } from '../CertificationsWidget'
import { EducationWidget } from '../EducationWidget'
import { ExperienceWidget } from '../ExperienceWidget'
import { SoftSkillsComparisonWidget } from '../SoftSkillsComparisonWidget'
import { TechnicalSkillsWidget } from '../TechnicalSkillsWidget'

const OWNER_ID = 'owner-1'
const VISITOR_ID = 'visitor-1'

const mocks = vi.hoisted(() => ({
  sessionUserId: 'owner-1' as string | null,
  empty: { data: [], isLoading: false, isPending: false, error: null, refetch: vi.fn(), isFetching: false },
  softSkills: { data: null as unknown, isPending: false, error: null },
}))

vi.mock('@scf/core/utils/supabase/useSessionContext', () => ({
  useSessionContext: () => ({
    session: mocks.sessionUserId ? { user: { id: mocks.sessionUserId } } : null,
  }),
}))

vi.mock('@scf/core/utils/profile-widgets-sdk-hooks', () => ({
  useCertificationsWidget: () => mocks.empty,
  useEducationWidget: () => mocks.empty,
  useExperienceWidget: () => mocks.empty,
  useSkillsWidget: () => mocks.empty,
}))

vi.mock('@scf/core/utils/profile-skills-sdk-hooks', () => ({
  useSoftSkills: () => mocks.softSkills,
  useSoftSkillsComparison: () => ({ data: null }),
}))

vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@scaffald/ui')
  const Box = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  return {
    ...actual,
    Stack: Box,
    Row: Box,
    Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
    DashboardWidget: ({ children }: { children?: ReactNode }) => (
      <div data-testid="dashboard-widget">{children}</div>
    ),
    DashboardWidgetHeader: ({ title }: { title?: string }) => <h3>{title}</h3>,
    EmptyState: ({ title, description }: { title?: string; description?: string }) => (
      <div>
        {title}
        {description}
      </div>
    ),
  }
})

const widgets = [
  ['CertificationsWidget', CertificationsWidget],
  ['EducationWidget', EducationWidget],
  ['ExperienceWidget', ExperienceWidget],
  ['TechnicalSkillsWidget', TechnicalSkillsWidget],
  ['SoftSkillsComparisonWidget', SoftSkillsComparisonWidget],
] as const

describe('profile widgets with nothing on file', () => {
  beforeEach(() => {
    mocks.softSkills = { data: null, isPending: false, error: null }
  })

  describe.each(widgets)('%s', (_name, Widget) => {
    it('keeps the owner prompt when the owner is reading', () => {
      mocks.sessionUserId = OWNER_ID
      render(<Widget userId={OWNER_ID} showEdit />)
      expect(screen.getByTestId('dashboard-widget')).toBeTruthy()
      expect(screen.getByText(/your/i)).toBeTruthy()
    })

    it('renders nothing when someone else is reading', () => {
      mocks.sessionUserId = VISITOR_ID
      const { container } = render(<Widget userId={OWNER_ID} showEdit={false} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders nothing for a signed-out reader', () => {
      mocks.sessionUserId = null
      const { container } = render(<Widget userId={OWNER_ID} showEdit={false} />)
      expect(container.firstChild).toBeNull()
    })
  })

  it('hides a partly rated soft skills assessment from a visitor', () => {
    mocks.sessionUserId = VISITOR_ID
    mocks.softSkills = {
      data: { skills: [{ id: 's1', name: 'Punctuality', category: 'reliability', rating: 4 }] },
      isPending: false,
      error: null,
    }
    const { container } = render(<SoftSkillsComparisonWidget userId={OWNER_ID} />)
    expect(container.firstChild).toBeNull()
  })
})
