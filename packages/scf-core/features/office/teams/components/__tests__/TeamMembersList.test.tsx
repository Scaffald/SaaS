import { render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TestQueryWrapper } from '@test-helpers/test-utils'

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockShow = vi.fn()
const mockPush = vi.fn()

// Component now uses teams-sdk-hooks (5 named hooks).
vi.mock('@scf/core/utils/teams-sdk-hooks', () => ({
  useTeamMembers: (...args: unknown[]) => mockUseQuery(...args),
  useTeamWorkload: (...args: unknown[]) => mockUseQuery(...args),
  useTransferTeamOwnershipMutation: (...args: unknown[]) => mockUseMutation(...args),
  useSelfRemoveFromTeamMutation: (...args: unknown[]) => mockUseMutation(...args),
  useRemoveTeamMemberMutation: (...args: unknown[]) => mockUseMutation(...args),
}))

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@scf/core/utils/useUser', () => ({
  useUser: () => ({ user: { id: 'current-user-id' } }),
}))

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')

  const Stack = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  const Button = ({ children, onPress }: { children?: ReactNode; onPress?: () => void }) => (
    <button type="button" onClick={onPress}>
      {children}
    </button>
  )
  const Card = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Avatar = ({ children }: { children?: ReactNode; circular?: boolean; size?: string }) => (
    <div>{children}</div>
  )
  const AvatarImage = ({ source }: { source?: { uri?: string } }) => (
    <img src={source?.uri} alt="" />
  )
  const AvatarFallback = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  Avatar.Image = AvatarImage
  Avatar.Fallback = AvatarFallback

  const AlertDialogOverlay = () => <div data-testid="alert-overlay" />
  const AlertDialogContent = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const AlertDialogTitle = ({ children }: { children?: ReactNode }) => <h2>{children}</h2>
  const AlertDialogDescription = ({ children }: { children?: ReactNode }) => <p>{children}</p>
  const AlertDialogCancel = ({ children, asChild }: { children?: ReactNode; asChild?: boolean }) =>
    asChild ? (children as ReactElement) : <button type="button">{children}</button>
  const AlertDialogAction = ({ children, asChild }: { children?: ReactNode; asChild?: boolean }) =>
    asChild ? (children as ReactElement) : <button type="button">{children}</button>
  const AlertDialogPortal = ({ children }: { children?: ReactNode }) => children as ReactElement

  const AlertDialog = Object.assign(
    ({ open, children }: { open: boolean; children?: ReactNode }) =>
      open ? <div>{children}</div> : null,
    {
      Portal: AlertDialogPortal,
      Overlay: AlertDialogOverlay,
      Content: AlertDialogContent,
      Title: AlertDialogTitle,
      Description: AlertDialogDescription,
      Cancel: AlertDialogCancel,
      Action: AlertDialogAction,
    }
  )

  const TextArea = ({
    value,
    onChangeText,
    placeholder,
  }: {
    value?: string
    onChangeText?: (text: string) => void
    placeholder?: string
  }) => (
    <textarea
      value={value || ''}
      onChange={(e) => onChangeText?.(e.target.value)}
      placeholder={placeholder}
    />
  )
  const Spinner = () => <span>Loading</span>

  return {
    ...actual,
    Theme: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Stack: Stack,
    Row: Stack,
    Text,
    Button,
    Card,
    Avatar,
    TextArea,
    AlertDialog,
    Spinner,
    useMedia: () => ({ sm: false }),
    // Merged in from a second vi.mock('@scaffald/ui') that used to sit above.
    // Two registrations for one module race: whichever factory lost, the
    // component was missing either useToast or useThemeContext, which is why
    // this file failed roughly one run in three (#542).
    useToast: () => ({ show: mockShow }),
  }
})

vi.mock('lucide-react-native', () => ({
  Crown: () => <span data-testid="crown-icon">Crown</span>,
  LogOut: () => <span data-testid="log-out-icon">LogOut</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  UserMinus: () => <span data-testid="user-minus-icon">UserMinus</span>,
  Palette: () => <span data-testid="palette-icon">Palette</span>,
  Bell: () => <span data-testid="bell-icon">Bell</span>,
  HardDrive: () => <span data-testid="hard-drive-icon">HardDrive</span>,
  ClipboardCheck: () => <span data-testid="clipboard-check-icon">ClipboardCheck</span>,
  ShieldCheck: () => <span data-testid="shield-check-icon">ShieldCheck</span>,
  Users: () => <span data-testid="users-icon">Users</span>,
  Briefcase: () => <span data-testid="briefcase-icon">Briefcase</span>,
  GraduationCap: () => <span data-testid="graduation-cap-icon">GraduationCap</span>,
  Building2: () => <span data-testid="building2-icon">Building2</span>,
  FileText: () => <span data-testid="file-text-icon">FileText</span>,
}))

vi.mock('@scf/core/constants/routes', () => ({
  ROUTES: {
    OFFICE_APPLICATIONS: { path: '/office/applications', title: 'Applications' },
    OFFICE_TEAMS: { path: '/office/teams', title: 'Teams' },
  },
}))

vi.mock('../AddTeamMemberModal', () => ({
  AddTeamMemberModal: () => null,
}))

vi.mock('../RemoveMemberModal', () => ({
  RemoveMemberModal: () => null,
}))

vi.mock('../TeamMemberRoleSelect', () => ({
  TeamMemberRoleSelect: ({
    value,
    onValueChange,
  }: {
    value?: string
    onValueChange?: (value: string) => void
  }) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      <option value="role-1">Member</option>
    </select>
  ),
}))

vi.mock('../../hooks/useTeamFormOptions', () => ({
  useTeamFormOptions: () => ({
    roles: [{ id: 'role-1', key: 'member', name: 'Member' }],
    isLoading: false,
  }),
}))

const { TeamMembersList } = await import('../TeamMembersList')

describe('TeamMembersList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMutation.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    })
    mockUseQuery.mockReturnValue({
      data: {
        members: [
          {
            id: 'member-1',
            userId: 'user-1',
            status: 'active',
            role: { id: 'role-1', key: 'member', name: 'Member' },
            user: { id: 'user-1', displayName: 'Test User', username: 'testuser' },
          },
        ],
      },
      isLoading: false,
    })
  })

  it('renders member list with roles', () => {
    render(<TeamMembersList teamId="team-1" organizationId="org-1" />, { wrapper: TestQueryWrapper })

    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('displays member roles correctly', () => {
    render(<TeamMembersList teamId="team-1" organizationId="org-1" />, { wrapper: TestQueryWrapper })

    // Check that member role is displayed (there may be multiple "Member" texts)
    const memberTexts = screen.getAllByText(/Member/i)
    expect(memberTexts.length).toBeGreaterThan(0)
  })

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    render(<TeamMembersList teamId="team-1" organizationId="org-1" />, { wrapper: TestQueryWrapper })

    // Check for spinner (which renders "Loading" text)
    const loadingElements = screen.getAllByText(/Loading/i)
    expect(loadingElements.length).toBeGreaterThan(0)
  })
})
