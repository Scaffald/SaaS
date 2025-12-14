/**
 * RequirementEditorForm Tests
 * REQ-2, TASK-14: Tests for requirement editor form component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RequirementEditorForm from '../RequirementEditorForm';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock mutations
const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();

vi.mock('../../../hooks/useComplianceRequirements', () => ({
  useCreateComplianceRequirement: () => ({
    mutateAsync: mockCreateMutate,
    isLoading: false,
  }),
  useUpdateComplianceRequirement: () => ({
    mutateAsync: mockUpdateMutate,
    isLoading: false,
  }),
}));

// Mock Common components
vi.mock('../../Common/Button', () => ({
  default: ({ children, onClick, type, disabled, variant, size }: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: string;
    disabled?: boolean;
    variant?: string;
    size?: string;
  }) => (
    <button
      onClick={onClick}
      type={type as 'button' | 'submit' | 'reset'}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../Common/Input', () => ({
  default: ({ label, value, onChange, error, disabled, required, type, placeholder }: {
    label: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    type?: string;
    placeholder?: string;
  }) => (
    <div>
      <label>{label}</label>
      <input
        data-testid={`input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        type={type || 'text'}
        placeholder={placeholder}
        aria-required={required}
      />
      {error && <span className="error">{error}</span>}
    </div>
  ),
}));

vi.mock('../../Common/Textarea', () => ({
  default: ({ label, value, onChange, rows, placeholder }: {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    rows?: number;
    placeholder?: string;
  }) => (
    <div>
      <label>{label}</label>
      <textarea
        data-testid={`textarea-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  ),
}));

vi.mock('../../Common/Select', () => ({
  default: ({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
  }) => (
    <div>
      <label>{label}</label>
      <select
        data-testid={`select-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        value={value}
        onChange={onChange}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

describe('RequirementEditorForm', () => {
  const defaultProps = {
    organizationId: 'org-123',
  };

  const existingRequirement = {
    id: 'req-456',
    organization_id: 'org-123',
    code: 'GL-001',
    name: 'General Liability $1M/$2M',
    type: 'general_liability' as const,
    description: 'Standard general liability requirement',
    status: 'active' as const,
    is_template: false,
    effective_date: '2024-01-01',
    expiration_date: '2024-12-31',
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'user-1',
    requirement_definition: {
      coverage_limits: {
        per_occurrence: 1000000,
        aggregate: 2000000,
      },
      required_endorsements: [
        { code: 'CG 20 10', name: 'Additional Insured', is_mandatory: true },
      ],
      policy_conditions: [
        { type: 'Deductible', description: 'Max $10,000', is_waivable: false },
      ],
      documentation_requirements: [
        { type: 'COI', description: 'Certificate of Insurance', is_mandatory: true },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutate.mockResolvedValue({ id: 'new-req-123' });
    mockUpdateMutate.mockResolvedValue({ id: 'req-456' });
  });

  describe('Rendering', () => {
    it('renders create form with empty fields', () => {
      render(<RequirementEditorForm {...defaultProps} />);

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Coverage Limits')).toBeInTheDocument();
      expect(screen.getByText(/Required Endorsements/)).toBeInTheDocument();
      expect(screen.getByText(/Policy Conditions/)).toBeInTheDocument();
      expect(screen.getByText(/Documentation Requirements/)).toBeInTheDocument();
    });

    it('renders edit form with existing requirement data', () => {
      render(<RequirementEditorForm {...defaultProps} requirement={existingRequirement} />);

      expect(screen.getByTestId('input-code')).toHaveValue('GL-001');
      expect(screen.getByTestId('input-name')).toHaveValue('General Liability $1M/$2M');
      expect(screen.getByTestId('select-coverage-type')).toHaveValue('general_liability');
      expect(screen.getByTestId('select-status')).toHaveValue('active');
    });

    it('disables code field when editing', () => {
      render(<RequirementEditorForm {...defaultProps} requirement={existingRequirement} />);

      expect(screen.getByTestId('input-code')).toBeDisabled();
    });

    it('enables code field when creating new', () => {
      render(<RequirementEditorForm {...defaultProps} />);

      expect(screen.getByTestId('input-code')).not.toBeDisabled();
    });

    it('renders change summary field only when editing', () => {
      const { rerender } = render(<RequirementEditorForm {...defaultProps} />);
      expect(screen.queryByTestId('textarea-change-summary')).not.toBeInTheDocument();

      rerender(<RequirementEditorForm {...defaultProps} requirement={existingRequirement} />);
      expect(screen.getByTestId('textarea-change-summary')).toBeInTheDocument();
    });

    it('sets is_template from prop', () => {
      render(<RequirementEditorForm {...defaultProps} isTemplate />);

      const checkbox = screen.getByRole('checkbox', { name: /template/i });
      expect(checkbox).toBeChecked();
    });
  });

  describe('Section Collapsing', () => {
    it('toggles section visibility when clicking header', async () => {
      const user = userEvent.setup();
      render(<RequirementEditorForm {...defaultProps} />);

      // Basic Info is expanded by default
      expect(screen.getByTestId('input-code')).toBeInTheDocument();

      // Click to collapse
      await user.click(screen.getByText('Basic Information'));
      expect(screen.queryByTestId('input-code')).not.toBeInTheDocument();

      // Click to expand
      await user.click(screen.getByText('Basic Information'));
      expect(screen.getByTestId('input-code')).toBeInTheDocument();
    });

    it('shows count in endorsements section header', () => {
      render(<RequirementEditorForm {...defaultProps} requirement={existingRequirement} />);

      // Requirement has 1 endorsement - check within the section header
      const endorsementsHeader = screen.getByText(/Required Endorsements/).closest('button');
      expect(endorsementsHeader).toBeInTheDocument();
      expect(endorsementsHeader).toHaveTextContent('(1)');
    });
  });

  describe('Form Validation', () => {
    it('shows error when code is empty', async () => {
      const user = userEvent.setup();
      render(<RequirementEditorForm {...defaultProps} />);

      // Fill name but leave code empty
      await user.type(screen.getByTestId('input-name'), 'Test Requirement');

      // Submit
      await user.click(screen.getByText('Create Requirement'));

      expect(screen.getByText('Code is required')).toBeInTheDocument();
      expect(mockCreateMutate).not.toHaveBeenCalled();
    });

    it('shows error when code has invalid characters', async () => {
      const user = userEvent.setup();
      render(<RequirementEditorForm {...defaultProps} />);

      await user.type(screen.getByTestId('input-code'), 'GL@001!');
      await user.type(screen.getByTestId('input-name'), 'Test Requirement');

      await user.click(screen.getByText('Create Requirement'));

      expect(screen.getByText('Code must be alphanumeric with dashes only')).toBeInTheDocument();
    });

    it('shows error when name is empty', async () => {
      const user = userEvent.setup();
      render(<RequirementEditorForm {...defaultProps} />);

      await user.type(screen.getByTestId('input-code'), 'GL-001');
      // Leave name empty

      await user.click(screen.getByText('Create Requirement'));

      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('clears field error when typing', async () => {
      const user = userEvent.setup();
      render(<RequirementEditorForm {...defaultProps} />);

      // Submit to trigger error
      await user.click(screen.getByText('Create Requirement'));
      expect(screen.getByText('Code is required')).toBeInTheDocument();

      // Start typing
      await user.type(screen.getByTestId('input-code'), 'G');

      // Error should be cleared
      expect(screen.queryByText('Code is required')).not.toBeInTheDocument();
    });
  });

  describe('Coverage Limits', () => {
    it('updates coverage limit fields', async () => {
      const user = userEvent.setup();
      render(<RequirementEditorForm {...defaultProps} />);

      const perOccurrence = screen.getByTestId('input-per-occurrence');
      await user.clear(perOccurrence);
      await user.type(perOccurrence, '1000000');

      expect(perOccurrence).toHaveValue(1000000);
    });

    it('renders existing coverage limits', () => {
      render(<RequirementEditorForm {...defaultProps} requirement={existingRequirement} />);

      expect(screen.getByTestId('input-per-occurrence')).toHaveValue(1000000);
      expect(screen.getByTestId('input-aggregate')).toHaveValue(2000000);
    });
  });

  describe('Endorsements Management', () => {
    it('renders endorsement section header', () => {
      render(<RequirementEditorForm {...defaultProps} />);

      // Verify the section header exists
      expect(screen.getByText(/Required Endorsements/)).toBeInTheDocument();
    });

    it('shows add endorsement button when expanded', async () => {
      const user = userEvent.setup();
      render(<RequirementEditorForm {...defaultProps} />);

      // Expand endorsements section
      await user.click(screen.getByText(/Required Endorsements/));

      // Add button should appear
      expect(screen.getByText('Add Endorsement')).toBeInTheDocument();
    });

    it('renders existing endorsements count', () => {
      render(<RequirementEditorForm {...defaultProps} requirement={existingRequirement} />);

      // Check that endorsements section shows count
      const endorsementsHeader = screen.getByText(/Required Endorsements/).closest('button');
      expect(endorsementsHeader).toHaveTextContent('(1)');
    });
  });

  describe('Policy Conditions Management', () => {
    it('renders conditions section header', () => {
      render(<RequirementEditorForm {...defaultProps} />);

      expect(screen.getByText(/Policy Conditions/)).toBeInTheDocument();
    });

    it('shows add condition button when expanded', async () => {
      const user = userEvent.setup();
      render(<RequirementEditorForm {...defaultProps} />);

      await user.click(screen.getByText(/Policy Conditions/));

      expect(screen.getByText('Add Condition')).toBeInTheDocument();
    });

    it('renders existing conditions count', () => {
      render(<RequirementEditorForm {...defaultProps} requirement={existingRequirement} />);

      // Should show (1) for existing conditions in header
      const conditionsSection = screen.getByText(/Policy Conditions/).closest('button');
      expect(conditionsSection).toHaveTextContent('(1)');
    });
  });

  describe('Documentation Requirements Management', () => {
    it('renders documentation section header', () => {
      render(<RequirementEditorForm {...defaultProps} />);

      expect(screen.getByText(/Documentation Requirements/)).toBeInTheDocument();
    });

    it('shows add documentation button when expanded', async () => {
      const user = userEvent.setup();
      render(<RequirementEditorForm {...defaultProps} />);

      await user.click(screen.getByText(/Documentation Requirements/));

      expect(screen.getByText('Add Documentation Requirement')).toBeInTheDocument();
    });

    it('renders existing documentation requirements count', () => {
      render(<RequirementEditorForm {...defaultProps} requirement={existingRequirement} />);

      // Should show (1) for existing docs in header
      const docsSection = screen.getByText(/Documentation Requirements/).closest('button');
      expect(docsSection).toHaveTextContent('(1)');
    });
  });

  describe('Form Submission', () => {
    it('calls createMutation when submitting new requirement', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(<RequirementEditorForm {...defaultProps} onSuccess={onSuccess} />);

      await user.type(screen.getByTestId('input-code'), 'GL-002');
      await user.type(screen.getByTestId('input-name'), 'New GL Requirement');

      await user.click(screen.getByText('Create Requirement'));

      await waitFor(() => {
        expect(mockCreateMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId: 'org-123',
            code: 'GL-002',
            name: 'New GL Requirement',
            type: 'general_liability',
            status: 'draft',
          })
        );
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/admin/compliance/requirements');
      });
    });

    it('calls updateMutation when submitting existing requirement', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(
        <RequirementEditorForm
          {...defaultProps}
          requirement={existingRequirement}
          onSuccess={onSuccess}
        />
      );

      // Change name
      const nameInput = screen.getByTestId('input-name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated GL Requirement');

      // Add change summary
      await user.type(screen.getByTestId('textarea-change-summary'), 'Updated name');

      await user.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(mockUpdateMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId: 'org-123',
            requirementId: 'req-456',
            name: 'Updated GL Requirement',
            change_summary: 'Updated name',
          })
        );
      });
    });

    it('shows error message on submission failure', async () => {
      mockCreateMutate.mockRejectedValue(new Error('Database error'));

      const user = userEvent.setup();
      render(<RequirementEditorForm {...defaultProps} />);

      await user.type(screen.getByTestId('input-code'), 'GL-003');
      await user.type(screen.getByTestId('input-name'), 'Test Requirement');

      await user.click(screen.getByText('Create Requirement'));

      await waitFor(() => {
        expect(screen.getByText('Database error')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Action', () => {
    it('calls onCancel and navigates when clicking cancel', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<RequirementEditorForm {...defaultProps} onCancel={onCancel} />);

      await user.click(screen.getByText('Cancel'));

      expect(onCancel).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/admin/compliance/requirements');
    });
  });

  describe('Field Types', () => {
    it('renders all coverage type options', () => {
      render(<RequirementEditorForm {...defaultProps} />);

      const typeSelect = screen.getByTestId('select-coverage-type');
      expect(typeSelect).toBeInTheDocument();

      // Check options exist
      expect(screen.getByText('General Liability')).toBeInTheDocument();
      expect(screen.getByText('Umbrella Liability')).toBeInTheDocument();
      expect(screen.getByText('Auto Liability')).toBeInTheDocument();
      expect(screen.getByText('Workers Compensation')).toBeInTheDocument();
      expect(screen.getByText('Professional Liability')).toBeInTheDocument();
      expect(screen.getByText('Excess Liability')).toBeInTheDocument();
    });

    it('renders all status options', () => {
      render(<RequirementEditorForm {...defaultProps} />);

      const statusSelect = screen.getByTestId('select-status');
      expect(statusSelect).toBeInTheDocument();

      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Pending Approval')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Deprecated')).toBeInTheDocument();
    });
  });

  describe('Date Fields', () => {
    it('sets default effective date to today', () => {
      render(<RequirementEditorForm {...defaultProps} />);

      const effectiveDate = screen.getByTestId('input-effective-date');
      const today = new Date().toISOString().split('T')[0];
      expect(effectiveDate).toHaveValue(today);
    });

    it('renders existing dates', () => {
      render(<RequirementEditorForm {...defaultProps} requirement={existingRequirement} />);

      expect(screen.getByTestId('input-effective-date')).toHaveValue('2024-01-01');
      expect(screen.getByTestId('input-expiration-date')).toHaveValue('2024-12-31');
    });
  });

  describe('Code Uppercase', () => {
    it('converts code to uppercase', async () => {
      const user = userEvent.setup();
      render(<RequirementEditorForm {...defaultProps} />);

      const codeInput = screen.getByTestId('input-code');
      await user.type(codeInput, 'gl-001');

      expect(codeInput).toHaveValue('GL-001');
    });
  });
});
