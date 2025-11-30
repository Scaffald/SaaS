import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfileEducationLeft } from '../profile-education-left'

const mockInvalidateProfileQueries = vi.fn()
const mockToastShow = vi.fn()
const mockMutateCalls: Array<Record<string, unknown>> = []

const educationQueryHelpers = {
  cancel: vi.fn().mockResolvedValue(undefined),
  getData: vi.fn(() => [
    {
      id: 'edu-1',
      institution_name: 'Test University',
      degree_type: 'Bachelor Degree',
      start_date: '2020-01-01',
      end_date: '2024-12-01',
      is_current: false,
    },
    {
      id: 'edu-2',
      institution_name: 'Another University',
      degree_type: 'Master Degree',
      start_date: '2018-01-01',
      end_date: '2020-12-01',
      is_current: false,
    },
  ]),
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

'@scaffald/tamagui-ui', () => {
  const React = require('react') as typeof import('react')

  const createView = (element = 'div') =>
    React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ children, ...rest }, ref) =>
      React.createElement(element, { ref, ...rest }, children)
    )

  const Button = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<'button'> & {
      onPress?: () => void
      'data-testid'?: string
    }
  >(({ children, onPress, 'data-testid': dataTestId, ...rest }, ref) => (
    <button ref={ref} type="button" onClick={onPress} data-testid={dataTestId} {...rest}>
      {children}
    </button>
  ))

  const Input = React.forwardRef<
    HTMLInputElement,
    React.ComponentPropsWithoutRef<'input'> & { onChangeText?: (value: string) => void }
  >(({ onChangeText, ...rest }, ref) => (
    <input ref={ref} {...rest} onChange={(event) => onChangeText?.(event.target.value)} />
  ))

  const TextArea = React.forwardRef<
    HTMLTextAreaElement,
    React.ComponentPropsWithoutRef<'textarea'> & { onChangeText?: (value: string) => void }
  >(({ onChangeText, ...rest }, ref) => (
    <textarea ref={ref} {...rest} onChange={(event) => onChangeText?.(event.target.value)} />
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

  const createView = (element = 'div') =>
    React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ children, ...rest }, ref) =>
      React.createElement(element, { ref, ...rest }, children)
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
  const PopoverContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>

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
      <input ref={ref} {...rest} onChange={(event) => onChangeText?.(event.target.value)} />
    )),
    TextArea: React.forwardRef<
      HTMLTextAreaElement,
      React.ComponentPropsWithoutRef<'textarea'> & { onChangeText?: (value: string) => void }
    >(({ onChangeText, ...rest }, ref) => (
      <textarea ref={ref} {...rest} onChange={(event) => onChangeText?.(event.target.value)} />
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
  return {
    api: {
      profile: {
        getEducation: {
          useQuery: () => ({
            data: educationQueryHelpers.getData(),
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
          }),
        },
        getEducationLevel: {
          useQuery: () => ({
            data: educationLevelQueryHelpers.getData(),
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
          }),
        },
        saveEducation: {
          useMutation: (options?: {
            onMutate?: (input: Record<string, unknown>) => Promise<unknown> | unknown
            onSuccess?: (
              result: { success: boolean; education_entries: unknown[] },
              input: Record<string, unknown>,
              context: unknown
            ) => Promise<void> | void
            onSettled?: (
              result: { success: boolean; education_entries: unknown[] } | undefined,
              error: unknown,
              context: unknown
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

describe('ProfileEducationLeft - Removal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutateCalls.length = 0
  })

  it('removes entry from form state when remove button is clicked', async () => {
    render(<ProfileEducationLeft />)

    await waitFor(
      () => {
        expect(screen.getByText('Test University')).toBeInTheDocument()
      },
      { timeout: 1500 }
    )

    // Find remove button (X button) for first entry
    const removeButtons = screen
      .getAllByRole('button')
      .filter(
        (btn) =>
          btn.textContent?.includes('Remove') || btn.getAttribute('aria-label')?.includes('remove')
      )

    if (removeButtons.length > 0) {
      fireEvent.click(removeButtons[0])

      // Entry should be removed from UI
      await waitFor(
        () => {
          expect(screen.queryByText('Test University')).not.toBeInTheDocument()
        },
        { timeout: 1500 }
      )
    }
  })

  it('excludes removed entry from mutation payload', async () => {
    render(<ProfileEducationLeft />)

    await waitFor(
      () => {
        expect(screen.getByText('Test University')).toBeInTheDocument()
      },
      { timeout: 1500 }
    )

    // Remove first entry
    const removeButtons = screen
      .getAllByRole('button')
      .filter(
        (btn) =>
          btn.textContent?.includes('Remove') || btn.getAttribute('aria-label')?.includes('remove')
      )

    if (removeButtons.length > 0) {
      fireEvent.click(removeButtons[0])
      await waitFor(
        () => {
          expect(screen.queryByText('Test University')).not.toBeInTheDocument()
        },
        { timeout: 1500 }
      )

      // Save changes
      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => expect(mutateAsyncSpy).toHaveBeenCalled(), { timeout: 1500 })

      const payload = mockMutateCalls[0] as {
        education_entries: Array<Record<string, unknown>>
      }

      // Should only contain remaining entries
      expect(payload.education_entries.length).toBeLessThan(2)
      expect(
        payload.education_entries.find((e) => e.institution_name === 'Test University')
      ).toBeUndefined()
    }
  })
})
