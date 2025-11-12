import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ImportData } from '../../hooks/useImportData'
import { ImportReviewScreen } from '../ImportReviewScreen'

const useImportDataMock = vi.fn()
const saveImportMutation = vi.fn()
const clearImportMutation = vi.fn()
const invalidateImportData = vi.fn()

vi.mock('../../hooks/useImportData', () => ({
  useImportData: () => useImportDataMock(),
}))

vi.mock('../ImportSectionTabs', () => ({
  ImportSectionTabs: ({
    sections,
    activeSection,
    onSectionChange,
  }: {
    sections: Array<{ id: string; label: string; count: number }>
    activeSection: string
    onSectionChange: (sectionId: string) => void
  }) => (
    <div data-testid="import-section-tabs">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          data-active={section.id === activeSection}
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
  }: {
    label: string
    value: string | null | undefined
  }) => (
    <div data-testid="editable-field">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  ),
}))

vi.mock('../ConfidenceBadge', () => ({
  ConfidenceBadge: ({ level }: { level: string }) => (
    <span data-testid="confidence-badge">{level}</span>
  ),
}))

vi.mock('@app/core/utils/api', () => ({
  api: {
    profile: {
      import: {
        saveImportData: {
          useMutation: () => ({
            mutateAsync: saveImportMutation,
            isPending: false,
          }),
        },
        clearImportData: {
          useMutation: () => ({
            mutateAsync: clearImportMutation,
            isPending: false,
          }),
        },
      },
    },
    useUtils: () => ({
      profile: {
        import: {
          getImportData: {
            invalidate: invalidateImportData,
          },
        },
      },
    }),
  },
}))

vi.mock('@tamagui/lucide-icons', () => ({
  CheckCircle2: () => <span>check</span>,
  FileWarning: () => <span>warning</span>,
  Loader2: () => <span>loader</span>,
  RotateCcw: () => <span>rotate</span>,
  Info: () => <span>info</span>,
  Clock: () => <span>clock</span>,
  ListPlus: () => <span>list</span>,
}))

vi.mock('tamagui', () => {
  const createStack = (name: string) =>
    function Stack({
      children,
      ...rest
    }: {
      children?: ReactNode
    } & Record<string, unknown>) {
      return (
        <div data-testid={name} {...rest}>
          {children}
        </div>
      )
    }

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

  const Separator = () => <hr data-testid="separator" />

  const H5 = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <h5 {...rest}>{children}</h5>

  return {
    YStack: createStack('ystack'),
    XStack: createStack('xstack'),
    Button,
    Text,
    Paragraph,
    ScrollView,
    Card,
    CardHeader: Card.Header,
    Separator,
    H5,
  }
})

const importData: ImportData = {
  general: {
    id: 'general',
    title: 'General Info',
    items: [
      {
        id: 'general-1',
        firstName: 'Jane',
        lastName: 'Doe',
        headline: 'Electrician',
        summary: 'Experienced electrician',
        confidenceScore: 0.8,
      },
    ],
  },
  experience: {
    id: 'experience',
    title: 'Experience',
    items: [
      {
        id: 'exp-1',
        jobTitle: 'Field Electrician',
        companyName: 'Bright Sparks',
        startDate: '2022-01-01',
        endDate: null,
        isCurrent: true,
        confidenceScore: 0.9,
      },
    ],
  },
  education: {
    id: 'education',
    title: 'Education',
    items: [],
  },
  skills: {
    id: 'skills',
    title: 'Skills',
    items: [
      {
        id: 'skill-1',
        name: 'Wiring',
        confidenceScore: 0.75,
        taxonomy: 'onet',
      },
    ],
  },
  certifications: {
    id: 'certifications',
    title: 'Certifications',
    items: [],
  },
}

const refetchMock = vi.fn()

const baseHookReturn = {
  importData,
  metadata: {
    source: 'resume',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    storedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  isLoading: false,
  isError: false,
  refetch: refetchMock,
}

describe('ImportReviewScreen', () => {
  beforeEach(() => {
    useImportDataMock.mockReturnValue(baseHookReturn)
    saveImportMutation.mockReset()
    clearImportMutation.mockReset()
    invalidateImportData.mockReset()
    refetchMock.mockReset()
  })

  it('shows loading state while import data is fetched', () => {
    useImportDataMock.mockReturnValue({
      ...baseHookReturn,
      isLoading: true,
    })

    render(<ImportReviewScreen />)

    expect(screen.getByText('Retrieving imported data...')).toBeInTheDocument()
  })

  it('shows error state with retry action when import data fails to load', () => {
    useImportDataMock.mockReturnValue({
      ...baseHookReturn,
      importData: null,
      isError: true,
    })

    render(<ImportReviewScreen />)

    fireEvent.click(screen.getByText('Retry'))
    expect(refetchMock).toHaveBeenCalledTimes(1)
  })

  it('allows selecting items and importing the chosen data', async () => {
    let resolveMutation: (() => void) | undefined
    saveImportMutation.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveMutation = resolve
        }),
    )

    render(<ImportReviewScreen />)

    // Experience section is active by default
    fireEvent.click(screen.getByText('Select'))

    fireEvent.click(screen.getByText('General Info (1)'))
    fireEvent.click(screen.getByText('Select'))

    fireEvent.click(screen.getByText('Skills (1)'))
    fireEvent.click(screen.getByText('Select'))

    expect(screen.getByText('Import selected (3)')).toBeEnabled()

    fireEvent.click(screen.getByText('Import selected (3)'))

    expect(saveImportMutation).toHaveBeenCalledTimes(1)
    expect(saveImportMutation).toHaveBeenCalledWith({
      source: 'resume',
      payload: {
        general: [
          {
            first_name: 'Jane',
            last_name: 'Doe',
            headline: 'Electrician',
            summary: 'Experienced electrician',
            confidence_score: 0.8,
          },
        ],
        experience: [
          {
            job_title: 'Field Electrician',
            company_name: 'Bright Sparks',
            start_date: '2022-01-01',
            end_date: null,
            is_current: true,
            confidence_score: 0.9,
          },
        ],
        education: [],
        skills: [
          {
            name: 'Wiring',
            taxonomy: 'onet',
            confidence_score: 0.75,
          },
        ],
        certifications: [],
      },
    })

    expect(screen.getByText('Importing 0 of 3...')).toBeInTheDocument()

    resolveMutation?.()
    await waitFor(() =>
      expect(screen.getByText('Import selected (0)')).toBeDisabled(),
    )

    expect(invalidateImportData).toHaveBeenCalledTimes(1)
    expect(refetchMock).toHaveBeenCalledTimes(1)
  })

  it('clears selections and import data using provided actions', async () => {
    clearImportMutation.mockResolvedValue(undefined)

    render(<ImportReviewScreen />)

    fireEvent.click(screen.getByText('Select'))
    expect(screen.getByText('Import selected (1)')).toBeEnabled()

    fireEvent.click(screen.getByText('Clear selections'))
    expect(screen.getByText('Import selected (0)')).toBeDisabled()

    fireEvent.click(screen.getByText('Select all'))
    expect(screen.getByText('Import selected (3)')).toBeEnabled()

    fireEvent.click(screen.getByText('Clear import'))
    expect(clearImportMutation).toHaveBeenCalledTimes(1)
    expect(invalidateImportData).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(refetchMock).toHaveBeenCalledTimes(1))
  })
})


