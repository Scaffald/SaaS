import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const SelectChangeContext = createContext<(value: string) => void>(() => {})

// Single merged @scaffald/ui mock. Previously this file declared two
// vi.mock('@scaffald/ui', ...) calls; only the last won, dropping the
// ResponsiveSelect stub and surfacing the real component (which doesn't
// expose the data-testid the test queries).
vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual<typeof import('@scaffald/ui')>('@scaffald/ui')

  const SelectRoot = ({
    value,
    onValueChange,
    children,
  }: {
    value: string | null
    onValueChange: (value: string) => void
    children: ReactNode
  }) => (
    <SelectChangeContext.Provider value={onValueChange}>
      <div data-testid="select-root" data-value={value ?? 'null'}>
        {children}
      </div>
    </SelectChangeContext.Provider>
  )

  SelectRoot.Trigger = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectRoot.Value = ({
    placeholder,
    children,
  }: {
    placeholder?: string
    children?: ReactNode
  }) => <span>{children ?? placeholder ?? ''}</span>
  SelectRoot.Content = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectRoot.Viewport = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectRoot.Group = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectRoot.Label = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectRoot.ScrollUpButton = () => null
  SelectRoot.ScrollDownButton = () => null

  SelectRoot.Item = ({ value, children }: { value: string; children: ReactNode }) => {
    const onValueChange = useContext(SelectChangeContext)
    return (
      <button
        type="button"
        data-testid={`select-item-${value || 'all'}`}
        onClick={() => onValueChange(value)}
      >
        {children}
      </button>
    )
  }

  SelectRoot.ItemText = ({ children }: { children: ReactNode }) => <span>{children}</span>
  SelectRoot.ItemIndicator = ({ children }: { children: ReactNode }) => <span>{children}</span>

  return {
    ...actual,
    Row: ({ children }: { children: ReactNode }) => <div data-testid="xstack">{children}</div>,
    Stack: ({ children }: { children: ReactNode }) => <div data-testid="ystack">{children}</div>,
    Text: ({ children }: { children: ReactNode }) => <span>{children}</span>,
    Button: ({
      children,
      onPress,
      chromeless: _chromeless,
      ...rest
    }: {
      children: ReactNode
      onPress?: () => void
      chromeless?: boolean
    }) => (
      <button type="button" onClick={onPress} {...rest}>
        {children}
      </button>
    ),
    ResponsiveSelect: ({
      value,
      onValueChange,
      options,
      placeholder,
      'data-testid': dataTestId,
      testID,
    }: {
      value?: string | null
      onValueChange: (value: string) => void
      options: Array<{ value: string; label: string }>
      placeholder?: string
      'data-testid'?: string
      testID?: string
    }) => (
      <select
        data-testid={dataTestId ?? testID ?? 'responsive-select'}
        value={value ?? ''}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
    Select: SelectRoot,
  }
})

const { ApplicationsFilters } = await import('../ApplicationsFilters')

describe('ApplicationsFilters', () => {
  const onFiltersChange = vi.fn()
  const defaultFilters = { jobId: null, status: null, minScore: 20 }
  const jobs = [
    { id: 'job-1', title: 'Electrician', company: 'ACME' },
    { id: 'job-2', title: 'Plumber', company: 'ACME' },
  ]

  beforeEach(() => {
    onFiltersChange.mockReset()
  })

  it('updates filters when job or status changes', async () => {
    const user = userEvent.setup()

    render(
      <ApplicationsFilters filters={defaultFilters} onFiltersChange={onFiltersChange} jobs={jobs} />
    )

    const selects = screen.getAllByTestId('responsive-select') as HTMLSelectElement[]
    await user.selectOptions(selects[0], 'job-1')
    expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, jobId: 'job-1' })

    await user.selectOptions(selects[1], 'interview')
    expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, status: 'interview' })
  })

  // The "resets filters when Clear Filters pressed" test used to sit here.
  // #624 moved clear-all out of the filter body and onto the chip strip, so
  // there is no such button in this component any more. The assertion lives on
  // in filters.test.ts, under `describe('clear-all')`.
})
