import * as React from 'react'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfileEducationLeft } from '../profile-education-left'
import { EducationEntryEditModal } from '../components/EducationEntryEditModal'
import { ProfileEducationRight } from '../profile-education-right'

type EducationEntry = {
  id?: string
  university_id?: string | null
  institution_name: string
  is_verified?: boolean | null
  degree_type?: string | null
  custom_degree_type?: string | null
  field_of_study?: string | null
  start_date?: string | null
  end_date?: string | null
  expected_graduation_date?: string | null
  is_current?: boolean | null
  gpa?: number | string | null
  description?: string | null
  location?: string | null
}

const mockToastShow = vi.fn()
const mockInvalidateProfileQueries = vi.fn()
const mockStartProfileSync = vi.fn()
const mockCompleteProfileSync = vi.fn()
const mockFailProfileSync = vi.fn()
const mockResetProfileSyncError = vi.fn()

const mockSaveEducationCall = vi.fn()
const mockDeleteEducationCall = vi.fn()
const mockRefetchEducation = vi.fn()

let educationEntriesFixture: EducationEntry[] = []
let educationLevelFixture: { education_level: string | null } | undefined

const createQueryResult = <T,>(data: T) => ({
  data,
  isLoading: false,
  isFetching: false,
  isError: false,
  refetch: mockRefetchEducation,
})

const mockGetEducationUseQuery = vi.fn(() => createQueryResult(educationEntriesFixture))
const mockGetEducationLevelUseQuery = vi.fn(() => createQueryResult(educationLevelFixture))

const profileContext = {
  profile: {
    getEducation: {
      cancel: vi.fn(),
      getData: vi.fn(() => educationEntriesFixture),
      setData: vi.fn(),
      invalidate: vi.fn(),
    },
    getEducationLevel: {
      cancel: vi.fn(),
      getData: vi.fn(() => educationLevelFixture),
      setData: vi.fn(),
      invalidate: vi.fn(),
    },
  },
}

vi.mock('../utils/profile-sync', () => ({
  invalidateProfileQueries: (...args: unknown[]) => mockInvalidateProfileQueries(...args),
}))

vi.mock('../utils/profile-sync-store', () => ({
  startProfileSync: (...args: unknown[]) => mockStartProfileSync(...args),
  completeProfileSync: (...args: unknown[]) => mockCompleteProfileSync(...args),
  failProfileSync: (...args: unknown[]) => mockFailProfileSync(...args),
  resetProfileSyncError: (...args: unknown[]) => mockResetProfileSyncError(...args),
  useAdaptiveProfileSync: () => 'idle',
}))

vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({
    show: mockToastShow,
  }),
}))

vi.mock('@tamagui/lucide-icons', () => {
  const Icon = () => null
  return {
    GraduationCap: Icon,
    Calendar: Icon,
    MapPin: Icon,
    Pencil: Icon,
    Trash2: Icon,
    CheckCircle: Icon,
    AlertCircle: Icon,
    ChevronDown: Icon,
  }
})

const createButton = () =>
  React.forwardRef<
    HTMLButtonElement,
    React.PropsWithChildren<{ onPress?: () => void; disabled?: boolean; role?: string }>
  >(({ children, onPress, disabled, ...rest }, ref) => (
    <button
      type="button"
      ref={ref}
      aria-disabled={disabled ? 'true' : undefined}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onPress?.()
        }
      }}
      {...rest}
    >
      {typeof children === 'string' ? <span>{children}</span> : children}
    </button>
  ))

const UIButton = createButton()

vi.mock('@app/ui', async () => {
  const actualModule = await vi.importActual<typeof import('@app/ui')>('@app/ui')
  const React = require('react')

  const UIButton = React.forwardRef<
    HTMLButtonElement,
    React.PropsWithChildren<{ onPress?: () => void; disabled?: boolean; icon?: unknown }>
  >(({ children, onPress, disabled, ...rest }, ref) => (
    <button
      type="button"
      ref={ref}
      aria-disabled={disabled ? 'true' : undefined}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onPress?.()
        }
      }}
      {...rest}
    >
      {typeof children === 'string' ? <span>{children}</span> : children}
    </button>
  ))

  const CustomCheckbox = ({
    checked,
    onCheckedChange,
    'aria-label': ariaLabel,
    testID,
  }: {
    checked?: boolean
    onCheckedChange: (next: boolean) => void
    'aria-label'?: string
    testID?: string
  }) => (
    <label>
      <input
        type="checkbox"
        checked={Boolean(checked)}
        aria-label={ariaLabel}
        data-testid={testID}
        onChange={() => onCheckedChange(!checked)}
      />
    </label>
  )

  const DashboardWidget = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>

  const UniversityAutocomplete = ({
    value,
    onChange,
    placeholder,
    error,
  }: {
    value: string
    onChange: (next: string) => void
    onUniversitySelect?: (university: unknown) => void
    onSearch?: (query: string) => void
    placeholder?: string
    error?: string
  }) => (
    <div>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <span>{error}</span> : null}
    </div>
  )

  const MonthYearPicker = ({
    label,
    value,
    onChange,
    disabled,
  }: {
    label: string
    value: Date | null
    onChange: (next: Date | null) => void
    disabled?: boolean
  }) => (
    <input
      aria-label={label}
      disabled={disabled}
      value={value ? value.toISOString().split('T')[0] : ''}
      onChange={(event) => {
        const next = event.target.value ? new Date(event.target.value) : null
        onChange(next)
      }}
    />
  )

  const FieldError = ({ message }: { message?: string }) =>
    message ? <span>{message}</span> : null

  const ResponsiveModal = ({
    open,
    onOpenChange: _onOpenChange,
    children,
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    children?: React.ReactNode
  }) => (open ? <div data-testid="responsive-modal">{children}</div> : null)

  const ConfirmationDialog = () => null

  const ProfileEmptyState = ({ message }: { message: string }) => <div>{message}</div>

  return {
    ...actualModule,
    UIButton,
    CustomCheckbox,
    DashboardWidget,
    UniversityAutocomplete,
    MonthYearPicker,
    FieldError,
    ResponsiveModal,
    ConfirmationDialog,
    ProfileEmptyState,
  }
})

vi.mock('tamagui', async () => {
  const actualModule = await vi.importActual<typeof import('tamagui')>('tamagui')
  const React = require('react')

  const createView =
    (as: keyof JSX.IntrinsicElements = 'div') =>
    React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<typeof as>>(
      ({ children, ...rest }, ref) =>
        React.createElement(as, { ref, ...rest }, children) as React.ReactElement,
    )

  const Text = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>

  const Button = UIButton

  const Input = React.forwardRef<
    HTMLInputElement,
    React.ComponentPropsWithoutRef<'input'> & { onChangeText?: (value: string) => void }
  >(({ onChangeText, ...rest }, ref) => (
    <input
      ref={ref}
      {...rest}
      onChange={(event) => {
        rest.onChange?.(event)
        onChangeText?.(event.target.value)
      }}
    />
  ))

  const TextArea = ({
    onChangeText,
    ...rest
  }: React.ComponentPropsWithoutRef<'textarea'> & { onChangeText?: (value: string) => void }) => (
    <textarea
      {...rest}
      onChange={(event) => {
        rest.onChange?.(event)
        onChangeText?.(event.target.value)
      }}
    />
  )

  const Popover = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  Popover.Trigger = ({ children }: { children?: React.ReactNode }) => <>{children}</>
  Popover.Content = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>

  const Select = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  Select.Trigger = ({ children }: { children?: React.ReactNode }) => <>{children}</>
  Select.Value = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>
  Select.Content = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  Select.Viewport = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  Select.Item = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  Select.ItemText = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>
  Select.ScrollUpButton = () => null
  Select.ScrollDownButton = () => null

  const Adapt = ({ children }: { children?: React.ReactNode }) => <>{children}</>
  Adapt.Contents = ({ children }: { children?: React.ReactNode }) => <>{children}</>

  const Sheet = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  Sheet.Frame = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  Sheet.ScrollView = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  Sheet.Overlay = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>

  return {
    ...actualModule,
    YStack: createView(),
    XStack: createView(),
    Text,
    Input,
    Button,
    H4: ({ children }: { children?: React.ReactNode }) => <h4>{children}</h4>,
    TextArea,
    ScrollView: createView(),
    Spinner: () => <span>Spinner</span>,
    Label: ({ children, htmlFor }: { children?: React.ReactNode; htmlFor?: string }) => (
      <label htmlFor={htmlFor}>{children}</label>
    ),
    Popover,
    Separator: () => <hr />,
    Select,
    Adapt,
    Sheet,
    useWindowDimensions: () => ({ width: 1024, height: 768 }),
  }
})

vi.mock('@app/core/utils/api', async () => {
  const actualModule = (await vi.importActual('@app/core/utils/api')) as Record<string, unknown>

  return {
    ...actualModule,
    api: {
      profile: {
        getEducation: {
          useQuery: () => mockGetEducationUseQuery(),
        },
        getEducationLevel: {
          useQuery: () => mockGetEducationLevelUseQuery(),
        },
        saveEducation: {
          useMutation: (options?: {
            onMutate?: (input: unknown) => Promise<unknown> | unknown
            onSuccess?: (result: unknown, input: unknown, context: unknown) => Promise<unknown> | unknown
            onError?: (error: unknown, input: unknown, context: unknown) => Promise<unknown> | unknown
            onSettled?: (result: unknown, error: unknown) => Promise<unknown> | unknown
          }) => ({
            mutateAsync: async (input: unknown) => {
              await options?.onMutate?.(input)
              mockSaveEducationCall(input)
              await options?.onSuccess?.(
                { success: true, education_entries: (input as { education_entries?: unknown[] }).education_entries ?? [] },
                input,
                undefined,
              )
              await options?.onSettled?.(
                { success: true, education_entries: (input as { education_entries?: unknown[] }).education_entries ?? [] },
                undefined,
              )
              return { success: true }
            },
            isLoading: false,
          }),
        },
        deleteEducation: {
          useMutation: (options?: {
            onSuccess?: (result: unknown, input: unknown, context: unknown) => void
            onError?: (error: unknown) => void
          }) => ({
            mutate: (input: unknown) => {
              mockDeleteEducationCall(input)
              options?.onSuccess?.({ success: true }, input, undefined)
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
      useContext: () => profileContext,
    },
  }
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  educationEntriesFixture = []
  educationLevelFixture = undefined
})

describe('ProfileEducationLeft', () => {
  beforeEach(() => {
    educationEntriesFixture = [
      {
        id: 'entry-1',
        institution_name: 'Manual University',
        university_id: null,
        is_verified: false,
        degree_type: 'Other',
        custom_degree_type: 'International Diploma',
        start_date: '2020-01-01',
        end_date: '2022-05-01',
        description: '',
      },
    ]
    educationLevelFixture = { education_level: 'Bachelor Degree' }
  })

  it('allows editing manual institution entries and submits updated payload', async () => {
    render(<ProfileEducationLeft />)

    const manualInput = await screen.findByPlaceholderText('Enter institution name')
    fireEvent.changeText(manualInput, 'Updated Manual University')

    const saveButton = screen.getByText('Save Changes')
    fireEvent.press(saveButton)

    await waitFor(() => {
      expect(mockSaveEducationCall).toHaveBeenCalledTimes(1)
    })

    const payload = mockSaveEducationCall.mock.calls[0]?.[0] as {
      education_entries: EducationEntry[]
    }
    expect(payload.education_entries[0]?.institution_name).toBe('Updated Manual University')
    expect(payload.education_entries[0]?.university_id).toBeNull()
    expect(payload.education_entries[0]?.is_verified).toBe(false)

    expect(mockStartProfileSync).toHaveBeenCalled()
    expect(mockCompleteProfileSync).toHaveBeenCalled()
  })

  it('toggles between manual entry and catalog search', async () => {
    render(<ProfileEducationLeft />)

    const manualButton = await screen.findByText('Search from catalog instead')
    fireEvent.press(manualButton)

    expect(screen.getByPlaceholderText('Search for institution...')).toBeTruthy()

    const backToManual = screen.getByText("Can't find your institution? Enter it manually")
    fireEvent.press(backToManual)

    expect(screen.getByPlaceholderText('Enter institution name')).toBeTruthy()
  })
})

describe('EducationEntryEditModal', () => {
  beforeEach(() => {
    educationEntriesFixture = [
      {
        id: 'entry-1',
        institution_name: 'Catalog University',
        university_id: 'univ-1',
        is_verified: true,
        degree_type: 'Bachelor Degree',
        start_date: '2020-01-01',
        end_date: '2022-05-01',
      },
    ]
  })

  it('switches to manual institution mode and persists updates on save', async () => {
    const onOpenChange = vi.fn()

    render(
      <EducationEntryEditModal
        open
        onOpenChange={onOpenChange}
        educationEntry={educationEntriesFixture[0] as EducationEntry}
        onSuccess={vi.fn()}
      />,
    )

    const manualButton = await screen.findByText("Can't find your institution? Enter it manually")
    fireEvent.press(manualButton)

    const manualInput = await screen.findByPlaceholderText('Enter institution name')
    fireEvent.changeText(manualInput, 'Manual College')

    const saveButton = screen.getByText('Save Changes')
    fireEvent.press(saveButton)

    await waitFor(() => {
      expect(mockSaveEducationCall).toHaveBeenCalled()
    })

    const payload = mockSaveEducationCall.mock.calls.at(-1)?.[0] as {
      education_entries: EducationEntry[]
    }
    const updated = payload.education_entries.find((entry) => entry.id === 'entry-1')
    expect(updated?.institution_name).toBe('Manual College')
    expect(updated?.university_id).toBeNull()
    expect(updated?.is_verified).toBe(false)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('ProfileEducationRight', () => {
  beforeEach(() => {
    educationEntriesFixture = [
      {
        id: 'entry-1',
        institution_name: 'Catalog University',
        is_verified: true,
        degree_type: 'Bachelor Degree',
        start_date: '2020-01-01',
        end_date: '2022-05-01',
      },
      {
        id: 'entry-2',
        institution_name: 'Manual College',
        is_verified: false,
        degree_type: 'Other',
        start_date: '2021-01-01',
        is_current: true,
        expected_graduation_date: '2025-05-01',
      },
    ]
  })

  it('renders verification states and deletes entries with confirmation', async () => {
    render(<ProfileEducationRight />)

    expect(await screen.findByText('Catalog University')).toBeTruthy()
    expect(screen.getByText('Manual College')).toBeTruthy()
    expect(screen.getByText('Pending verification')).toBeTruthy()
    expect(screen.getByText('Current')).toBeTruthy()

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.press(deleteButtons[1])

    await waitFor(() => {
      expect(mockDeleteEducationCall).toHaveBeenCalledWith({ educationId: 'entry-2' })
    })
  })
})

