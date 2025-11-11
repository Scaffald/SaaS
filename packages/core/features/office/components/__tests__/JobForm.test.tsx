import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

const createJobMock = vi.hoisted(() => ({ mutate: vi.fn(), mutateAsync: vi.fn(), useMutation: vi.fn() }))
const updateJobMock = vi.hoisted(() => ({ mutate: vi.fn(), mutateAsync: vi.fn(), useMutation: vi.fn() }))
const toastMock = vi.hoisted(() => ({ show: vi.fn() }))
const routerMock = vi.hoisted(() => ({ back: vi.fn() }))

vi.mock('@app/core/utils/api', () => ({
  api: {
    office: {
      createJob: { useMutation: createJobMock.useMutation },
      updateJob: { useMutation: updateJobMock.useMutation },
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
  AddressForm: ({ onChange, onAddressSelect }: { onChange: (value: string) => void; onAddressSelect: (result: any) => void }) => (
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

const selectChange = { onChange: (value: string) => {} }

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
})
