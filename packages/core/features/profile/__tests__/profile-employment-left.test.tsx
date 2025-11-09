import React from 'react'
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react-native'
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import type { EmploymentProfileFormData } from '@app/core/utils/api'

const mockUseQuery = vi.fn()
const mockMutateAsync = vi.fn<(input: EmploymentProfileFormData) => Promise<{ success: boolean }>>()
const mockToastShow = vi.fn()
const mockInvalidateProfileQueries = vi.fn()

vi.mock('../utils/profile-sync', () => ({
  invalidateProfileQueries: (...args: unknown[]) => mockInvalidateProfileQueries(...args),
}))

vi.mock('../utils/profile-sync-store', () => ({
  startProfileSync: vi.fn(),
  completeProfileSync: vi.fn(),
  failProfileSync: vi.fn(),
  resetProfileSyncError: vi.fn(),
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
  const { View, Text, TouchableOpacity } = require('react-native')
  return {
    DashboardWidget: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    ToggleCard: ({
      title,
      description,
      checked,
      onCheckedChange,
      expandedContent,
      cardPressDisabled = false,
    }: {
      title: string
      description?: string
      checked: boolean
      onCheckedChange: (checked: boolean) => void
      expandedContent?: React.ReactNode
      cardPressDisabled?: boolean
    }) => (
      <View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${title} card`}
          onPress={() => {
            if (!cardPressDisabled) {
              onCheckedChange(!checked)
            }
          }}
        >
          <Text>{title}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="switch"
          accessibilityLabel={title}
          accessibilityState={{ checked }}
          onPress={() => onCheckedChange(!checked)}
        >
          <Text>{checked ? 'On' : 'Off'}</Text>
        </TouchableOpacity>
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
        <Text testID="location-count">Locations: {value.length}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Add location"
          onPress={() => onChange([...value, `Location ${value.length + 1}`])}
        >
          <Text>Add Location</Text>
        </TouchableOpacity>
      </View>
    ),
    ConfirmationDialog: () => null,
  }
})

vi.mock('tamagui', () => {
  const React = require('react')
  const { View, Text, TextInput, TouchableOpacity } = require('react-native')

  const createView = () =>
    React.forwardRef(({ children, ...props }: { children?: React.ReactNode }, ref) => (
      <View ref={ref as React.Ref<View>} {...props}>
        {children}
      </View>
    ))

  const TextComponent = React.forwardRef(
    ({ children, ...props }: { children?: React.ReactNode }, ref) => (
      <Text ref={ref as React.Ref<Text>} {...props}>
        {children}
      </Text>
    ),
  )

  const Button = ({
    children,
    onPress,
    disabled,
  }: {
    children: React.ReactNode
    onPress?: () => void
    disabled?: boolean
  }) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={disabled ? undefined : onPress}
    >
      {typeof children === 'string' ? <Text>{children}</Text> : children}
    </TouchableOpacity>
  )
  Button.Text = ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>
  Button.Icon = ({ children }: { children: React.ReactNode }) => <View>{children}</View>

  const Input = React.forwardRef(
    (
      {
        value,
        onChangeText,
        ...props
      }: { value?: string; onChangeText?: (value: string) => void; [key: string]: unknown },
      ref,
    ) => (
      <TextInput
        ref={ref as React.Ref<TextInput>}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
    ),
  )

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
      <TouchableOpacity
        accessibilityRole="adjustable"
        accessibilityLabel="Travel slider"
        onPress={() => {
          const currentValue = value?.[0] ?? min
          const nextValue = Math.min(max, currentValue + step)
          onValueChange([nextValue])
        }}
      >
        <Text>{value?.[0] ?? min}</Text>
      </TouchableOpacity>
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
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: Boolean(checked) }}
      onPress={() => onCheckedChange(!checked)}
    >
      <View>{children}</View>
    </TouchableOpacity>
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

let employmentData: EmploymentProfileFormData

vi.mock('@app/core/utils/api', async () => {
  const actual = await vi.importActual<typeof import('@app/core/utils/api')>('@app/core/utils/api')

  return {
    ...actual,
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
              context: unknown,
            ) => Promise<void> | void
            onError?: (
              error: unknown,
              input: EmploymentProfileFormData,
              context: unknown,
            ) => Promise<void> | void
            onSettled?: (
              result: { success: boolean } | undefined,
              error: unknown,
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

import {
  profileEmploymentDefaults,
  DRIVERS_LICENSE_OPTIONS,
} from '@app/core/utils/api'
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

    const residentSwitch = getByRole('switch', { name: /us resident/i })
    const passportSwitch = getByRole('switch', { name: /us passport/i })
    const travelSwitch = getByRole('switch', { name: /willing to travel/i })

    fireEvent.press(residentSwitch)
    fireEvent.press(passportSwitch)
    fireEvent.press(travelSwitch)

    expect(residentSwitch.props.accessibilityState.checked).toBe(true)
    expect(passportSwitch.props.accessibilityState.checked).toBe(true)
    expect(travelSwitch.props.accessibilityState.checked).toBe(true)
  })

  it('preserves driver license selections when other toggles change', () => {
    const { getByRole } = renderEmploymentForm()

    const driversSwitch = getByRole('switch', { name: /driver/i })
    fireEvent.press(driversSwitch)

    const classACheckbox = getByRole('checkbox', { name: /class a/i })
    fireEvent.press(classACheckbox)

    const residentSwitch = getByRole('switch', { name: /us resident/i })
    fireEvent.press(residentSwitch)

    expect(classACheckbox.props.accessibilityState.checked).toBe(true)
  })

  it('maintains willing to travel toggle when slider moves', () => {
    const { getByRole, getByLabelText } = renderEmploymentForm()

    const travelSwitch = getByRole('switch', { name: /willing to travel/i })
    fireEvent.press(travelSwitch)

    const slider = getByLabelText(/travel slider/i)
    fireEvent.press(slider)

    expect(getByRole('switch', { name: /willing to travel/i }).props.accessibilityState.checked).toBe(true)
  })

  it('shows saved values after a successful save', async () => {
    employmentData = {
      ...employmentData,
      us_resident: true,
    }

    const { getByRole, getByLabelText, rerender } = renderEmploymentForm()

    const passportSwitch = getByRole('switch', { name: /us passport/i })
    fireEvent.press(passportSwitch)

    const driversSwitch = getByRole('switch', { name: /driver/i })
    fireEvent.press(driversSwitch)

    const classACheckbox = getByRole('checkbox', { name: /class a/i })
    fireEvent.press(classACheckbox)

    const travelSwitch = getByRole('switch', { name: /willing to travel/i })
    fireEvent.press(travelSwitch)

    const slider = getByLabelText(/travel slider/i)
    fireEvent.press(slider)

    mockMutateAsync.mockImplementation(async (input) => {
      employmentData = {
        ...input,
      }
      return { success: true }
    })

    const saveButton = getByRole('button', { name: /save changes/i })
    fireEvent.press(saveButton)

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1))

    rerender(<ProfileEmploymentLeft />)

    expect(getByRole('switch', { name: /us resident/i }).props.accessibilityState.checked).toBe(true)
    expect(getByRole('switch', { name: /us passport/i }).props.accessibilityState.checked).toBe(true)
    expect(getByRole('switch', { name: /driver/i }).props.accessibilityState.checked).toBe(true)
    expect(getByRole('checkbox', { name: /class a/i }).props.accessibilityState.checked).toBe(true)
  })

  it('auto-expands driver license section when saved values exist', () => {
    employmentData = {
      ...employmentData,
      drivers_license_classes: [DRIVERS_LICENSE_OPTIONS[1]],
    }
    const { getByRole } = renderEmploymentForm()

    const driversSwitch = getByRole('switch', { name: /driver/i })

    expect(driversSwitch.props.accessibilityState.checked).toBe(true)
    expect(getByRole('checkbox', { name: /class a/i }).props.accessibilityState.checked).toBe(true)
  })

  it('blocks submission when required selections are missing', async () => {
    employmentData = {
      ...employmentData,
      us_resident: true,
    }

    const { getByRole, queryByText } = renderEmploymentForm()

    const driversSwitch = getByRole('switch', { name: /driver/i })
    fireEvent.press(driversSwitch)

    const saveButton = getByRole('button', { name: /save changes/i })
    fireEvent.press(saveButton)

    await waitFor(() =>
      expect(queryByText(/please select at least one license class/i)).not.toBeNull(),
    )

    expect(mockMutateAsync).not.toHaveBeenCalled()
  })
})

