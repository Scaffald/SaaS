import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { EducationEntry } from '../../types/education'
import { EducationEntryEditModal } from '../EducationEntryEditModal'

vi.mock('../../utils/profile-sync-store', () => ({
  startProfileSync: vi.fn(),
  completeProfileSync: vi.fn(),
  failProfileSync: vi.fn(),
  resetProfileSyncError: vi.fn(),
  useAdaptiveProfileSync: () => 'idle',
}))

vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({ show: vi.fn() }),
}))

vi.mock('@tamagui/lucide-icons', () => ({
  ChevronDown: () => null,
}))

vi.mock('@app/ui', () => {
  const React = require('react') as typeof import('react')

  const UIButton = ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) => (
    <button type="button" onClick={onPress}>
      {children}
    </button>
  )

  const UniversityAutocomplete = ({
    value,
    onChange,
    placeholder,
    onUniversitySelect,
  }: {
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    onUniversitySelect?: (university: { id: string; name: string }) => void
  }) => (
    <div>
      <input
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {onUniversitySelect ? (
        <button
          type="button"
          onClick={() =>
            onUniversitySelect({
              id: '11111111-1111-1111-1111-111111111111',
              name: 'Selected University',
            })
          }
        >
          Select from catalog
        </button>
      ) : null}
    </div>
  )

  const CustomCheckbox = ({
    checked,
    onCheckedChange,
    'aria-label': ariaLabel,
  }: {
    checked?: boolean
    onCheckedChange: (checked: boolean) => void
    'aria-label'?: string
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

  const MonthYearPicker = ({
    value,
    onChange,
    label,
    disabled,
  }: {
    value: Date | null
    onChange: (date: Date | null) => void
    label?: string
    disabled?: boolean
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
      </div>
    )
  }

  return {
    ResponsiveModal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    UIButton,
    UniversityAutocomplete,
    CustomCheckbox,
    MonthYearPicker,
    FieldError: ({ message }: { message?: string }) => (message ? <span>{message}</span> : null),
    ConfirmationDialog: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    TextArea: ({
      value = '',
      onChangeText,
      ...rest
    }: {
      value?: string
      onChangeText?: (value: string) => void
    } & React.ComponentPropsWithoutRef<'textarea'>) => (
      <textarea
        value={value}
        onChange={(event) => onChangeText?.(event.target.value)}
        {...rest}
      />
    ),
    Input: ({
      value = '',
      onChangeText,
      ...rest
    }: {
      value?: string
      onChangeText?: (value: string) => void
    } & React.ComponentPropsWithoutRef<'input'>) => (
      <input
        value={value}
        onChange={(event) => onChangeText?.(event.target.value)}
        {...rest}
      />
    ),
  }
})

vi.mock('tamagui', () => {
  const React = require('react') as typeof import('react')

  const createView = (element = 'div') =>
    React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ children, ...rest }, ref) =>
      React.createElement(element, { ref, ...rest }, children),
    )

  const SelectContext = React.createContext<((value: string) => void) | null>(null)

  const SelectRoot = ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (value: string) => void }) => (
    <SelectContext.Provider value={onValueChange ?? null}>{children}</SelectContext.Provider>
  )

  const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => {
    const select = React.useContext(SelectContext)
    return (
      <button type="button" onClick={() => select?.(value)}>
        {children}
      </button>
    )
  }

  const SheetRoot = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  SheetRoot.Frame = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  SheetRoot.ScrollView = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  SheetRoot.Overlay = ({ children }: { children: React.ReactNode }) => <div>{children}</div>

  return {
    YStack: createView(),
    XStack: createView(),
    Text: createView('span'),
    Label: createView('label'),
    Button: ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) => (
      <button type="button" onClick={onPress}>
        {children}
      </button>
    ),
    Select: Object.assign(SelectRoot, {
      Trigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      Value: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
      Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      Viewport: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      Item: SelectItem,
      ItemText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
      ScrollUpButton: () => null,
      ScrollDownButton: () => null,
    }),
    Adapt: Object.assign(
      ({ children }: { children: React.ReactNode }) => <>{children}</>,
      { Contents: () => <></> },
    ),
    Sheet: SheetRoot,
    Input: ({
      value = '',
      onChangeText,
      ...rest
    }: {
      value?: string
      onChangeText?: (value: string) => void
    } & React.ComponentPropsWithoutRef<'input'>) => (
      <input
        value={value}
        onChange={(event) => onChangeText?.(event.target.value)}
        {...rest}
      />
    ),
    TextArea: ({
      value = '',
      onChangeText,
      ...rest
    }: {
      value?: string
      onChangeText?: (value: string) => void
    } & React.ComponentPropsWithoutRef<'textarea'>) => (
      <textarea
        value={value}
        onChange={(event) => onChangeText?.(event.target.value)}
        {...rest}
      />
    ),
    Spinner: () => <div>spinner</div>,
    useWindowDimensions: () => ({ width: 1024, height: 768 }),
  }
})

const baseEducationEntry: EducationEntry = {
  id: 'entry-1',
  institution_name: 'Initial University',
  university_id: 'uni-123',
  is_verified: true,
  degree_type: 'Bachelor Degree',
  field_of_study: 'Physics',
  start_date: '2020-01-01',
  end_date: '2022-01-01',
  is_current: false,
  gpa: 3.5,
  description: 'Test description',
  location: 'Remote',
}


vi.mock('@app/core/utils/api', () => ({
  api: {
    profile: {
      getEducation: {
        useQuery: () => ({
          data: [baseEducationEntry],
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        }),
      },
      getEducationLevel: {
        useQuery: () => ({
          data: { education_level: null },
          isLoading: false,
          isError: false,
        }),
      },
      saveEducation: {
        useMutation: () => ({
          mutateAsync: vi.fn(),
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
        getEducation: {
          cancel: vi.fn(),
          getData: vi.fn(() => [baseEducationEntry]),
          setData: vi.fn(),
          invalidate: vi.fn(),
        },
        getEducationLevel: {
          cancel: vi.fn(),
          getData: vi.fn(() => ({ education_level: null })),
          setData: vi.fn(),
        },
      },
    }),
  },
}))

const renderModal = (entry: Partial<EducationEntry>) =>
  render(
    <EducationEntryEditModal
      open
      onOpenChange={vi.fn()}
      educationEntry={{ ...baseEducationEntry, ...entry }}
      onSuccess={vi.fn()}
    />,
  )

describe('EducationEntryEditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows manual entry input when university id is missing', () => {
    renderModal({ university_id: null, is_verified: false })

    expect(screen.getByPlaceholderText('Enter institution name')).toBeInTheDocument()
  })

  it('switches between catalog search and manual entry modes', () => {
    renderModal({ university_id: null, is_verified: false })

    expect(screen.getByPlaceholderText('Enter institution name')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Search from catalog instead'))
    expect(screen.getByPlaceholderText('Search for institution...')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Select from catalog'))
    expect(screen.getByPlaceholderText('Search for institution...')).toHaveValue('Selected University')

    fireEvent.click(screen.getByText("Can't find your institution? Enter it manually"))
    expect(screen.getByPlaceholderText('Enter institution name')).toBeInTheDocument()
  })

  it('shows custom degree input when selecting Other and hides it for standard options', () => {
    renderModal({ university_id: null, is_verified: false })

    fireEvent.click(screen.getByText('Other'))
    expect(screen.getByPlaceholderText('Specify degree type')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Bachelor Degree'))
    expect(screen.queryByPlaceholderText('Specify degree type')).not.toBeInTheDocument()
  })

})

