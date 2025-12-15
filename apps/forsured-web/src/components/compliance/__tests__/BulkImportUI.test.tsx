/**
 * BulkImportUI Tests
 * REQ-2, TASK-17: Tests for bulk import UI component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkImportUI from '../BulkImportUI';

// Mock data
const mockTemplates = [
  {
    format: 'csv' as const,
    template: 'code,name,type,status\nREQ-001,Test Requirement,general_liability,draft',
    filename: 'compliance-requirements-template.csv',
  },
  {
    format: 'json' as const,
    template: JSON.stringify([{ code: 'REQ-001', name: 'Test', type: 'general_liability' }]),
    filename: 'compliance-requirements-template.json',
  },
];

const mockPreviewData = {
  totalRows: 3,
  validRows: 2,
  invalidRows: 1,
  warningRows: 1,
  duplicateCodes: ['REQ-001'],
  canProceed: true,
  rows: [
    {
      rowIndex: 0,
      isValid: true,
      errors: [],
      warnings: [],
      data: { code: 'REQ-002', name: 'Valid Requirement' },
      normalizedData: { code: 'REQ-002', name: 'Valid Requirement', type: 'general_liability' },
    },
    {
      rowIndex: 1,
      isValid: true,
      errors: [],
      warnings: [{ field: 'status', message: 'Status defaulted to draft', code: 'default_status' }],
      data: { code: 'REQ-003', name: 'With Warning' },
      normalizedData: { code: 'REQ-003', name: 'With Warning', type: 'auto_liability' },
    },
    {
      rowIndex: 2,
      isValid: false,
      errors: [{ field: 'name', message: 'Name is required', code: 'required' }],
      warnings: [],
      data: { code: 'REQ-004' },
      normalizedData: null,
    },
  ],
};

const mockImportResult = {
  success: true,
  totalAttempted: 3,
  successfulImports: 2,
  failedImports: 1,
  createdIds: ['id-1', 'id-2'],
  errors: [
    { rowIndex: 2, code: 'REQ-004', message: 'Name is required' },
  ],
};

// Mock tRPC hooks
const mockTemplatesQuery = vi.fn();
const mockPreviewQuery = vi.fn();
const mockImportMutation = vi.fn();

vi.mock('../../../lib/trpc', () => ({
  trpc: {
    bulkOperations: {
      importTemplates: {
        useQuery: (args: unknown, options: unknown) => mockTemplatesQuery(args, options),
      },
      importPreview: {
        useQuery: (args: unknown, options: unknown) => mockPreviewQuery(args, options),
      },
      importExecute: {
        useMutation: (options: unknown) => mockImportMutation(options),
      },
    },
  },
}));

// Mock Button component
vi.mock('../../Common/Button', () => ({
  default: ({ children, onClick, variant, size, disabled, title }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
    disabled?: boolean;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  ),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
URL.createObjectURL = mockCreateObjectURL;
URL.revokeObjectURL = mockRevokeObjectURL;

describe('BulkImportUI', () => {
  const defaultProps = {
    organizationId: 'org-123',
  };

  let mockMutateAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockMutateAsync = vi.fn().mockResolvedValue(mockImportResult);

    // Default mock implementations
    mockTemplatesQuery.mockReturnValue({
      data: mockTemplates,
      isLoading: false,
    });

    mockPreviewQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      refetch: vi.fn().mockResolvedValue({ data: mockPreviewData }),
    });

    mockImportMutation.mockImplementation((options: { onSuccess?: (data: unknown) => void }) => ({
      mutate: vi.fn((input) => {
        // Simulate async mutation
        setTimeout(() => {
          options?.onSuccess?.(mockImportResult);
        }, 0);
      }),
      isPending: false,
    }));
  });

  describe('Upload Step', () => {
    it('renders upload step initially', () => {
      render(<BulkImportUI {...defaultProps} />);

      expect(screen.getByText('Bulk Import Requirements')).toBeInTheDocument();
      expect(screen.getByText('Download Templates')).toBeInTheDocument();
      expect(screen.getByText('Upload File')).toBeInTheDocument();
      expect(screen.getByText('Validate & Preview')).toBeInTheDocument();
    });

    it('renders template download buttons', () => {
      render(<BulkImportUI {...defaultProps} />);

      expect(screen.getByText(/CSV Template/)).toBeInTheDocument();
      expect(screen.getByText(/JSON Template/)).toBeInTheDocument();
    });

    it('renders format selector', () => {
      render(<BulkImportUI {...defaultProps} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Auto-detect format')).toBeInTheDocument();
    });

    it('renders skip duplicates checkbox', () => {
      render(<BulkImportUI {...defaultProps} />);

      const checkbox = screen.getByLabelText(/Skip duplicate requirement codes/i);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });

    it('renders step indicator with upload as active', () => {
      render(<BulkImportUI {...defaultProps} />);

      // Check step indicator is present
      expect(screen.getByText('upload')).toBeInTheDocument();
      expect(screen.getByText('preview')).toBeInTheDocument();
      expect(screen.getByText('result')).toBeInTheDocument();
    });

    it('disables preview button when no data entered', () => {
      render(<BulkImportUI {...defaultProps} />);

      const previewButton = screen.getByText('Validate & Preview');
      expect(previewButton).toBeDisabled();
    });

    it('enables preview button when data is entered', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'some data');

      const previewButton = screen.getByText('Validate & Preview');
      expect(previewButton).not.toBeDisabled();
    });
  });

  describe('File Upload', () => {
    it('handles file upload', async () => {
      render(<BulkImportUI {...defaultProps} />);

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });

      // Create a FileReader mock
      const originalFileReader = window.FileReader;
      const mockReadAsText = vi.fn();
      const mockFileReader = {
        readAsText: mockReadAsText,
        onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
        result: 'test,data',
      };

      // @ts-expect-error - mocking FileReader
      window.FileReader = vi.fn(() => mockFileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Simulate file read completion
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'test,data' } } as unknown as ProgressEvent<FileReader>);
      }

      expect(mockReadAsText).toHaveBeenCalledWith(file);

      // Restore original FileReader
      window.FileReader = originalFileReader;
    });
  });

  describe('Template Download', () => {
    it('downloads CSV template when clicked', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      // Verify the template download buttons are present and enabled
      const csvButton = screen.getByText(/CSV Template/);
      expect(csvButton).toBeInTheDocument();
      expect(csvButton).not.toBeDisabled();

      // Click the button
      await user.click(csvButton);

      // Verify createObjectURL and revokeObjectURL were called
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('downloads JSON template when clicked', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      // Verify the template download buttons are present and enabled
      const jsonButton = screen.getByText(/JSON Template/);
      expect(jsonButton).toBeInTheDocument();
      expect(jsonButton).not.toBeDisabled();

      // Click the button
      await user.click(jsonButton);

      // Verify createObjectURL was called
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('disables template buttons when no templates loaded', () => {
      mockTemplatesQuery.mockReturnValue({
        data: null,
        isLoading: false,
      });

      render(<BulkImportUI {...defaultProps} />);

      const csvButton = screen.getByText(/CSV Template/);
      const jsonButton = screen.getByText(/JSON Template/);

      expect(csvButton).toBeDisabled();
      expect(jsonButton).toBeDisabled();
    });
  });

  describe('Preview Step', () => {
    it('shows preview after validation', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      // Enter data and click preview
      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        expect(screen.getByText('Total Rows')).toBeInTheDocument();
      });
    });

    it('displays row counts in preview', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        // Check stat labels exist - the numbers appear in multiple places
        expect(screen.getByText('Total Rows')).toBeInTheDocument();
        expect(screen.getByText('Valid')).toBeInTheDocument();
        expect(screen.getByText('Invalid')).toBeInTheDocument();
        expect(screen.getByText('Warnings')).toBeInTheDocument();
      });
    });

    it('shows duplicate codes warning', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        expect(screen.getByText('Duplicate Codes Found')).toBeInTheDocument();
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });
    });

    it('shows row details with expand/collapse', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        expect(screen.getByText('Row 1')).toBeInTheDocument();
        expect(screen.getByText('Row 2')).toBeInTheDocument();
        expect(screen.getByText('Row 3')).toBeInTheDocument();
      });

      // Expand a row with errors
      await user.click(screen.getByText('Row 3'));

      await waitFor(() => {
        expect(screen.getByText(/Name is required/)).toBeInTheDocument();
      });
    });

    it('shows valid badge for valid rows', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        expect(screen.getByText('✓ Valid')).toBeInTheDocument();
      });
    });

    it('shows warning badge for rows with warnings', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        // Look for warning badge text
        expect(screen.getByText(/warning\(s\)/)).toBeInTheDocument();
      });
    });

    it('shows error badge for invalid rows', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        // Look for error badge text
        expect(screen.getByText(/error\(s\)/)).toBeInTheDocument();
      });
    });

    it('enables import button when canProceed is true', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        const importButton = screen.getByText(/Import 2 Requirements/);
        expect(importButton).not.toBeDisabled();
      });
    });

    it('disables import button when canProceed is false', async () => {
      const user = userEvent.setup();

      // Mock with canProceed = false
      mockPreviewQuery.mockReturnValue({
        data: null,
        isLoading: false,
        isFetching: false,
        refetch: vi.fn().mockResolvedValue({
          data: { ...mockPreviewData, canProceed: false },
        }),
      });

      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        const importButton = screen.getByText(/Import 2 Requirements/);
        expect(importButton).toBeDisabled();
      });
    });

    it('shows cannot proceed warning when validation fails', async () => {
      const user = userEvent.setup();

      mockPreviewQuery.mockReturnValue({
        data: null,
        isLoading: false,
        isFetching: false,
        refetch: vi.fn().mockResolvedValue({
          data: { ...mockPreviewData, canProceed: false },
        }),
      });

      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        expect(screen.getByText(/Cannot proceed with import/)).toBeInTheDocument();
      });
    });

    it('goes back to upload when clicking Back button', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        expect(screen.getByText('← Back to Upload')).toBeInTheDocument();
      });

      await user.click(screen.getByText('← Back to Upload'));

      expect(screen.getByText('Upload File')).toBeInTheDocument();
    });
  });

  describe('Import Execution', () => {
    it('calls import mutation when clicking Import button', async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn();

      render(<BulkImportUI {...defaultProps} onImportComplete={onImportComplete} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        expect(screen.getByText(/Import 2 Requirements/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Import 2 Requirements/));

      await waitFor(() => {
        expect(mockImportMutation).toHaveBeenCalled();
      });
    });
  });

  describe('Result Step', () => {
    it('shows success message on successful import', async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn();

      render(<BulkImportUI {...defaultProps} onImportComplete={onImportComplete} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        expect(screen.getByText(/Import 2 Requirements/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Import 2 Requirements/));

      await waitFor(() => {
        expect(screen.getByText('Import Successful!')).toBeInTheDocument();
      });
    });

    it('shows partial success message when some imports fail', async () => {
      const user = userEvent.setup();

      mockImportMutation.mockImplementation((options: { onSuccess?: (data: unknown) => void }) => ({
        mutate: vi.fn(() => {
          setTimeout(() => {
            options?.onSuccess?.({ ...mockImportResult, success: false });
          }, 0);
        }),
        isPending: false,
      }));

      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        expect(screen.getByText(/Import 2 Requirements/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Import 2 Requirements/));

      await waitFor(() => {
        expect(screen.getByText('Import Partially Complete')).toBeInTheDocument();
      });
    });

    it('displays import statistics', async () => {
      const user = userEvent.setup();

      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        expect(screen.getByText(/Import 2 Requirements/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Import 2 Requirements/));

      await waitFor(() => {
        expect(screen.getByText('Attempted')).toBeInTheDocument();
        expect(screen.getByText('Succeeded')).toBeInTheDocument();
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });
    });

    it('shows error list when there are import errors', async () => {
      const user = userEvent.setup();

      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        expect(screen.getByText(/Import 2 Requirements/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Import 2 Requirements/));

      await waitFor(() => {
        expect(screen.getByText('Import Errors')).toBeInTheDocument();
        expect(screen.getByText(/REQ-004/)).toBeInTheDocument();
      });
    });

    it('allows importing more after completion', async () => {
      const user = userEvent.setup();

      render(<BulkImportUI {...defaultProps} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        expect(screen.getByText(/Import 2 Requirements/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Import 2 Requirements/));

      await waitFor(() => {
        expect(screen.getByText('Import More')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Import More'));

      expect(screen.getByText('Upload File')).toBeInTheDocument();
    });

    it('calls onImportComplete callback on success', async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn();

      render(<BulkImportUI {...defaultProps} onImportComplete={onImportComplete} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        expect(screen.getByText(/Import 2 Requirements/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Import 2 Requirements/));

      await waitFor(() => {
        expect(onImportComplete).toHaveBeenCalledWith(['id-1', 'id-2']);
      });
    });
  });

  describe('Cancel/Close', () => {
    it('renders cancel button when onClose is provided', () => {
      const onClose = vi.fn();
      render(<BulkImportUI {...defaultProps} onClose={onClose} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<BulkImportUI {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText('Cancel'));

      expect(onClose).toHaveBeenCalled();
    });

    it('renders Done button in result step when onClose is provided', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<BulkImportUI {...defaultProps} onClose={onClose} />);

      const textarea = screen.getByTestId('import-data-textarea');
      await user.type(textarea, 'code,name\nREQ-001,Test');
      await user.click(screen.getByText('Validate & Preview'));

      await waitFor(() => {
        expect(screen.getByText(/Import 2 Requirements/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Import 2 Requirements/));

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Done'));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Format Selection', () => {
    it('allows selecting CSV format', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'csv');

      expect(select).toHaveValue('csv');
    });

    it('allows selecting JSON format', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'json');

      expect(select).toHaveValue('json');
    });
  });

  describe('Skip Duplicates Option', () => {
    it('toggles skip duplicates checkbox', async () => {
      const user = userEvent.setup();
      render(<BulkImportUI {...defaultProps} />);

      const checkbox = screen.getByLabelText(/Skip duplicate requirement codes/i);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });
});
