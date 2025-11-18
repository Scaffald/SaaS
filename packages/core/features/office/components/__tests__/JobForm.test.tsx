import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

const createJobMock = vi.hoisted(() => ({ mutate: vi.fn(), mutateAsync: vi.fn(), useMutation: vi.fn() }))
const updateJobMock = vi.hoisted(() => ({ mutate: vi.fn(), mutateAsync: vi.fn(), useMutation: vi.fn() }))
const toastMock = vi.hoisted(() => ({ show: vi.fn() }))
const routerMock = vi.hoisted(() => ({ back: vi.fn() }))
const teamsListMock = vi.hoisted(() => ({ useQuery: vi.fn() }))

vi.mock('@app/core/utils/api', () => ({
  api: {
    office: {
      createJob: { useMutation: createJobMock.useMutation },
      updateJob: { useMutation: updateJobMock.useMutation },
    },
    teams: {
      list: { useQuery: teamsListMock.useQuery },
    },
  },
}))

vi.mock('@app/core/utils/useAllOrganizations', () => ({
  useAllOrganizations: () => ({
    data: {
      organizations: [
        { id: 'org-1', name: 'Org One', slug: 'org-one', owner_user_id: null },
      ],
    },
  }),
}))

vi.mock('@tamagui/toast', () => ({ useToastController: () => toastMock }))

vi.mock('expo-router', () => ({ useRouter: () => routerMock }))

vi.mock('@app/ui', () => ({
  ScrollView: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  YStack: ({ children, ...rest }: { children: ReactNode; [key: string]: unknown }) => (
    <div {...rest}>{children}</div>
  ),
  XStack: ({ children, ...rest }: { children: ReactNode; [key: string]: unknown }) => (
    <div {...rest}>{children}</div>
  ),
  Text: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Input: ({ value, onChangeText, 'data-testid': dataTestId, placeholder, disabled }: { value?: string; onChangeText?: (value: string) => void; 'data-testid'?: string; placeholder?: string; disabled?: boolean }) => (
    <input
      data-testid={dataTestId}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(event) => onChangeText?.(event.target.value)}
      disabled={disabled}
    />
  ),
  Button: ({ children, onPress, disabled, 'data-testid': dataTestId }: { children: ReactNode; onPress?: () => void; disabled?: boolean; 'data-testid'?: string }) => (
    <button type="button" data-testid={dataTestId} disabled={disabled} onClick={onPress}>
      {children}
    </button>
  ),
  CustomCheckbox: ({ checked, onCheckedChange, 'aria-label': ariaLabel }: { checked?: boolean; onCheckedChange: (next: boolean) => void; 'aria-label'?: string }) => (
    <label>
      <input type="checkbox" aria-label={ariaLabel} checked={Boolean(checked)} onChange={() => onCheckedChange(!checked)} />
    </label>
  ),
  AddressForm: ({ onChange, onAddressSelect }: { onChange: (value: string) => void; onAddressSelect: (result: Record<string, unknown>) => void }) => (
    <div>
      <input
        aria-label="job-location"
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        onClick={() =>
          onAddressSelect({
            formattedAddress: 'Charlotte, NC',
            coordinates: { lat: 35.2, lng: -80.8 },
            route: 'Main St',
            locality: 'Charlotte',
            administrativeAreaLevel1: 'NC',
            postalCode: '28202',
            country: 'USA',
          })
        }
      >
        select-address
      </button>
    </div>
  ),
  Spinner: () => <span>spinner</span>,
}))

vi.mock('@tamagui/lucide-icons', () => ({
  Check: () => <span data-testid="check-icon" />,
  ChevronDown: () => <span data-testid="chevron-icon" />,
}))

const selectChange = { onChange: (_value: string) => {} }

vi.mock('tamagui', async () => {
  const actual = await vi.importActual<typeof import('tamagui')>('tamagui')
  const TextArea = ({ value, onChangeText, 'data-testid': dataTestId, placeholder }: { value?: string; onChangeText?: (value: string) => void; 'data-testid'?: string; placeholder?: string }) => (
    <textarea
      data-testid={dataTestId}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(event) => onChangeText?.(event.target.value)}
    />
  )
  const SelectRoot = ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: ReactNode }) => {
    selectChange.onChange = onValueChange
    return <div data-testid="select" data-value={value}>{children}</div>
  }
  SelectRoot.Trigger = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectRoot.Value = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>
  SelectRoot.Content = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectRoot.Viewport = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectRoot.Group = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectRoot.Label = ({ children }: { children: ReactNode }) => <div>{children}</div>
  SelectRoot.ScrollUpButton = () => null
  SelectRoot.ScrollDownButton = () => null
  SelectRoot.Item = ({ value, children }: { value: string; children: ReactNode }) => (
    <button type="button" data-testid={`select-item-${value}`} onClick={() => selectChange.onChange(value)}>
      {children}
    </button>
  )
  SelectRoot.ItemText = ({ children }: { children: ReactNode }) => <span>{children}</span>
  SelectRoot.ItemIndicator = ({ children }: { children: ReactNode }) => <span>{children}</span>

  return {
    ...actual,
    Select: SelectRoot,
    Adapt: Object.assign(({ children }: { children: ReactNode }) => <>{children}</>, {
      Contents: ({ children }: { children: ReactNode }) => <>{children}</>,
    }),
    Sheet: Object.assign(({ children }: { children: ReactNode }) => <div>{children}</div>, {
      Frame: ({ children }: { children: ReactNode }) => <div>{children}</div>,
      ScrollView: ({ children }: { children: ReactNode }) => <div>{children}</div>,
      Overlay: () => <div data-testid="sheet-overlay" />,
    }),
    TextArea,
    Check: () => <span>check</span>,
  }
})

vi.mock('../job-form-sections', () => ({
  JobMetadataSection: ({ onUpdate }: { onUpdate: (data: unknown) => void }) => (
    <button type="button" onClick={() => onUpdate({ internal_job_code: 'AUTO' })}>
      metadata-update
    </button>
  ),
  ApplicationScreeningSection: ({ onUpdate }: { onUpdate: (data: unknown) => void }) => (
    <button type="button" onClick={() => onUpdate({ minimum_years_experience: 3 })}>
      screening-update
    </button>
  ),
  ScoreThresholdSection: ({ onUpdate }: { onUpdate: (score?: number) => void }) => (
    <button type="button" onClick={() => onUpdate(75)}>
      score-update
    </button>
  ),
  AutoRejectionSection: ({ onUpdate }: { onUpdate: (data: unknown) => void }) => (
    <button type="button" onClick={() => onUpdate({ enable_auto_reject: true, auto_reject_criteria: {} })}>
      autoreject-update
    </button>
  ),
  EnhancedRequirementsSection: ({ onUpdate }: { onUpdate: (data: unknown) => void }) => (
    <button type="button" onClick={() => onUpdate({ minimum_education_level: 'bachelor' })}>
      requirements-update
    </button>
  ),
  CompensationBenefitsSection: ({ onUpdate }: { onUpdate: (data: unknown) => void }) => (
    <button type="button" onClick={() => onUpdate({ has_bonus_structure: true })}>
      compensation-update
    </button>
  ),
  ApplicationProcessSection: ({ onUpdate }: { onUpdate: (data: unknown) => void }) => (
    <button type="button" onClick={() => onUpdate({ requires_assessment: true })}>
      process-update
    </button>
  ),
  LocationSchedulingSection: ({ onUpdate }: { onUpdate: (data: unknown) => void }) => (
    <button type="button" onClick={() => onUpdate({ timezone: 'EST' })}>
      location-update
    </button>
  ),
  DistributionVisibilitySection: ({ onUpdate }: { onUpdate: (data: unknown) => void }) => (
    <button type="button" onClick={() => onUpdate({ is_featured: true })}>
      distribution-update
    </button>
  ),
  ComplianceAnalyticsSection: ({ onUpdate }: { onUpdate: (data: unknown) => void }) => (
    <button type="button" onClick={() => onUpdate({ eeo_job_category: 'A' })}>
      compliance-update
    </button>
  ),
}))

const { JobForm } = await import('../JobForm')

describe('JobForm', () => {
  const onSuccess = vi.fn()

  beforeEach(() => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'pk.test'
    createJobMock.mutate.mockReset()
    createJobMock.mutateAsync.mockReset()
    updateJobMock.mutate.mockReset()
    updateJobMock.mutateAsync.mockReset()
    createJobMock.useMutation.mockReturnValue({ mutate: createJobMock.mutate, isPending: false })
    updateJobMock.useMutation.mockReturnValue({ mutate: updateJobMock.mutate, isPending: false })
    toastMock.show.mockReset()
    routerMock.back.mockReset()
    onSuccess.mockReset()
    teamsListMock.useQuery.mockReturnValue({
      data: {
        teams: [
          { id: 'team-1', name: 'Primary Crew', is_primary: true },
          { id: 'team-2', name: 'Support Crew', is_primary: false },
        ],
      },
      isLoading: false,
    })
  })

  it('auto-populates organization when only one option available', () => {
     render(<JobForm mode="create" onSuccess={onSuccess} />)
    const selects = screen.getAllByTestId('select')
    expect(selects[0]).toHaveAttribute('data-value', 'org-1')
  })

  it('submits draft with required fields', async () => {
    const user = userEvent.setup()

    render(<JobForm mode="create" onSuccess={onSuccess} />)

    await user.type(screen.getByTestId('job-title-input'), 'Electrician')
    await user.type(screen.getByTestId('job-description-input'), 'Install wiring')

    await user.click(screen.getByTestId('job-save-draft-button'))

    expect(createJobMock.mutate).toHaveBeenCalledWith({
      title: 'Electrician',
      description: 'Install wiring',
      organization_id: 'org-1',
      status: 'draft',
    })
  })

  it('publishes job with location and calls toast + router', async () => {
    const user = userEvent.setup()

    render(<JobForm mode="create" onSuccess={onSuccess} />)

    await user.type(screen.getByTestId('job-title-input'), 'Plumber')
    await user.type(screen.getByTestId('job-description-input'), 'Fix pipes')
    await user.type(screen.getByLabelText('job-location'), 'Charlotte, NC')
    await user.click(screen.getByText('select-address'))

    await user.click(screen.getByTestId('job-publish-button'))

    expect(createJobMock.mutate).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Plumber',
      description: 'Fix pipes',
      organization_id: 'org-1',
      status: 'open',
      location: 'Charlotte, NC',
    }))
  })

  describe('Form Section Rendering', () => {
    it('renders all form sections', () => {
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      // Check that section update buttons are present (indicating sections render)
      expect(screen.getByText('metadata-update')).toBeInTheDocument()
      expect(screen.getByText('screening-update')).toBeInTheDocument()
      expect(screen.getByText('score-update')).toBeInTheDocument()
      expect(screen.getByText('autoreject-update')).toBeInTheDocument()
      expect(screen.getByText('requirements-update')).toBeInTheDocument()
      expect(screen.getByText('compensation-update')).toBeInTheDocument()
      expect(screen.getByText('process-update')).toBeInTheDocument()
      expect(screen.getByText('location-update')).toBeInTheDocument()
      expect(screen.getByText('distribution-update')).toBeInTheDocument()
      expect(screen.getByText('compliance-update')).toBeInTheDocument()
    })

    it('renders basic information fields', () => {
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      expect(screen.getByTestId('job-organization-select')).toBeInTheDocument()
      expect(screen.getByTestId('job-title-input')).toBeInTheDocument()
      expect(screen.getByTestId('job-description-input')).toBeInTheDocument()
    })
  })

  describe('Form Field Validation', () => {
    it('requires organization selection', () => {
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      const saveDraftButton = screen.getByTestId('job-save-draft-button')
      expect(saveDraftButton).toBeDisabled()
    })

    it('requires title for submission', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      // Select organization first
      const orgSelect = screen.getAllByTestId('select')[0]
      selectChange.onChange('org-1')
      await user.click(orgSelect)

      // Try to save without title
      const saveDraftButton = screen.getByTestId('job-save-draft-button')
      expect(saveDraftButton).toBeDisabled()
    })

    it('requires description for submission', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      // Select organization
      const orgSelect = screen.getAllByTestId('select')[0]
      selectChange.onChange('org-1')
      await user.click(orgSelect)

      // Fill title but not description
      await user.type(screen.getByTestId('job-title-input'), 'Test Job')

      const saveDraftButton = screen.getByTestId('job-save-draft-button')
      expect(saveDraftButton).toBeDisabled()
    })

    it('enables save button when required fields are filled', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      // Select organization
      const orgSelect = screen.getAllByTestId('select')[0]
      selectChange.onChange('org-1')
      await user.click(orgSelect)

      // Fill required fields
      await user.type(screen.getByTestId('job-title-input'), 'Test Job')
      await user.type(screen.getByTestId('job-description-input'), 'Test description')

      const saveDraftButton = screen.getByTestId('job-save-draft-button')
      expect(saveDraftButton).not.toBeDisabled()
    })
  })

  describe('Form State Management', () => {
    it('updates form data when fields change', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      await user.type(screen.getByTestId('job-title-input'), 'New Title')
      const titleInput = screen.getByTestId('job-title-input') as HTMLInputElement
      expect(titleInput.value).toBe('New Title')
    })

    it('preserves form data on section updates', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      await user.type(screen.getByTestId('job-title-input'), 'Test Job')

      // Update a section
      await user.click(screen.getByText('metadata-update'))

      // Title should still be preserved
      const titleInput = screen.getByTestId('job-title-input') as HTMLInputElement
      expect(titleInput.value).toBe('Test Job')
    })

    it('handles section updates correctly', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      // Update metadata section
      await user.click(screen.getByText('metadata-update'))

      // Update screening section
      await user.click(screen.getByText('screening-update'))

      // Update score section
      await user.click(screen.getByText('score-update'))

      // All updates should be callable
      expect(screen.getByText('metadata-update')).toBeInTheDocument()
      expect(screen.getByText('screening-update')).toBeInTheDocument()
      expect(screen.getByText('score-update')).toBeInTheDocument()
    })

    it('resets form on cancel', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      await user.type(screen.getByTestId('job-title-input'), 'Test Job')
      await user.type(screen.getByTestId('job-description-input'), 'Test description')

      const cancelButton = screen.getByTestId('job-cancel-button')
      await user.click(cancelButton)

      expect(routerMock.back).toHaveBeenCalled()
    })
  })

  describe('Form Section-Specific Tests', () => {
    it('handles JobMetadataSection updates', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      await user.click(screen.getByText('metadata-update'))

      // Section should be interactive
      expect(screen.getByText('metadata-update')).toBeInTheDocument()
    })

    it('handles ApplicationScreeningSection updates', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      await user.click(screen.getByText('screening-update'))

      expect(screen.getByText('screening-update')).toBeInTheDocument()
    })

    it('handles ScoreThresholdSection updates', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      await user.click(screen.getByText('score-update'))

      expect(screen.getByText('score-update')).toBeInTheDocument()
    })

    it('handles AutoRejectionSection updates', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      await user.click(screen.getByText('autoreject-update'))

      expect(screen.getByText('autoreject-update')).toBeInTheDocument()
    })

    it('handles EnhancedRequirementsSection updates', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      await user.click(screen.getByText('requirements-update'))

      expect(screen.getByText('requirements-update')).toBeInTheDocument()
    })

    it('handles CompensationBenefitsSection updates', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      await user.click(screen.getByText('compensation-update'))

      expect(screen.getByText('compensation-update')).toBeInTheDocument()
    })

    it('handles ApplicationProcessSection updates', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      await user.click(screen.getByText('process-update'))

      expect(screen.getByText('process-update')).toBeInTheDocument()
    })

    it('handles LocationSchedulingSection updates', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      await user.click(screen.getByText('location-update'))

      expect(screen.getByText('location-update')).toBeInTheDocument()
    })

    it('handles DistributionVisibilitySection updates', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      await user.click(screen.getByText('distribution-update'))

      expect(screen.getByText('distribution-update')).toBeInTheDocument()
    })

    it('handles ComplianceAnalyticsSection updates', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      await user.click(screen.getByText('compliance-update'))

      expect(screen.getByText('compliance-update')).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('saves as draft with incomplete data', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      // Select organization
      const orgSelect = screen.getAllByTestId('select')[0]
      selectChange.onChange('org-1')
      await user.click(orgSelect)

      // Fill only required fields
      await user.type(screen.getByTestId('job-title-input'), 'Draft Job')
      await user.type(screen.getByTestId('job-description-input'), 'Draft description')

      await user.click(screen.getByTestId('job-save-draft-button'))

      expect(createJobMock.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Draft Job',
          description: 'Draft description',
          organization_id: 'org-1',
          status: 'draft',
        })
      )
    })

    it('publishes with complete data', async () => {
      const user = userEvent.setup()
      render(<JobForm mode="create" onSuccess={onSuccess} />)

      // Select organization
      const orgSelect = screen.getAllByTestId('select')[0]
      selectChange.onChange('org-1')
      await user.click(orgSelect)

      // Fill required fields
      await user.type(screen.getByTestId('job-title-input'), 'Published Job')
      await user.type(screen.getByTestId('job-description-input'), 'Published description')
      await user.type(screen.getByLabelText('job-location'), 'Charlotte, NC')
      await user.click(screen.getByText('select-address'))

      await user.click(screen.getByTestId('job-publish-button'))

      expect(createJobMock.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Published Job',
          description: 'Published description',
          organization_id: 'org-1',
          status: 'open',
          location: 'Charlotte, NC',
        })
      )
    })

    it('handles edit mode with initial data', () => {
      const initialData = {
        title: 'Existing Job',
        description: 'Existing description',
        organization_id: 'org-1',
      }

      render(<JobForm mode="edit" jobId="job-123" initialData={initialData} onSuccess={onSuccess} />)

      const titleInput = screen.getByTestId('job-title-input') as HTMLInputElement
      expect(titleInput.value).toBe('Existing Job')
    })

    it('updates existing job', async () => {
      const user = userEvent.setup()
      const initialData = {
        title: 'Original Job',
        description: 'Original description',
        organization_id: 'org-1',
      }

      render(<JobForm mode="edit" jobId="job-123" initialData={initialData} onSuccess={onSuccess} />)

      const titleInput = screen.getByTestId('job-title-input')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Job')

      await user.click(screen.getByTestId('job-save-draft-button'))

      expect(updateJobMock.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'job-123',
          title: 'Updated Job',
          status: 'draft',
        })
      )
    })

    it('shows loading state during submission', () => {
      createJobMock.useMutation.mockReturnValue({
        mutate: createJobMock.mutate,
        isPending: true,
      })

      render(<JobForm mode="create" onSuccess={onSuccess} />)

      // Form should show loading state (buttons disabled)
      const saveDraftButton = screen.getByTestId('job-save-draft-button')
      expect(saveDraftButton).toBeDisabled()
    })

    it('calls onSuccess callback after successful submission', async () => {
      const user = userEvent.setup()
      createJobMock.mutate.mockImplementation((_data, options) => {
        options?.onSuccess?.()
      })

      render(<JobForm mode="create" onSuccess={onSuccess} />)

      // Select organization
      const orgSelect = screen.getAllByTestId('select')[0]
      selectChange.onChange('org-1')
      await user.click(orgSelect)

      await user.type(screen.getByTestId('job-title-input'), 'Test Job')
      await user.type(screen.getByTestId('job-description-input'), 'Test description')

      await user.click(screen.getByTestId('job-save-draft-button'))

      expect(onSuccess).toHaveBeenCalled()
    })

    it('shows error toast on submission failure', async () => {
      const user = userEvent.setup()
      const error = new Error('Submission failed')
      createJobMock.mutate.mockImplementation((_data, options) => {
        options?.onError?.(error)
      })

      render(<JobForm mode="create" onSuccess={onSuccess} />)

      // Select organization
      const orgSelect = screen.getAllByTestId('select')[0]
      selectChange.onChange('org-1')
      await user.click(orgSelect)

      await user.type(screen.getByTestId('job-title-input'), 'Test Job')
      await user.type(screen.getByTestId('job-description-input'), 'Test description')

      await user.click(screen.getByTestId('job-save-draft-button'))

      expect(toastMock.show).toHaveBeenCalledWith('Error: Submission failed', { variant: 'error' })
    })
  })

  describe('Edit Mode', () => {
    it('pre-populates form with existing job data', () => {
      const initialData = {
        title: 'Existing Job Title',
        description: 'Existing job description',
        organization_id: 'org-1',
        location: 'New York, NY',
        employment_type: 'full-time',
      }

      render(<JobForm mode="edit" jobId="job-123" initialData={initialData} onSuccess={onSuccess} />)

      const titleInput = screen.getByTestId('job-title-input') as HTMLInputElement
      expect(titleInput.value).toBe('Existing Job Title')
    })

    it('uses updateJob mutation in edit mode', async () => {
      const user = userEvent.setup()
      const initialData = {
        title: 'Original Title',
        description: 'Original description',
        organization_id: 'org-1',
      }

      render(<JobForm mode="edit" jobId="job-123" initialData={initialData} onSuccess={onSuccess} />)

      const titleInput = screen.getByTestId('job-title-input')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')

      await user.click(screen.getByTestId('job-save-draft-button'))

      expect(updateJobMock.mutate).toHaveBeenCalled()
      expect(createJobMock.mutate).not.toHaveBeenCalled()
    })
  })
})
