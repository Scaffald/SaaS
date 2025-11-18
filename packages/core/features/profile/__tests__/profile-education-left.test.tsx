import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfileEducationLeft } from '../profile-education-left'

const mockInvalidateProfileQueries = vi.fn()
const mockToastShow = vi.fn()
const mockMutateCalls: Array<Record<string, unknown>> = []

const educationQueryHelpers = {
  cancel: vi.fn().mockResolvedValue(undefined),
  getData: vi.fn(() => []),
  setData: vi.fn(),
  invalidate: vi.fn(),
}

const educationLevelQueryHelpers = {
  cancel: vi.fn().mockResolvedValue(undefined),
  getData: vi.fn(() => ({ education_level: null })),
  setData: vi.fn(),
}

const mutateAsyncSpy = vi.fn(async (input: Record<string, unknown>) => {
  mockMutateCalls.push(input)
  return { success: true, education_entries: [] }
})

vi.mock('../utils/profile-sync-store', () => ({
  startProfileSync: vi.fn(),
  completeProfileSync: vi.fn(),
  failProfileSync: vi.fn(),
  resetProfileSyncError: vi.fn(),
  useAdaptiveProfileSync: () => 'idle',
}))

vi.mock('../utils/profile-sync', () => ({
  invalidateProfileQueries: (...args: unknown[]) => mockInvalidateProfileQueries(...args),
}))

vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({
    show: mockToastShow,
  }),
}))

vi.mock('@tamagui/lucide-icons', () => ({
  Plus: () => null,
  X: () => null,
  ChevronDown: () => null,
}))

vi.mock('@app/ui', () => {
  const React = require('react') as typeof import('react')

  const createView =
    (element = 'div') =>
    React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ children, ...rest }, ref) =>
      React.createElement(element, { ref, ...rest }, children),
    )

  const Button = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<'button'> & {
      onPress?: () => void
      'data-testid'?: string
    }
  >(({ children, onPress, 'data-testid': dataTestId, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onPress}
      data-testid={dataTestId}
      {...rest}
    >
      {children}
    </button>
  ))

  const Input = React.forwardRef<
    HTMLInputElement,
    React.ComponentPropsWithoutRef<'input'> & { onChangeText?: (value: string) => void }
  >(({ onChangeText, ...rest }, ref) => (
    <input
      ref={ref}
      {...rest}
      onChange={(event) => onChangeText?.(event.target.value)}
    />
  ))

  const TextArea = React.forwardRef<
    HTMLTextAreaElement,
    React.ComponentPropsWithoutRef<'textarea'> & { onChangeText?: (value: string) => void }
  >(({ onChangeText, ...rest }, ref) => (
    <textarea
      ref={ref}
      {...rest}
      onChange={(event) => onChangeText?.(event.target.value)}
    />
  ))

  const CustomCheckbox = ({
    checked,
    onCheckedChange,
    'aria-label': ariaLabel,
  }: {
    checked?: boolean
    onCheckedChange: (checked: boolean) => void
    'aria-label'?: string
    testID?: string
  }) => (
    <label>
      <input
        type="checkbox"
        aria-label={ariaLabel}
        checked={Boolean(checked)}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      {ariaLabel}
    </label>
  )

  const UniversityAutocomplete = ({
    value,
    onChange,
    placeholder,
    error,
  }: {
    value?: string
    onChange?: (next: string) => void
    onUniversitySelect?: (university: { id: string; name: string }) => void
    onSearch?: (query: string) => void
    results?: Array<{ id: string; name: string }>
    loading?: boolean
    searchError?: string
    placeholder?: string
    error?: string
  }) => (
    <div>
      <input
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {error ? <span>{error}</span> : null}
    </div>
  )

  const MonthYearPicker = ({
    value,
    onChange,
    label,
    disabled,
    error,
  }: {
    value: Date | null
    onChange: (date: Date | null) => void
    label?: string
    disabled?: boolean
    error?: string
  }) => {
    const inputId = React.useId()

    return (
      <div>
        {label ? <label htmlFor={inputId}>{label}</label> : null}
        <input
          id={label ? inputId : undefined}
          aria-label={label}
          type="month"
          disabled={disabled}
          value={value ? value.toISOString().slice(0, 7) : ''}
          onChange={(event) => {
            const nextValue = event.target.value
            onChange(nextValue ? new Date(`${nextValue}-01T12:00:00Z`) : null)
          }}
        />
        {error ? <span>{error}</span> : null}
      </div>
    )
  }

  const FieldError = ({ message }: { message?: string }) =>
    message ? <span>{message}</span> : null

  return {
    DashboardWidget: createView(),
    UIButton: Button,
    CustomCheckbox,
    UniversityAutocomplete,
    ConfirmationDialog: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    MonthYearPicker,
    FieldError,
    TextArea,
    Input,
  }
})

vi.mock('tamagui', () => {
  const React = require('react') as typeof import('react')

  const createView =
    (element = 'div') =>
    React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ children, ...rest }, ref) =>
      React.createElement(element, { ref, ...rest }, children),
    )

  const Button = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<'button'> & { onPress?: () => void }
  >(({ children, onPress, ...rest }, ref) => (
    <button ref={ref} type="button" onClick={onPress} {...rest}>
      {children}
    </button>
  ))

  const PopoverRoot = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  const PopoverTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>
  const PopoverContent = ({
    children,
  }: {
    children: React.ReactNode
  }) => <div>{children}</div>

  const ScrollView = createView()

  return {
    YStack: createView(),
    XStack: createView(),
    Text: createView('span'),
    H4: createView('h4'),
    Label: createView('label'),
    Input: React.forwardRef<
      HTMLInputElement,
      React.ComponentPropsWithoutRef<'input'> & { onChangeText?: (value: string) => void }
    >(({ onChangeText, ...rest }, ref) => (
      <input
        ref={ref}
        {...rest}
        onChange={(event) => onChangeText?.(event.target.value)}
      />
    )),
    TextArea: React.forwardRef<
      HTMLTextAreaElement,
      React.ComponentPropsWithoutRef<'textarea'> & { onChangeText?: (value: string) => void }
    >(({ onChangeText, ...rest }, ref) => (
      <textarea
        ref={ref}
        {...rest}
        onChange={(event) => onChangeText?.(event.target.value)}
      />
    )),
    Button,
    Spinner: () => <div>spinner</div>,
    Popover: Object.assign(PopoverRoot, {
      Trigger: PopoverTrigger,
      Content: PopoverContent,
    }),
    ScrollView,
    Separator: () => <hr />,
    useWindowDimensions: () => ({ width: 1024, height: 768 }),
  }
})

vi.mock('@app/core/utils/api', () => {
  const educationQuery = {
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }
  const educationLevelQuery = {
    data: { education_level: null },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }

  return {
    api: {
      profile: {
        getEducation: {
          useQuery: () => educationQuery,
        },
        getEducationLevel: {
          useQuery: () => educationLevelQuery,
        },
        saveEducation: {
          useMutation: (options?: {
            onMutate?: (input: Record<string, unknown>) => Promise<unknown> | unknown
            onSuccess?: (
              result: { success: boolean; education_entries: unknown[] },
              input: Record<string, unknown>,
              context: unknown,
            ) => Promise<void> | void
            onSettled?: (
              result: { success: boolean; education_entries: unknown[] } | undefined,
              error: unknown,
              context: unknown,
            ) => Promise<void> | void
          }) => ({
            mutateAsync: async (input: Record<string, unknown>) => {
              const context = (await options?.onMutate?.(input)) ?? undefined
              const result = { success: true, education_entries: [] as unknown[] }
              await options?.onSuccess?.(result, input, context)
              await options?.onSettled?.(result, undefined, context)
              await mutateAsyncSpy(input)
              return result
            },
            isLoading: false,
          }),
        },
      },
      office: {
        universities: {
          searchUniversities: {
            useQuery: () => ({
              data: { universities: [] },
              isLoading: false,
              error: null,
            }),
          },
        },
      },
      useContext: () => ({
        profile: {
          getEducation: educationQueryHelpers,
          getEducationLevel: educationLevelQueryHelpers,
        },
      }),
    },
  }
})

const addEducationEntry = () => {
  fireEvent.click(screen.getByText('Add Education'))
}

const toggleManualEntry = () => {
  fireEvent.click(screen.getByText("Can't find your institution? Enter it manually"))
}

const selectOption = (label: string) => {
  const optionButtons = screen.getAllByRole('button', { name: label })
  fireEvent.click(optionButtons[optionButtons.length - 1])
}

const fillRequiredEducationFields = () => {
  fireEvent.change(screen.getByPlaceholderText('Enter institution name'), {
    target: { value: 'Manual University' },
  })

  const startPicker = screen.getByLabelText('Start Date')
  fireEvent.change(startPicker, { target: { value: '2020-01' } })

  fireEvent.click(screen.getByLabelText('Currently enrolled'))

  const expectedPicker = screen.getByLabelText('Expected Graduation Date')
  fireEvent.change(expectedPicker, { target: { value: '2024-12' } })

  fireEvent.change(screen.getByPlaceholderText('e.g. Computer Science'), {
    target: { value: 'Electrical Engineering' },
  })

  const gpaInput = screen.getByPlaceholderText('e.g. 3.5 (0.0 - 4.0)')
  fireEvent.change(gpaInput, { target: { value: '3.4' } })
  fireEvent.blur(gpaInput)
}

describe('ProfileEducationLeft', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutateCalls.length = 0
  })

  it('allows toggling to manual institution entry and back to catalog search', () => {
    render(<ProfileEducationLeft />)

    addEducationEntry()

    expect(screen.getByPlaceholderText('Search for institution...')).toBeInTheDocument()

    toggleManualEntry()
    expect(screen.getByPlaceholderText('Enter institution name')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Search from catalog instead'))
    expect(screen.getByPlaceholderText('Search for institution...')).toBeInTheDocument()
  })

  it('submits manual entry with custom degree type selections', async () => {
    render(<ProfileEducationLeft />)

    addEducationEntry()
    toggleManualEntry()

    fillRequiredEducationFields()

    selectOption('Other')
    fireEvent.change(screen.getByPlaceholderText('Specify degree type'), {
      target: { value: 'International Diploma' },
    })

    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => expect(mutateAsyncSpy).toHaveBeenCalledTimes(1), { timeout: 1500 })

    const payload = mockMutateCalls[0] as {
      education_entries: Array<Record<string, unknown>>
    }

    const entry = payload.education_entries[0]
    expect(entry).toMatchObject({
      institution_name: 'Manual University',
      university_id: null,
      is_verified: false,
      degree_type: 'Other',
      custom_degree_type: 'International Diploma',
      is_current: true,
      start_date: '2020-01-01',
      expected_graduation_date: '2024-12-01',
    })
  })

  it('clears custom degree input when selecting a standard degree option', async () => {
    render(<ProfileEducationLeft />)

    addEducationEntry()
    toggleManualEntry()
    fillRequiredEducationFields()

    selectOption('Other')
    fireEvent.change(screen.getByPlaceholderText('Specify degree type'), {
      target: { value: 'Special Program' },
    })

    selectOption('Bachelor Degree')
    expect(screen.queryByPlaceholderText('Specify degree type')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => expect(mutateAsyncSpy).toHaveBeenCalledTimes(1), { timeout: 1500 })

    const payload = mockMutateCalls[0] as {
      education_entries: Array<Record<string, unknown>>
    }
    const entry = payload.education_entries[0]

    expect(entry).toMatchObject({
      degree_type: 'Bachelor Degree',
      custom_degree_type: undefined,
    })
  })

  it('surfaces validation summary when required fields are missing', async () => {
    render(<ProfileEducationLeft />)

    addEducationEntry()
    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(
      () => {
        expect(screen.getByText(/Please resolve the following issues/)).toBeInTheDocument()
      },
      { timeout: 1000 },
    )

    expect(
      screen.getByText(
        /Education 1 • End Date: End date is required unless currently enrolled/,
      ),
    ).toBeInTheDocument()
  })
})

