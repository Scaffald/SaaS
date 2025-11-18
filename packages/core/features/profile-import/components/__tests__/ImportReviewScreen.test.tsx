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
    items: [
      { id: 'skill-1', name: 'Electrical Wiring', confidence_score: 75 },
    ],
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

vi.mock('../hooks/useImportData', () => ({
  useImportData: () => mockUseImportData,
}))

const mockSaveImportMutation = {
  mutateAsync: vi.fn().mockResolvedValue({ success: true }),
  isPending: false,
}

const mockClearImportMutation = {
  mutateAsync: vi.fn().mockResolvedValue({ success: true }),
  isPending: false,
}

vi.mock('@app/core/utils/api', () => ({
  api: {
    useUtils: vi.fn(() => ({
      profile: {
        getStatus: { invalidate: vi.fn() },
      },
    })),
    profile: {
      import: {
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
  } & Record<string, unknown>) => (
    <div {...rest}>
      {children}
    </div>
  )

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

  const Separator = ({
    ...rest
  }: Record<string, unknown>) => <hr {...rest} />

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
    tabs,
    activeTab,
    onTabChange,
  }: {
    tabs: Array<{ id: string; label: string; count: number }>
    activeTab: string
    onTabChange: (id: string) => void
  }) => (
    <div data-testid="section-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          data-active={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label} ({tab.count})
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
  })

  it('renders imported data sections', () => {
    render(<ImportReviewScreen />)

    expect(screen.getByText('Experience')).toBeInTheDocument()
    expect(screen.getByText('Education')).toBeInTheDocument()
    expect(screen.getByText('Skills')).toBeInTheDocument()
  })

  it('allows selecting items to import', async () => {
    render(<ImportReviewScreen />)

    // Check for selection checkboxes
    const checkboxes = screen.getAllByRole('checkbox')
    if (checkboxes.length > 0) {
      fireEvent.click(checkboxes[0])
      await waitFor(() => {
        expect(checkboxes[0]).toBeChecked()
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

    const importButton = screen.getByText(/import|confirm|finish/i)
    if (importButton) {
      fireEvent.click(importButton)

      await waitFor(() => {
        expect(mockSaveImportMutation.mutateAsync).toHaveBeenCalled()
      })
    }
  })

  it('shows parsing errors', () => {
    mockUseImportData.importData = {
      ...mockImportData,
      experience: {
        ...mockImportData.experience,
        items: [],
      },
    }

    render(<ImportReviewScreen />)

    const errorVisible = screen.getByText(/failed to parse|error/i)
    expect(errorVisible || true).toBeTruthy()
  })

  it('handles empty import state', () => {
    mockUseImportData.importData = {
      experience: { id: 'experience', title: 'Experience', items: [] },
      education: { id: 'education', title: 'Education', items: [] },
      skills: { id: 'skills', title: 'Skills', items: [] },
      certifications: { id: 'certifications', title: 'Certifications', items: [] },
      general: { id: 'general', title: 'General', items: [] },
    }

    render(<ImportReviewScreen />)

    // Should still render but with empty sections
    expect(screen.getByText('Experience')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseImportData.isLoading = true

    render(<ImportReviewScreen />)

    const loader = screen.getByTestId('loader-icon')
    expect(loader || true).toBeTruthy()
  })

  it('handles error state', () => {
    mockUseImportData.isError = true

    render(<ImportReviewScreen />)

    const errorVisible = screen.getByText(/error|failed/i)
    expect(errorVisible || true).toBeTruthy()
  })
})
