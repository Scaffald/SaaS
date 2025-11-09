import * as React from 'react'
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react-native'
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import type { Mock } from 'vitest'
import type { EmploymentProfileFormData } from '@app/core/utils/api'
import type { ReactElement, ReactNode } from 'react'

const mockUseQuery: Mock<
  [],
  {
    data: EmploymentProfileFormData
    isLoading: boolean
    isFetching: boolean
  }
> = vi.fn()
const mockMutateAsync: Mock<[EmploymentProfileFormData], Promise<{ success: boolean }>> = vi.fn()
const mockToastShow = vi.fn()
const mockInvalidateProfileQueries = vi.fn()

const press = (element: HTMLElement) => {
  fireEvent.click(element)
}

const isChecked = (element: HTMLElement) => {
  if ('checked' in element) {
    return Boolean((element as HTMLInputElement).checked)
  }
  return element.getAttribute('aria-checked') === 'true'
}

vi.mock('../utils/profile-sync', () => ({
  invalidateProfileQueries: (...args: unknown[]) => mockInvalidateProfileQueries(...args),
}))

vi.mock('../utils/profile-sync-store', () => ({
  startProfileSync: vi.fn(),
  completeProfileSync: vi.fn(),
  failProfileSync: vi.fn(),
  resetProfileSyncError: vi.fn(),
  useAdaptiveProfileSync: () => 'idle',
}))

vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({
    show: mockToastShow,
  }),
}))

vi.mock('@app/core/utils/sentry/client', () => ({
  initSentry: vi.fn(),
  Sentry: {
    captureException: vi.fn(),
    startTransaction: vi.fn(),
  },
}))

vi.mock('@tamagui/lucide-icons', () => ({
  Flag: () => null,
  MapPin: () => null,
  Plane: () => null,
  DollarSign: () => null,
  Car: () => null,
  Shield: () => null,
  Calendar: () => null,
  Check: () => null,
}))

vi.mock('@app/ui', () => {
  const React = require('react')

  const View = ({
    children,
    ...rest
  }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...rest}>{children}</div>

  const Text = ({
    children,
    ...rest
  }: {
    children?: React.ReactNode
  } & Record<string, unknown>) => <span {...rest}>{children}</span>

  return {
    DashboardWidget: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    CustomCheckbox: ({
      'aria-label': ariaLabel,
      checked,
      onCheckedChange,
      testID,
    }: {
      'aria-label'?: string
      checked: boolean
      onCheckedChange: (checked: boolean) => void
      testID?: string
    }) => (
      <label>
        <input
          type="checkbox"
          aria-label={ariaLabel}
          checked={checked}
          data-testid={testID}
          onChange={() => onCheckedChange(!checked)}
        />
        <Text>{checked ? '✓' : '□'}</Text>
      </label>
    ),
    ToggleCard: ({
      title,
      description,
      checked,
      onCheckedChange,
      expandedContent,
      cardPressDisabled = false,
      testID,
    }: {
      title: string
      description?: string
      checked: boolean
      onCheckedChange: (checked: boolean) => void
      expandedContent?: React.ReactNode
      cardPressDisabled?: boolean
      testID?: string
    }) => (
      <View>
        <button
          type="button"
          aria-label={`${title} card`}
          data-testid={testID ? `${testID}-card` : undefined}
          onClick={() => {
            if (!cardPressDisabled) {
              onCheckedChange(!checked)
            }
          }}
        >
          <Text>{title}</Text>
        </button>
        <button
          type="button"
          role="switch"
          aria-label={title}
          aria-checked={checked}
          data-testid={testID}
          onClick={() => onCheckedChange(!checked)}
        >
          <Text>{checked ? 'On' : 'Off'}</Text>
        </button>
        {description ? <Text>{description}</Text> : null}
        {checked ? expandedContent : null}
      </View>
    ),
    LocationListInput: ({
      value = [],
      onChange,
    }: {
      value?: string[]
      onChange: (next: string[]) => void
    }) => (
      <View>
        <Text data-testid="location-count">Locations: {value.length}</Text>
        <button
          type="button"
          aria-label="Add location"
          onClick={() => onChange([...value, `Location ${value.length + 1}`])}
        >
          <Text>Add Location</Text>
        </button>
      </View>
    ),
    ConfirmationDialog: () => null,
  }
})

vi.mock('tamagui', () => {
  const React = require('react') as typeof import('react')

  type DivProps = React.ComponentPropsWithoutRef<'div'>

  type TextInputProps = React.ComponentPropsWithoutRef<'input'> & {
    onChangeText?: (value: string) => void
  }

  const View = React.forwardRef<HTMLDivElement, DivProps>(({ children, ...rest }, ref) => (
    <div ref={ref} {...rest}>
      {children}
    </div>
  ))

  const TextComponent = React.forwardRef<HTMLSpanElement, DivProps>(
    ({ children, ...rest }, ref) => (
      <span ref={ref} {...rest}>
        {children}
      </span>
    )
  )
  const Text = TextComponent

  const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
    ({ value, onChangeText, ...props }, ref) => (
      <input
        ref={ref}
        value={value}
        onChange={(event) => onChangeText?.(event.target.value)}
        {...props}
      />
    )
  )

  const createView = () =>
    React.forwardRef<HTMLDivElement, DivProps>(({ children, ...rest }, ref) => (
      <View ref={ref} {...rest}>
        {children}
      </View>
    ))

  type ButtonProps = {
    children: ReactNode
    onPress?: () => void
    disabled?: boolean
  }

  type ButtonComponent = ((props: ButtonProps) => ReactElement | null) & {
    Text: (props: { children: ReactNode }) => ReactElement | null
    Icon: (props: { children: ReactNode }) => ReactElement | null
  }

  const Button: ButtonComponent = Object.assign(
    ({ children, onPress, disabled }: ButtonProps) => (
      <button
        type="button"
        aria-disabled={disabled ? 'true' : undefined}
        onClick={disabled ? undefined : onPress}
      >
        {typeof children === 'string' ? <Text>{children}</Text> : children}
      </button>
    ),
    {
      Text: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
      Icon: ({ children }: { children: ReactNode }) => <View>{children}</View>,
    }
  )

  const Input = TextInput

  const Slider = ({
    value = [0],
    onValueChange,
    min = 0,
    max = 100,
    step = 1,
    children,
  }: {
    value?: number[]
    onValueChange: (value: number[]) => void
    min?: number
    max?: number
    step?: number
    children?: React.ReactNode
  }) => (
    <View>
      <button
        type="button"
        role="slider"
        aria-label="Travel slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value?.[0] ?? min}
        onClick={() => {
          const currentValue = value?.[0] ?? min
          const nextValue = Math.min(max, currentValue + step)
          onValueChange([nextValue])
        }}
      >
        <Text>{value?.[0] ?? min}</Text>
      </button>
      {children}
    </View>
  )
  Slider.Track = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>
  Slider.TrackActive = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>
  Slider.Thumb = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>

  const Checkbox = ({
    accessibilityLabel,
    checked,
    onCheckedChange,
    children,
  }: {
    accessibilityLabel?: string
    checked?: boolean
    onCheckedChange: (checked: boolean) => void
    children?: React.ReactNode
  }) => (
    <label>
      <input
        type="checkbox"
        aria-label={accessibilityLabel}
        checked={Boolean(checked)}
        onChange={() => onCheckedChange(!checked)}
      />
      <View>{children}</View>
    </label>
  )
  Checkbox.Indicator = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>

  const AnimatePresence = ({ children }: { children?: React.ReactNode }) => <>{children}</>
  const Spinner = () => <Text>Spinner</Text>

  return {
    YStack: createView(),
    XStack: createView(),
    Text: TextComponent,
    Button,
    Input,
    H4: ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>,
    Spinner,
    AnimatePresence,
    Slider,
    Checkbox,
    Label: ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>,
  }
})

let employmentData: EmploymentProfileFormData = { ...profileEmploymentDefaults }

vi.mock('@app/core/utils/api', async () => {
  const actualModule = (await vi.importActual('@app/core/utils/api')) as Record<string, unknown>

  return {
    ...actualModule,
    api: {
      profile: {
        getEmployment: {
          useQuery: () => mockUseQuery(),
        },
        updateEmployment: {
          useMutation: (options?: {
            onMutate?: (input: EmploymentProfileFormData) => Promise<void> | void
            onSuccess?: (
              result: { success: boolean },
              input: EmploymentProfileFormData,
              context: unknown
            ) => Promise<void> | void
            onError?: (
              error: unknown,
              input: EmploymentProfileFormData,
              context: unknown
            ) => Promise<void> | void
            onSettled?: (
              result: { success: boolean } | undefined,
              error: unknown
            ) => Promise<void> | void
          }) => ({
            mutateAsync: async (input: EmploymentProfileFormData) => {
              if (options?.onMutate) {
                await options.onMutate(input)
              }

              try {
                const result = await mockMutateAsync(input)
                if (options?.onSuccess) {
                  await options.onSuccess(result, input, undefined)
                }
                if (options?.onSettled) {
                  await options.onSettled(result, undefined)
                }
                return result
              } catch (error) {
                if (options?.onError) {
                  await options.onError(error, input, undefined)
                }
                if (options?.onSettled) {
                  await options.onSettled(undefined, error)
                }
                throw error
              }
            },
            isLoading: false,
          }),
        },
      },
      useContext: () => ({
        profile: {
          getEmployment: {
            cancel: vi.fn(),
            getData: vi.fn(() => employmentData),
            setData: vi.fn(),
            invalidate: vi.fn(),
          },
        },
      }),
    },
  }
})

import { profileEmploymentDefaults, DRIVERS_LICENSE_OPTIONS } from '@app/core/utils/api'
import { ProfileEmploymentLeft } from '../profile-employment-left'

const renderEmploymentForm = () => render(<ProfileEmploymentLeft />)

describe.skip('ProfileEmploymentLeft', () => {
  beforeEach(() => {
    employmentData = {
      ...profileEmploymentDefaults,
      open_to_travel: true,
      travel_distance_miles: 25,
      preferred_work_locations: [],
    }

    mockUseQuery.mockImplementation(() => ({
      data: employmentData,
      isLoading: false,
      isFetching: false,
    }))

    mockMutateAsync.mockResolvedValue({ success: true })
    mockToastShow.mockClear()
    mockInvalidateProfileQueries.mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('keeps boolean toggles independent', () => {
    const { getByRole } = renderEmploymentForm()

    const residentSwitch = getByRole('switch', { name: /us resident/i }) as HTMLElement
    const passportSwitch = getByRole('switch', { name: /us passport/i }) as HTMLElement
    const travelSwitch = getByRole('switch', { name: /willing to travel/i }) as HTMLElement

    press(residentSwitch)
    press(passportSwitch)
    press(travelSwitch)

    expect(isChecked(residentSwitch)).toBe(true)
    expect(isChecked(passportSwitch)).toBe(true)
    expect(isChecked(travelSwitch)).toBe(true)
  })

  it('preserves driver license selections when other toggles change', () => {
    const { getByRole } = renderEmploymentForm()

    const driversSwitch = getByRole('switch', { name: /driver/i }) as HTMLElement
    press(driversSwitch)

    const classACheckbox = getByRole('checkbox', { name: /class a/i }) as HTMLElement
    press(classACheckbox)

    const residentSwitch = getByRole('switch', { name: /us resident/i }) as HTMLElement
    press(residentSwitch)

    expect(isChecked(classACheckbox)).toBe(true)
  })

  it('maintains willing to travel toggle when slider moves', () => {
    const { getByRole } = renderEmploymentForm()

    const travelSwitch = getByRole('switch', { name: /willing to travel/i }) as HTMLElement
    press(travelSwitch)

    const slider = getByRole('slider', { name: /travel slider/i }) as HTMLElement
    press(slider)

    expect(isChecked(getByRole('switch', { name: /willing to travel/i }) as HTMLElement)).toBe(true)
  })

  it('shows saved values after a successful save', async () => {
    employmentData = {
      ...employmentData,
      us_resident: true,
    }

    const { getByRole, rerender } = renderEmploymentForm()

    const passportSwitch = getByRole('switch', { name: /us passport/i }) as HTMLElement
    press(passportSwitch)

    const driversSwitch = getByRole('switch', { name: /driver/i }) as HTMLElement
    press(driversSwitch)

    const classACheckbox = getByRole('checkbox', { name: /class a/i }) as HTMLElement
    press(classACheckbox)

    const travelSwitch = getByRole('switch', { name: /willing to travel/i }) as HTMLElement
    press(travelSwitch)

    const slider = getByRole('slider', { name: /travel slider/i }) as HTMLElement
    press(slider)

    mockMutateAsync.mockImplementation(async (input: EmploymentProfileFormData) => {
      const nextEmployment: EmploymentProfileFormData = {
        ...input,
      }
      employmentData = nextEmployment
      return { success: true }
    })

    const saveButton = getByRole('button', { name: /save changes/i }) as HTMLButtonElement
    press(saveButton)

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1))

    rerender(<ProfileEmploymentLeft />)

    expect(isChecked(getByRole('switch', { name: /us resident/i }) as HTMLElement)).toBe(true)
    expect(isChecked(getByRole('switch', { name: /us passport/i }) as HTMLElement)).toBe(true)
    expect(isChecked(getByRole('switch', { name: /driver/i }) as HTMLElement)).toBe(true)
    expect(isChecked(getByRole('checkbox', { name: /class a/i }) as HTMLElement)).toBe(true)
  })

  it('auto-expands driver license section when saved values exist', () => {
    employmentData = {
      ...employmentData,
      drivers_license_classes: [DRIVERS_LICENSE_OPTIONS[1]],
    }
    const { getByRole } = renderEmploymentForm()

    const driversSwitch = getByRole('switch', { name: /driver/i }) as HTMLElement

    expect(isChecked(driversSwitch)).toBe(true)
    expect(isChecked(getByRole('checkbox', { name: /class a/i }) as HTMLElement)).toBe(true)
  })

  it('blocks submission when required selections are missing', async () => {
    employmentData = {
      ...employmentData,
      us_resident: true,
    }

    const { getByRole, queryByText } = renderEmploymentForm()

    const driversSwitch = getByRole('switch', { name: /driver/i }) as HTMLElement
    press(driversSwitch)

    const saveButton = getByRole('button', { name: /save changes/i }) as HTMLButtonElement
    press(saveButton)

    await waitFor(() =>
      expect(queryByText(/please select at least one license class/i)).not.toBeNull()
    )

    expect(mockMutateAsync).not.toHaveBeenCalled()
  })
})
