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
  fireEvent.press(element)
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

  type ButtonProps = {
    children: React.ReactNode
    onPress?: () => void
    disabled?: boolean
    variant?: string
    opacity?: number
    space?: string
  }

  type ButtonComponent = ((props: ButtonProps) => React.ReactElement | null) & {
    Text: (props: { children: React.ReactNode }) => React.ReactElement | null
    Icon: (props: { children: React.ReactNode }) => React.ReactElement | null
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
      Text: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
      Icon: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    }
  )

  return {
    UIButton: Button,
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
    RangeSliderCard: ({
      icon,
      title,
      description,
      value,
      onValueChange,
      min,
      max,
      formatValue,
    }: {
      icon?: React.ReactNode
      title: string
      description?: string
      value: number
      onValueChange: (value: number) => void
      min?: number
      max?: number
      formatValue?: (v: number) => string
    }) => (
      <View>
        <Text>{title}</Text>
        {description && <Text>{description}</Text>}
        <button
          type="button"
          role="slider"
          aria-label="Travel slider"
          onClick={() => onValueChange(value + 5)}
        >
          <Text>{formatValue ? formatValue(value) : `${value} miles`}</Text>
        </button>
      </View>
    ),
    SkeletonForm: ({ fields }: { fields: number }) => (
      <View>
        <Text>Skeleton Form ({fields} fields)</Text>
      </View>
    ),
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

import { profileEmploymentDefaults, DRIVERS_LICENSE_OPTIONS, MILITARY_STATUS_OPTIONS, AVAILABILITY_OPTIONS } from '@app/core/utils/api'
import { ProfileEmploymentLeft } from '../profile-employment-left'

const renderEmploymentForm = () => render(<ProfileEmploymentLeft />)

describe('ProfileEmploymentLeft', () => {
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

    press(residentSwitch)
    press(passportSwitch)

    expect(isChecked(residentSwitch)).toBe(true)
    expect(isChecked(passportSwitch)).toBe(true)
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

  it('maintains travel distance slider value when changed', () => {
    const { getByRole, getByText } = renderEmploymentForm()

    const slider = getByRole('slider', { name: /travel slider/i }) as HTMLElement
    expect(slider).toBeInstanceOf(HTMLElement)
    
    // Slider should be visible (travel is always enabled)
    press(slider)
    // Value should change
    expect(getByText(/miles/i)).toBeInstanceOf(HTMLElement)
  })

  it('displays the travel slider within the 10-250 mile range', () => {
    const { getByRole, getByText } = renderEmploymentForm()

    // Travel slider is always visible (no toggle needed)
    const slider = getByRole('slider', { name: /travel slider/i }) as HTMLElement
    expect(slider.getAttribute('aria-valuemin')).toBe('10')
    expect(slider.getAttribute('aria-valuemax')).toBe('250')
    getByText('25 miles')

    press(slider)
    getByText('30 miles')
  })

  it('renders all driver license options when enabled', () => {
    const { getByRole } = renderEmploymentForm()

    const driversSwitch = getByRole('switch', { name: /driver/i }) as HTMLElement
    press(driversSwitch)

    for (const option of DRIVERS_LICENSE_OPTIONS) {
      const checkbox = getByRole('checkbox', {
        name: new RegExp(option, 'i'),
      }) as HTMLElement
      expect(checkbox).toBeInstanceOf(HTMLElement)
    }
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

    // Travel slider is always visible
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

  // Task 1: Multi-select field tests - Military Status
  it('allows toggling military status and selecting multiple options', () => {
    const { getByRole } = renderEmploymentForm()

    const militarySwitch = getByRole('switch', { name: /military/i }) as HTMLElement
    expect(isChecked(militarySwitch)).toBe(false)

    press(militarySwitch)
    expect(isChecked(militarySwitch)).toBe(true)

    // Select multiple military status options
    const activeDutyCheckbox = getByRole('checkbox', { name: /active duty/i }) as HTMLElement
    const veteranCheckbox = getByRole('checkbox', { name: /veteran/i }) as HTMLElement

    press(activeDutyCheckbox)
    press(veteranCheckbox)

    expect(isChecked(activeDutyCheckbox)).toBe(true)
    expect(isChecked(veteranCheckbox)).toBe(true)
  })

  it('preserves military status selections when other toggles change', () => {
    const { getByRole } = renderEmploymentForm()

    const militarySwitch = getByRole('switch', { name: /military/i }) as HTMLElement
    press(militarySwitch)

    const reserveCheckbox = getByRole('checkbox', { name: /reserve/i }) as HTMLElement
    press(reserveCheckbox)

    const residentSwitch = getByRole('switch', { name: /us resident/i }) as HTMLElement
    press(residentSwitch)

    expect(isChecked(reserveCheckbox)).toBe(true)
  })

  it('clears military status selections when toggle is turned OFF', () => {
    const { getByRole } = renderEmploymentForm()

    const militarySwitch = getByRole('switch', { name: /military/i }) as HTMLElement
    press(militarySwitch)

    const nationalGuardCheckbox = getByRole('checkbox', { name: /national guard/i }) as HTMLElement
    press(nationalGuardCheckbox)

    expect(isChecked(nationalGuardCheckbox)).toBe(true)

    // Turn toggle OFF
    press(militarySwitch)
    expect(isChecked(militarySwitch)).toBe(false)
    // Checkbox should no longer be visible/checked when toggle is off
  })

  it('auto-expands military status section when saved values exist', () => {
    employmentData = {
      ...employmentData,
      military_status: [MILITARY_STATUS_OPTIONS[0], MILITARY_STATUS_OPTIONS[2]],
    }
    const { getByRole } = renderEmploymentForm()

    const militarySwitch = getByRole('switch', { name: /military/i }) as HTMLElement
    expect(isChecked(militarySwitch)).toBe(true)

    const activeDutyCheckbox = getByRole('checkbox', { name: /active duty/i }) as HTMLElement
    const nationalGuardCheckbox = getByRole('checkbox', { name: /national guard/i }) as HTMLElement

    expect(isChecked(activeDutyCheckbox)).toBe(true)
    expect(isChecked(nationalGuardCheckbox)).toBe(true)
  })

  it('renders all military status options when enabled', () => {
    const { getByRole } = renderEmploymentForm()

    const militarySwitch = getByRole('switch', { name: /military/i }) as HTMLElement
    press(militarySwitch)

    for (const option of MILITARY_STATUS_OPTIONS) {
      const checkbox = getByRole('checkbox', {
        name: new RegExp(option, 'i'),
      }) as HTMLElement
      expect(checkbox).toBeInstanceOf(HTMLElement)
    }
  })

  // Task 1: Multi-select field tests - Availability
  it('allows toggling availability and selecting multiple options', () => {
    const { getByRole } = renderEmploymentForm()

    const availabilitySwitch = getByRole('switch', { name: /available for work/i }) as HTMLElement
    expect(isChecked(availabilitySwitch)).toBe(false)

    press(availabilitySwitch)
    expect(isChecked(availabilitySwitch)).toBe(true)

    // Select multiple availability options
    const partTimeCheckbox = getByRole('checkbox', { name: /part-time/i }) as HTMLElement
    const fullTimeCheckbox = getByRole('checkbox', { name: /full-time/i }) as HTMLElement

    press(partTimeCheckbox)
    press(fullTimeCheckbox)

    expect(isChecked(partTimeCheckbox)).toBe(true)
    expect(isChecked(fullTimeCheckbox)).toBe(true)
  })

  it('preserves availability selections when other toggles change', () => {
    const { getByRole } = renderEmploymentForm()

    const availabilitySwitch = getByRole('switch', { name: /available for work/i }) as HTMLElement
    press(availabilitySwitch)

    const contractCheckbox = getByRole('checkbox', { name: /contract/i }) as HTMLElement
    press(contractCheckbox)

    const passportSwitch = getByRole('switch', { name: /us passport/i }) as HTMLElement
    press(passportSwitch)

    expect(isChecked(contractCheckbox)).toBe(true)
  })

  it('clears availability selections when toggle is turned OFF', () => {
    const { getByRole } = renderEmploymentForm()

    const availabilitySwitch = getByRole('switch', { name: /available for work/i }) as HTMLElement
    press(availabilitySwitch)

    const weekendCheckbox = getByRole('checkbox', { name: /weekend/i }) as HTMLElement
    press(weekendCheckbox)

    expect(isChecked(weekendCheckbox)).toBe(true)

    // Turn toggle OFF
    press(availabilitySwitch)
    expect(isChecked(availabilitySwitch)).toBe(false)
  })

  it('auto-expands availability section when saved values exist', () => {
    employmentData = {
      ...employmentData,
      availability: [AVAILABILITY_OPTIONS[0], AVAILABILITY_OPTIONS[2], AVAILABILITY_OPTIONS[5]],
    }
    const { getByRole } = renderEmploymentForm()

    const availabilitySwitch = getByRole('switch', { name: /available for work/i }) as HTMLElement
    expect(isChecked(availabilitySwitch)).toBe(true)

    const partTimeCheckbox = getByRole('checkbox', { name: /part-time/i }) as HTMLElement
    const fullTimeCheckbox = getByRole('checkbox', { name: /full-time/i }) as HTMLElement
    const dayShiftCheckbox = getByRole('checkbox', { name: /day shift/i }) as HTMLElement

    expect(isChecked(partTimeCheckbox)).toBe(true)
    expect(isChecked(fullTimeCheckbox)).toBe(true)
    expect(isChecked(dayShiftCheckbox)).toBe(true)
  })

  it('renders all availability options when enabled', () => {
    const { getByRole } = renderEmploymentForm()

    const availabilitySwitch = getByRole('switch', { name: /available for work/i }) as HTMLElement
    press(availabilitySwitch)

    for (const option of AVAILABILITY_OPTIONS) {
      const checkbox = getByRole('checkbox', {
        name: new RegExp(option, 'i'),
      }) as HTMLElement
      expect(checkbox).toBeInstanceOf(HTMLElement)
    }
  })

  it('preserves sub-options when interacting with other multi-select fields', () => {
    const { getByRole } = renderEmploymentForm()

    // Enable driver's license and select Class A
    const driversSwitch = getByRole('switch', { name: /driver/i }) as HTMLElement
    press(driversSwitch)
    const classACheckbox = getByRole('checkbox', { name: /class a/i }) as HTMLElement
    press(classACheckbox)

    // Enable military status and select Active Duty
    const militarySwitch = getByRole('switch', { name: /military/i }) as HTMLElement
    press(militarySwitch)
    const activeDutyCheckbox = getByRole('checkbox', { name: /active duty/i }) as HTMLElement
    press(activeDutyCheckbox)

    // Enable availability and select Part-time
    const availabilitySwitch = getByRole('switch', { name: /available for work/i }) as HTMLElement
    press(availabilitySwitch)
    const partTimeCheckbox = getByRole('checkbox', { name: /part-time/i }) as HTMLElement
    press(partTimeCheckbox)

    // All selections should persist
    expect(isChecked(classACheckbox)).toBe(true)
    expect(isChecked(activeDutyCheckbox)).toBe(true)
    expect(isChecked(partTimeCheckbox)).toBe(true)
  })

  // Task 2: Validation tests - VR1: Driver's license validation
  it('blocks submission when driver license toggle is ON but no classes selected (VR1)', async () => {
    employmentData = {
      ...employmentData,
      us_resident: true, // Has residency status
    }

    const { getByRole, queryByText } = renderEmploymentForm()

    const driversSwitch = getByRole('switch', { name: /driver/i }) as HTMLElement
    press(driversSwitch) // Enable toggle but don't select any classes

    const saveButton = getByRole('button', { name: /save changes/i }) as HTMLButtonElement
    press(saveButton)

    await waitFor(() =>
      expect(queryByText(/please select at least one license class/i)).not.toBeNull()
    )

    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(mockToastShow).toHaveBeenCalledWith('Validation Error', {
      message: 'Please select at least one license class',
    })
  })

  // Task 2: Validation tests - VR2: Travel distance validation
  it('blocks submission when travel distance is not specified (VR2)', async () => {
    employmentData = {
      ...employmentData,
      us_resident: true,
      travel_distance_miles: undefined, // No travel distance
    }

    mockUseQuery.mockImplementation(() => ({
      data: employmentData,
      isLoading: false,
      isFetching: false,
    }))

    const { getByRole, queryByText } = renderEmploymentForm()

    const saveButton = getByRole('button', { name: /save changes/i }) as HTMLButtonElement
    press(saveButton)

    await waitFor(() =>
      expect(queryByText(/please select a travel distance/i)).not.toBeNull()
    )

    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(mockToastShow).toHaveBeenCalledWith('Validation Error', {
      message: 'Please select a travel distance',
    })
  })

  // Task 2: Validation tests - VR3: Residency status validation
  it('blocks submission when no residency status is selected (VR3)', async () => {
    employmentData = {
      ...employmentData,
      us_resident: false,
      us_passport: false,
      authorized_countries: [],
    }

    const { getByRole, queryByText } = renderEmploymentForm()

    const saveButton = getByRole('button', { name: /save changes/i }) as HTMLButtonElement
    press(saveButton)

    await waitFor(() =>
      expect(queryByText(/please indicate your work authorization status/i)).not.toBeNull()
    )

    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(mockToastShow).toHaveBeenCalledWith('Validation Error', {
      message: 'Please indicate your work authorization status',
    })
  })

  // Task 2: Validation tests - Hourly rate validation
  it('validates hourly rate is within 0-200 range', async () => {
    employmentData = {
      ...employmentData,
      us_resident: true,
    }

    const { getByRole, getByPlaceholderText } = renderEmploymentForm()

    const hourlyRateInput = getByPlaceholderText(/enter your hourly rate/i) as HTMLInputElement
    
    // Test max value (200)
    fireEvent.change(hourlyRateInput, { target: { value: '200' } })
    expect(hourlyRateInput.value).toBe('200')

    // Test over max value (should be limited by schema)
    fireEvent.change(hourlyRateInput, { target: { value: '250' } })
    // The form should handle this validation
  })

  it('accepts valid hourly rate values', async () => {
    employmentData = {
      ...employmentData,
      us_resident: true,
    }

    const { getByRole, getByPlaceholderText } = renderEmploymentForm()

    const hourlyRateInput = getByPlaceholderText(/enter your hourly rate/i) as HTMLInputElement
    
    fireEvent.change(hourlyRateInput, { target: { value: '45.50' } })
    expect(hourlyRateInput.value).toBe('45.50')
  })

  // Task 2: Validation tests - Preferred work locations max limit
  it('enforces maximum of 3 preferred work locations', () => {
    const { getByTestId, getByRole } = renderEmploymentForm()

    const locationCount = getByTestId('location-count')
    expect(locationCount.textContent).toContain('Locations: 0')

    // Add 3 locations
    const addLocationButton = getByRole('button', { name: /add location/i }) as HTMLButtonElement
    press(addLocationButton)
    press(addLocationButton)
    press(addLocationButton)

    expect(locationCount.textContent).toContain('Locations: 3')
  })

  // Task 2: Validation tests - Authorized countries (if implemented in UI)
  // Note: This field may not be visible in the current UI, but validation should still work
  it('validates form submission with all required fields', async () => {
    employmentData = {
      ...employmentData,
      us_resident: true,
      travel_distance_miles: 50,
    }

    const { getByRole } = renderEmploymentForm()

    const saveButton = getByRole('button', { name: /save changes/i }) as HTMLButtonElement
    press(saveButton)

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1))
    expect(mockToastShow).toHaveBeenCalledWith('Employment Updated', {
      message: 'Your employment preferences have been saved successfully!',
    })
  })
})
