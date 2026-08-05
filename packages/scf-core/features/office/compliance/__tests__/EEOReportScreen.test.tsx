import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')

  const Stack = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  const Card = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const H2 = ({ children }: { children?: ReactNode }) => <h2>{children}</h2>
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

  const TabsItem = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Tabs = Object.assign(({ children }: { children?: ReactNode }) => <div>{children}</div>, {
    Item: TabsItem,
    Trigger: ({ children }: { children?: ReactNode }) => <button type="button">{children}</button>,
    Content: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  })

  return {
    ...actual,
    Stack,
    Row: Stack,
    Text,
    Card,
    H2,
    Button,
    Tabs,
  }
})

const { EEOReportScreen } = await import('../EEOReportScreen')

/**
 * These assertions exist because the screen renders fabricated figures (#524).
 * They are not cosmetic: an EEO report is an artifact people file, so the
 * screen must be self-evidently not one until #535 wires real data.
 *
 * When #535 lands and USES_SAMPLE_DATA goes away, this whole describe block
 * should be replaced with assertions about real numbers — not deleted quietly.
 */
describe('EEOReportScreen — sample data disclosure', () => {
  it('renders a notice that the figures are not a compliance record', () => {
    render(<EEOReportScreen />)

    expect(screen.getByText(/sample data — not a compliance record/i)).toBeInTheDocument()
    expect(screen.getByText(/do not file, export, or cite these numbers/i)).toBeInTheDocument()
  })

  it('does not claim an active compliance status', () => {
    render(<EEOReportScreen />)

    // The screen used to render a green "Compliance Status: Active" banner with
    // a filing deadline. Nothing backed that claim.
    expect(screen.queryByText(/compliance status: active/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/next filing deadline/i)).not.toBeInTheDocument()
  })

  it('disables export so fabricated figures cannot become a document', () => {
    render(<EEOReportScreen />)

    const exportButton = screen.getByRole('button', { name: /export/i })
    expect(exportButton).toBeDisabled()
    expect(screen.queryByRole('button', { name: /^export report$/i })).not.toBeInTheDocument()
  })
})
