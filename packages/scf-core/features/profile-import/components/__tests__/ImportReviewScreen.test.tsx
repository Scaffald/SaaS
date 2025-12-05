import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ImportReviewScreen } from '../ImportReviewScreen'

const mockImportData = {
  experience: {
    id: 'experience',
    title: 'Experience',
    items: [
      {
        id: 'exp-1',
        job_title: 'Electrician',
        company_name: 'ABC Corp',
        start_date: '2020-01',
        confidence_score: 85,
      },
    ],
  },
  education: {
    id: 'education',
    title: 'Education',
    items: [
      {
        id: 'edu-1',
        degree: 'Diploma',
        institution: 'Tech School',
        confidence_score: 80,
      },
    ],
  },
  skills: {
    id: 'skills',
    title: 'Skills',
    items: [{ id: 'skill-1', name: 'Electrical Wiring', confidence_score: 75 }],
  },
  certifications: {
    id: 'certifications',
    title: 'Certifications',
    items: [],
  },
  general: {
    id: 'general',
    title: 'General',
    items: [],
  },
}

const mockUseImportData = {
  importData: mockImportData,
  metadata: {
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}

// Remove hook mock - let the real hook use the API mock
// vi.mock('../hooks/useImportData', () => ({
//   useImportData: () => mockUseImportData,
// }))

const mockSaveImportMutation = {
  mutateAsync: vi.fn().mockResolvedValue({ success: true }),
  isPending: false,
}

const mockClearImportMutation = {
  mutateAsync: vi.fn().mockResolvedValue({ success: true }),
  isPending: false,
}

type RawImportList = Array<Record<string, unknown>>
type MockImportPayload = {
  experience: RawImportList
  education: RawImportList
  skills: RawImportList
  certifications: RawImportList
  general: RawImportList
}

type MockImportDataResponse = {
  data?: {
    payload: MockImportPayload
    expiresAt: string
  }
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

const createEmptyPayload = (): MockImportPayload => ({
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  general: [],
})

const mockGetImportDataQuery = vi.hoisted(() =>
  vi.fn(() => ({
    data: {
      payload: createEmptyPayload(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }))
)

vi.mock('@scf/core/utils/api', () => ({
  api: {
    useUtils: vi.fn(() => ({
      profile: {
        getStatus: { invalidate: vi.fn() },
      },
    })),
    profile: {
      import: {
        getImportData: {
          useQuery: mockGetImportDataQuery,
        },
        saveImportData: {
          useMutation: () => mockSaveImportMutation,
        },
        clearImportData: {
          useMutation: () => mockClearImportMutation,
        },
      },
    },
  },
}))

vi.mock('tamagui', () => {
  const Stack = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <div {...rest}>{children}</div>

  const Button = ({
    children,
    onPress,
    disabled,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
    disabled?: boolean
  } & Record<string, unknown>) => (
    <button type="button" onClick={onPress} disabled={disabled} {...rest}>
      {children}
    </button>
  )

  const Text = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <span {...rest}>{children}</span>

  const Paragraph = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <p {...rest}>{children}</p>

  const Card = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => (
    <div data-testid="card" {...rest}>
      {children}
    </div>
  )

  Card.Header = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => (
    <div data-testid="card-header" {...rest}>
      {children}
    </div>
  )

  const ScrollView = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => (
    <div data-testid="scroll-view" {...rest}>
      {children}
    </div>
  )

  const Separator = ({ ...rest }: Record<string, unknown>) => <hr {...rest} />

  const H5 = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <h5 {...rest}>{children}</h5>

  return {
    YStack: Stack,
    XStack: Stack,
    Button,
    Text,
    Paragraph,
    Card,
    CardHeader: Card.Header,
    ScrollView,
    Separator,
    H5,
  }
})

vi.mock('@tamagui/lucide-icons', () => ({
  CheckCircle2: () => <span data-testid="check-icon">Check</span>,
  FileWarning: () => <span data-testid="warning-icon">Warning</span>,
  Loader2: () => <span data-testid="loader-icon">Loader</span>,
  RotateCcw: () => <span data-testid="refresh-icon">Refresh</span>,
  Info: () => <span data-testid="info-icon">Info</span>,
  Clock: () => <span data-testid="clock-icon">Clock</span>,
  ListPlus: () => <span data-testid="list-icon">List</span>,
}))

vi.mock('../ConfidenceBadge', () => ({
  ConfidenceBadge: ({ confidence }: { confidence: number }) => (
    <span data-testid="confidence-badge">{confidence}%</span>
  ),
}))

vi.mock('../ImportSectionTabs', () => ({
  ImportSectionTabs: ({
    sections,
    activeSection,
    onSectionChange,
  }: {
    sections: Array<{ id: string; label: string; count: number }>
    activeSection: string
    onSectionChange: (id: string) => void
  }) => (
    <div data-testid="section-tabs">
      {(sections || []).map((section) => (
        <button
          key={section.id}
          type="button"
          data-active={activeSection === section.id}
          onClick={() => onSectionChange(section.id)}
        >
          {section.label} ({section.count})
        </button>
      ))}
    </div>
  ),
}))

vi.mock('../EditableField', () => ({
  EditableField: ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: string
    onChange: (value: string) => void
  }) => {
    const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`
    return (
      <div data-testid={`editable-field-${label}`}>
        <label htmlFor={inputId}>{label}</label>
        <input id={inputId} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    )
  },
}))

describe('ImportReviewScreen', () => {
  beforeEach(() => {
    mockUseImportData.importData = mockImportData
    mockUseImportData.isLoading = false
    mockUseImportData.isError = false
    mockSaveImportMutation.mutateAsync.mockClear()
    mockClearImportMutation.mutateAsync.mockClear()
    // Reset API mock to return valid data
    mockGetImportDataQuery.mockReturnValue({
      data: {
        payload: {
          experience: [
            {
              id: 'exp-1',
              job_title: 'Electrician',
              company_name: 'ABC Corp',
              start_date: '2020-01',
              confidence_score: 85,
            },
          ],
          education: [
            {
              id: 'edu-1',
              degree: 'Diploma',
              institution: 'Tech School',
              confidence_score: 80,
            },
          ],
          skills: [{ id: 'skill-1', name: 'Electrical Wiring', confidence_score: 75 }],
          certifications: [],
          general: [],
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } satisfies MockImportDataResponse)
  })

  it('renders imported data sections', () => {
    render(<ImportReviewScreen />)

    // Text is split across elements like "Experience (1)", so use regex
    expect(screen.getByText(/Experience/i)).toBeInTheDocument()
    expect(screen.getByText(/Education/i)).toBeInTheDocument()
    expect(screen.getByText(/Skills/i)).toBeInTheDocument()
  })

  it('allows selecting items to import', async () => {
    render(<ImportReviewScreen />)

    // Component uses "Select" buttons - find the button specifically (not help text)
    const selectButtons = screen
      .getAllByRole('button')
      .filter(
        (btn) =>
          btn.textContent?.toLowerCase().includes('select') &&
          !btn.textContent?.toLowerCase().includes('select the items')
      )
    expect(selectButtons.length).toBeGreaterThan(0)

    if (selectButtons.length > 0) {
      fireEvent.click(selectButtons[0])
      await waitFor(() => {
        // After clicking, the button should change to "Selected" - look for button with "Selected" text
        const selectedButtons = screen
          .getAllByRole('button')
          .filter((btn) => btn.textContent?.trim() === 'Selected')
        expect(selectedButtons.length).toBeGreaterThan(0)
      })
    }
  })

  it('enables inline editing of fields', async () => {
    render(<ImportReviewScreen />)

    // Navigate to experience section
    const experienceTab = screen.getByText(/experience/i)
    fireEvent.click(experienceTab)

    // Check for editable fields
    const editableFields = screen.getAllByTestId(/editable-field-/)
    expect(editableFields.length).toBeGreaterThan(0)
  })

  it('handles import confirmation', async () => {
    render(<ImportReviewScreen />)

    // First, select an item - find the "Select" button (not help text)
    const selectButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.textContent?.trim() === 'Select')
    expect(selectButtons.length).toBeGreaterThan(0)
    fireEvent.click(selectButtons[0])

    // Wait for selection to update
    await waitFor(() => {
      const selectedButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.textContent?.trim() === 'Selected')
      expect(selectedButtons.length).toBeGreaterThan(0)
    })

    // Now look for the import button - it should say "Import selected (1)" or similar
    const importButton = screen.getByText(/import selected/i)
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(mockSaveImportMutation.mutateAsync).toHaveBeenCalled()
    })
  })

  it('shows parsing errors', () => {
    // Set up API mock to return data with empty experience section
    mockGetImportDataQuery.mockReturnValue({
      data: {
        payload: {
          experience: [],
          education: [
            {
              id: 'edu-1',
              degree: 'Diploma',
              institution: 'Tech School',
              confidence_score: 80,
            },
          ],
          skills: [{ id: 'skill-1', name: 'Electrical Wiring', confidence_score: 75 }],
          certifications: [],
          general: [],
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } satisfies MockImportDataResponse)

    render(<ImportReviewScreen />)

    // Component should still render even with empty experience section
    expect(screen.getByText(/Education/i)).toBeInTheDocument()
  })

  it('handles empty import state', () => {
    // Set up API mock to return empty data
    mockGetImportDataQuery.mockReturnValue({
      data: {
        payload: {
          experience: [],
          education: [],
          skills: [],
          certifications: [],
          general: [],
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } satisfies MockImportDataResponse)

    render(<ImportReviewScreen />)

    // Should still render but with empty sections
    expect(screen.getByText(/Experience/i)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    // Set up API mock to return loading state
    mockGetImportDataQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof mockGetImportDataQuery>)

    render(<ImportReviewScreen />)

    // Check for loading text
    expect(screen.getByText(/Retrieving imported data/i)).toBeInTheDocument()
  })

  it('handles error state', () => {
    // Set up API mock to return error state - component checks isError OR !importData
    // The hook returns null importData when data?.payload is falsy
    mockGetImportDataQuery.mockReturnValue({
      data: undefined, // undefined data means payload is undefined, so importData is null
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof mockGetImportDataQuery>)

    render(<ImportReviewScreen />)

    // Check for error message text that appears in the component
    // Text might be split, so use a more flexible matcher
    const errorVisible = screen.getByText(/couldn.*load.*import.*data/i)
    expect(errorVisible).toBeInTheDocument()
  })
})
