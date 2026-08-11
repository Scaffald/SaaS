import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')

  const Stack = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  const Card = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Separator = () => <hr />
  const Input = (props: {
    placeholder?: string
    value?: string
    onChangeText?: (t: string) => void
  }) => (
    <input
      placeholder={props.placeholder}
      value={props.value ?? ''}
      onChange={(e) => props.onChangeText?.(e.target.value)}
    />
  )
  const Toggle = () => <input type="checkbox" />
  const Button = ({
    children,
    onPress,
    disabled,
  }: {
    children?: ReactNode
    onPress?: () => void
    disabled?: boolean
  }) => (
    <button type="button" onClick={onPress} disabled={disabled}>
      {children}
    </button>
  )

  const DashboardWidget = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const DashboardWidgetHeader = ({ title, action }: { title?: string; action?: ReactNode }) => (
    <div>
      <span>{title}</span>
      {action}
    </div>
  )

  const Modal = ({ children, visible }: { children?: ReactNode; visible?: boolean }) =>
    visible ? <div>{children}</div> : null
  const ModalHeader = ({ title }: { title?: string }) => <div>{title}</div>
  const ModalContent = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  // Rendered, unlike the previous version of this mock. The submit path is the
  // thing worth testing here — it used to be inert.
  const ModalActions = ({
    primaryAction,
    secondaryAction,
  }: {
    primaryAction?: { label: string; onPress: () => void }
    secondaryAction?: { label: string; onPress: () => void }
  }) => (
    <div>
      {primaryAction && (
        <button type="button" onClick={primaryAction.onPress}>
          {primaryAction.label}
        </button>
      )}
      {secondaryAction && (
        <button type="button" onClick={secondaryAction.onPress}>
          {secondaryAction.label}
        </button>
      )}
    </div>
  )

  const Tabs = Object.assign(({ children }: { children?: ReactNode }) => <div>{children}</div>, {
    Item: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    Trigger: ({ children }: { children?: ReactNode }) => <button type="button">{children}</button>,
    Content: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  })

  return {
    ...actual,
    Stack,
    Row: Stack,
    Text,
    Card,
    Separator,
    Input,
    Toggle,
    Button,
    DashboardWidget,
    DashboardWidgetHeader,
    Modal,
    ModalHeader,
    ModalContent,
    ModalActions,
    Tabs,
  }
})

const slotMutate = vi.fn()
const linkMutate = vi.fn()
const slotsQuery = {
  data: [] as unknown[],
  isLoading: false,
  isError: false,
  error: null as Error | null,
}
const linksQuery = {
  data: [] as unknown[],
  isLoading: false,
  isError: false,
  error: null as Error | null,
}
const applicationsQuery = { data: { data: [] as unknown[] }, isLoading: false }

vi.mock('@scf/core/utils/scheduling-sdk-hooks', () => ({
  useEmployerInterviewSlots: () => slotsQuery,
  useEmployerSchedulingLinks: () => linksQuery,
  useCreateInterviewSlotMutation: () => ({ mutate: slotMutate, isPending: false }),
  useCreateSchedulingLinkMutation: () => ({ mutate: linkMutate, isPending: false }),
}))

vi.mock('@scf/core/utils/applications-sdk-hooks', () => ({
  useEmployerApplications: () => applicationsQuery,
}))

const { CalendarSchedulingScreen } = await import('../CalendarSchedulingScreen')

const APPLICATION = {
  id: 'app_1',
  candidate: { first_name: 'Dana', last_name: 'Reyes' },
  job: { title: 'Commercial Electrician' },
}

const SLOT = {
  id: 'slot_1',
  application_id: 'app_1',
  organization_id: 'org_1',
  proposed_by: 'user_1',
  slot_start: '2026-09-01T10:00:00Z',
  slot_end: '2026-09-01T11:00:00Z',
  timezone: 'UTC',
  location_type: 'video',
  location_details: null,
  meeting_link: null,
  status: 'proposed',
  notes: null,
  created_at: '2026-08-11T00:00:00Z',
}

function link(overrides: Record<string, unknown> = {}) {
  return {
    id: 'link_1',
    application_id: 'app_1',
    organization_id: 'org_1',
    token: 'abcdef0123456789',
    expires_at: '2026-09-30T00:00:00Z',
    max_bookings: 1,
    current_bookings: 0,
    is_active: true,
    created_at: '2026-08-11T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-08-11T00:00:00Z'))
  slotMutate.mockReset()
  linkMutate.mockReset()
  slotsQuery.data = []
  slotsQuery.isLoading = false
  slotsQuery.isError = false
  linksQuery.data = []
  linksQuery.isLoading = false
  linksQuery.isError = false
  applicationsQuery.data = { data: [] }
  applicationsQuery.isLoading = false
})

afterEach(() => {
  vi.useRealTimers()
})

/**
 * These replace the sample-data assertions this file used to hold. Slots and
 * links now come from `/v1/employer/scheduling`; calendar connections and
 * availability windows are still placeholders, and the notice narrowed to say
 * so rather than disappearing.
 */
describe('CalendarSchedulingScreen — real scheduling data', () => {
  it('renders slots from the API, with the candidate name resolved from the application', () => {
    slotsQuery.data = [SLOT]
    applicationsQuery.data = { data: [APPLICATION] }

    render(<CalendarSchedulingScreen />)

    // The scheduling tables carry application_id and nothing about the person,
    // so a missing join shows up as a slot with no name against it.
    expect(screen.getByText('Dana Reyes')).toBeInTheDocument()
  })

  it('says so when there are no interviews rather than rendering an empty box', () => {
    render(<CalendarSchedulingScreen />)

    expect(screen.getByText(/no interviews proposed yet/i)).toBeInTheDocument()
  })

  it('derives the stat tiles from real slots', () => {
    slotsQuery.data = [
      SLOT,
      { ...SLOT, id: 'slot_2', status: 'confirmed' },
      { ...SLOT, id: 'slot_3', status: 'completed' },
      // `no_show` has no place in this screen's union; it reads as finished,
      // not upcoming.
      { ...SLOT, id: 'slot_4', status: 'no_show' },
    ]

    render(<CalendarSchedulingScreen />)

    expect(screen.getByText('Upcoming').previousSibling).toHaveTextContent('2')
    expect(screen.getByText('Confirmed').previousSibling).toHaveTextContent('1')
    expect(screen.getByText('Completed').previousSibling).toHaveTextContent('2')
  })

  it('shows the route a candidate can actually open', () => {
    linksQuery.data = [link()]

    render(<CalendarSchedulingScreen />)

    // The mock rendered `schedule.scaffald.com/<token>`, a host that does not
    // exist — a recruiter who copied it sent a dead link. The real route is
    // /schedule/[token].
    expect(screen.getByText(/\/schedule\/abcdef0123456789$/)).toBeInTheDocument()
    expect(screen.queryByText(/schedule\.scaffald\.com/)).not.toBeInTheDocument()
  })

  it('calls an expired link expired even while is_active is still true', () => {
    // `is_active` is the employer's kill switch, not the clock. Reading it
    // alone labels a link the candidate can no longer redeem as "Active".
    linksQuery.data = [link({ expires_at: '2026-08-01T00:00:00Z', is_active: true })]

    render(<CalendarSchedulingScreen />)

    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
  })
})

/**
 * The modal's submit button carries the same label as the button that opened
 * it. The modal renders after them in the tree, so the last match is the
 * submit.
 */
function submitButton(name: RegExp) {
  const buttons = screen.getAllByRole('button', { name })
  return buttons[buttons.length - 1]!
}

describe('CalendarSchedulingScreen — write paths', () => {
  it('proposes a slot with slot_end derived from the duration', () => {
    applicationsQuery.data = { data: [APPLICATION] }
    render(<CalendarSchedulingScreen />)

    fireEvent.click(screen.getAllByRole('button', { name: /propose time/i })[0]!)
    fireEvent.click(screen.getByText('Dana Reyes'))
    fireEvent.change(screen.getByPlaceholderText('2026-09-01 10:00'), {
      target: { value: '2026-09-01T10:00:00Z' },
    })
    fireEvent.change(screen.getByPlaceholderText('30'), { target: { value: '45' } })
    fireEvent.click(submitButton(/^propose time$/i))

    expect(slotMutate).toHaveBeenCalledTimes(1)
    const params = slotMutate.mock.calls[0]![0]
    expect(params).toMatchObject({
      application_id: 'app_1',
      slot_start: '2026-09-01T10:00:00.000Z',
      slot_end: '2026-09-01T10:45:00.000Z',
      location_type: 'video',
    })
  })

  it('refuses to propose a slot with no application rather than posting a bad request', () => {
    render(<CalendarSchedulingScreen />)

    fireEvent.click(screen.getAllByRole('button', { name: /propose time/i })[0]!)
    fireEvent.click(submitButton(/^propose time$/i))

    expect(slotMutate).not.toHaveBeenCalled()
    expect(screen.getByText(/choose an application first/i)).toBeInTheDocument()
  })

  it('refuses an unparseable start time', () => {
    applicationsQuery.data = { data: [APPLICATION] }
    render(<CalendarSchedulingScreen />)

    fireEvent.click(screen.getAllByRole('button', { name: /propose time/i })[0]!)
    fireEvent.click(screen.getByText('Dana Reyes'))
    fireEvent.change(screen.getByPlaceholderText('2026-09-01 10:00'), {
      target: { value: 'next tuesday' },
    })
    fireEvent.click(submitButton(/^propose time$/i))

    expect(slotMutate).not.toHaveBeenCalled()
    expect(screen.getByText(/enter a start time/i)).toBeInTheDocument()
  })

  it('creates a link with expires_at computed from the day count, and no token', () => {
    applicationsQuery.data = { data: [APPLICATION] }
    render(<CalendarSchedulingScreen />)

    fireEvent.click(screen.getAllByRole('button', { name: /create link/i })[0]!)
    fireEvent.click(screen.getByText('Dana Reyes'))
    fireEvent.click(submitButton(/^create link$/i))

    expect(linkMutate).toHaveBeenCalledTimes(1)
    const params = linkMutate.mock.calls[0]![0]
    // 7 days from the faked clock.
    expect(params.expires_at).toBe('2026-08-18T00:00:00.000Z')
    expect(params.application_id).toBe('app_1')
    // Server-generated. A client-chosen token would be a guessable URL.
    expect(params).not.toHaveProperty('token')
  })
})

describe('CalendarSchedulingScreen — what is still sample data', () => {
  it('scopes the notice to calendars, not the whole screen', () => {
    render(<CalendarSchedulingScreen />)

    expect(screen.getByText(/sample data — no calendar is connected/i)).toBeInTheDocument()
    // The old copy claimed slots and links were placeholders too. They are not.
    expect(
      screen.queryByText(/sample data — scheduling is not connected/i)
    ).not.toBeInTheDocument()
  })

  it('keeps the calendar write actions disabled, since OAuth does not exist yet', () => {
    render(<CalendarSchedulingScreen />)

    for (const name of [/connect google/i, /connect outlook/i, /add availability/i]) {
      const buttons = screen.getAllByRole('button', { name })
      expect(buttons.length).toBeGreaterThan(0)
      for (const button of buttons) {
        expect(button).toBeDisabled()
      }
    }
  })

  it('no longer disables the scheduling write actions', () => {
    linksQuery.data = [link()]
    render(<CalendarSchedulingScreen />)

    for (const name of [/propose time/i, /create link/i, /^copy$/i]) {
      const buttons = screen.getAllByRole('button', { name })
      expect(buttons.length).toBeGreaterThan(0)
      for (const button of buttons) {
        expect(button).not.toBeDisabled()
      }
    }
  })
})
