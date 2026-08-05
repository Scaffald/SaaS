import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')

  const Stack = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  const Card = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Separator = () => <hr />
  const Input = (props: { placeholder?: string }) => <input placeholder={props.placeholder} />
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
  const ModalActions = () => null

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

const { CalendarSchedulingScreen } = await import('../CalendarSchedulingScreen')

/**
 * The screen renders placeholder calendars, slots and links (#525). The lists
 * are the smaller problem — the larger one is that every write action is inert,
 * so "Propose Time" could make a user believe they had scheduled an interview
 * with a candidate who will never hear about it.
 *
 * When #540 wires this up and USES_SAMPLE_DATA goes away, replace these with
 * assertions about real slots — do not delete them quietly.
 */
describe('CalendarSchedulingScreen — sample data disclosure', () => {
  it('renders a notice that scheduling is not connected', () => {
    render(<CalendarSchedulingScreen />)

    expect(screen.getByText(/sample data — scheduling is not connected/i)).toBeInTheDocument()
    expect(screen.getByText(/nothing here is saved, and no candidate is contacted/i)).toBeInTheDocument()
  })

  it('disables every write action so no input is silently discarded', () => {
    render(<CalendarSchedulingScreen />)

    for (const name of [
      /propose time/i,
      /connect google/i,
      /connect outlook/i,
      /add availability/i,
      /create link/i,
      /copy/i,
    ]) {
      const buttons = screen.getAllByRole('button', { name })
      expect(buttons.length).toBeGreaterThan(0)
      for (const button of buttons) {
        expect(button).toBeDisabled()
      }
    }
  })

  it('derives the interview stat tiles rather than hardcoding them', () => {
    render(<CalendarSchedulingScreen />)

    // MOCK_SLOTS holds one proposed, one confirmed and one booked slot, and no
    // completed ones. The tiles used to read 3 / 1 / 12 — the 12 was invented.
    expect(screen.getByText('Upcoming').previousSibling).toHaveTextContent('3')
    expect(screen.getByText('Confirmed').previousSibling).toHaveTextContent('1')
    expect(screen.getByText('Completed').previousSibling).toHaveTextContent('0')
  })
})
