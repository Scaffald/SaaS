import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const SelectChangeContext = createContext<(value: string) => void>(() => {})

vi.mock('@scaffald/neue-ui', () => ({
  XStack: ({ children }: { children: ReactNode }) => <div data-testid="xstack">{children}</div>,
  YStack: ({ children }: { children: ReactNode }) => <div data-testid="ystack">{children}</div>,
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
}))

vi.mock('tamagui', async () => {
  const actual = await vi.importActual<typeof import('tamagui')>('tamagui')

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

  it('resets filters when Clear Filters pressed', async () => {
    const user = userEvent.setup()

    render(
      <ApplicationsFilters
        filters={{ jobId: 'job-1', status: 'offer', minScore: 50 }}
        onFiltersChange={onFiltersChange}
        jobs={jobs}
      />
    )

    await user.click(screen.getByRole('button', { name: /clear filters/i }))

    expect(onFiltersChange).toHaveBeenCalledWith({ jobId: null, status: null, minScore: 0 })
  })
})
