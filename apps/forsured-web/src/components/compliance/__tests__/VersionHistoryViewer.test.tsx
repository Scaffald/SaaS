/**
 * VersionHistoryViewer Tests
 * REQ-2, TASK-16: Tests for version history viewer component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VersionHistoryViewer from '../VersionHistoryViewer';

// Mock data
const mockVersions = [
  {
    id: 'ver-3',
    requirement_id: 'req-1',
    version: 3,
    snapshot: { name: 'GL $2M', status: 'active' },
    change_summary: 'Increased limit',
    changed_by: 'user-123',
    changed_at: '2024-03-01T12:00:00Z',
    parent_version_id: 'ver-2',
  },
  {
    id: 'ver-2',
    requirement_id: 'req-1',
    version: 2,
    snapshot: { name: 'GL $1M', status: 'active' },
    change_summary: 'Activated requirement',
    changed_by: 'user-123',
    changed_at: '2024-02-15T10:00:00Z',
    parent_version_id: 'ver-1',
  },
  {
    id: 'ver-1',
    requirement_id: 'req-1',
    version: 1,
    snapshot: { name: 'GL $1M', status: 'draft' },
    change_summary: 'Initial version',
    changed_by: 'user-123',
    changed_at: '2024-02-01T08:00:00Z',
    parent_version_id: null,
  },
];

const mockComparison = {
  from_version: {
    version: 1,
    changed_at: '2024-02-01T08:00:00Z',
    change_summary: 'Initial version',
  },
  to_version: {
    version: 2,
    changed_at: '2024-02-15T10:00:00Z',
    change_summary: 'Activated requirement',
  },
  changes: [
    {
      field: 'status',
      type: 'modified' as const,
      oldValue: 'draft',
      newValue: 'active',
    },
    {
      field: 'name',
      type: 'unchanged' as const,
      oldValue: 'GL $1M',
      newValue: 'GL $1M',
    },
  ],
};

// Mock tRPC hooks
const mockListVersionsQuery = vi.fn();
const mockCompareVersionsQuery = vi.fn();
const mockRestoreMutation = vi.fn();

vi.mock('../../../lib/trpc', () => ({
  trpc: {
    complianceRequirements: {
      listVersions: {
        useQuery: (args: unknown, options: unknown) => mockListVersionsQuery(args, options),
      },
      compareVersions: {
        useQuery: (args: unknown, options: unknown) => mockCompareVersionsQuery(args, options),
      },
      restoreVersion: {
        useMutation: (options: unknown) => mockRestoreMutation(options),
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

describe('VersionHistoryViewer', () => {
  const defaultProps = {
    organizationId: 'org-123',
    requirementId: 'req-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockListVersionsQuery.mockReturnValue({
      data: {
        versions: mockVersions,
        pagination: {
          page: 1,
          pageSize: 10,
          total: 3,
          totalPages: 1,
        },
      },
      isLoading: false,
      error: null,
    });

    mockCompareVersionsQuery.mockReturnValue({
      data: mockComparison,
      isLoading: false,
    });

    mockRestoreMutation.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isLoading: false,
    });
  });

  describe('Loading State', () => {
    it('renders loading spinner when fetching versions', () => {
      mockListVersionsQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<VersionHistoryViewer {...defaultProps} />);

      const loadingElement = document.querySelector('.animate-spin');
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error message when query fails', () => {
      mockListVersionsQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Failed to fetch versions' },
      });

      render(<VersionHistoryViewer {...defaultProps} />);

      expect(screen.getByText('Failed to load version history')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch versions')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty message when no versions', () => {
      mockListVersionsQuery.mockReturnValue({
        data: {
          versions: [],
          pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        },
        isLoading: false,
        error: null,
      });

      render(<VersionHistoryViewer {...defaultProps} />);

      expect(screen.getByText('No version history available')).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('renders version history header', () => {
      render(<VersionHistoryViewer {...defaultProps} />);

      expect(screen.getByText('Version History')).toBeInTheDocument();
      expect(screen.getByText('(3 versions)')).toBeInTheDocument();
    });

    it('renders all version entries', () => {
      render(<VersionHistoryViewer {...defaultProps} />);

      expect(screen.getByText('Version 3')).toBeInTheDocument();
      expect(screen.getByText('Version 2')).toBeInTheDocument();
      expect(screen.getByText('Version 1')).toBeInTheDocument();
    });

    it('renders version change summaries', () => {
      render(<VersionHistoryViewer {...defaultProps} />);

      expect(screen.getByText('Increased limit')).toBeInTheDocument();
      expect(screen.getByText('Activated requirement')).toBeInTheDocument();
      expect(screen.getByText('Initial version')).toBeInTheDocument();
    });

    it('shows Initial badge for version 1', () => {
      render(<VersionHistoryViewer {...defaultProps} />);

      expect(screen.getByText('Initial')).toBeInTheDocument();
    });

    it('renders compare button', () => {
      render(<VersionHistoryViewer {...defaultProps} />);

      expect(screen.getByText('Compare')).toBeInTheDocument();
    });
  });

  describe('Compare Mode', () => {
    it('enters compare mode when clicking Compare button', async () => {
      const user = userEvent.setup();
      render(<VersionHistoryViewer {...defaultProps} />);

      await user.click(screen.getByText('Compare'));

      expect(screen.getByText('Exit Compare')).toBeInTheDocument();
      expect(screen.getByText(/Select a "From" and "To" version/)).toBeInTheDocument();
    });

    it('shows From/To selection buttons in compare mode', async () => {
      const user = userEvent.setup();
      render(<VersionHistoryViewer {...defaultProps} />);

      await user.click(screen.getByText('Compare'));

      // Should have From/To buttons for each version
      const fromButtons = screen.getAllByText('From');
      const toButtons = screen.getAllByText('To');

      expect(fromButtons.length).toBe(3);
      expect(toButtons.length).toBe(3);
    });

    it('exits compare mode and clears selections', async () => {
      const user = userEvent.setup();
      render(<VersionHistoryViewer {...defaultProps} />);

      // Enter compare mode
      await user.click(screen.getByText('Compare'));
      expect(screen.getByText('Exit Compare')).toBeInTheDocument();

      // Exit compare mode
      await user.click(screen.getByText('Exit Compare'));
      expect(screen.getByText('Compare')).toBeInTheDocument();
      expect(screen.queryByText(/Select a "From" and "To" version/)).not.toBeInTheDocument();
    });
  });

  describe('Version Selection', () => {
    it('calls compareVersions query when both versions selected', async () => {
      const user = userEvent.setup();
      render(<VersionHistoryViewer {...defaultProps} />);

      // Enter compare mode
      await user.click(screen.getByText('Compare'));

      // Select "From" version 1
      const fromButtons = screen.getAllByText('From');
      await user.click(fromButtons[2]); // Version 1

      // Select "To" version 2
      const toButtons = screen.getAllByText('To');
      await user.click(toButtons[1]); // Version 2

      await waitFor(() => {
        expect(mockCompareVersionsQuery).toHaveBeenCalled();
      });
    });
  });

  describe('Diff View', () => {
    it('shows diff view when comparison is loaded', async () => {
      const user = userEvent.setup();
      render(<VersionHistoryViewer {...defaultProps} />);

      // Enter compare mode
      await user.click(screen.getByText('Compare'));

      // Select versions
      const fromButtons = screen.getAllByText('From');
      await user.click(fromButtons[2]);

      const toButtons = screen.getAllByText('To');
      await user.click(toButtons[1]);

      // Diff view should appear
      await waitFor(() => {
        expect(screen.getByText(/Version 1 → Version 2/)).toBeInTheDocument();
      });
    });

    it('shows change statistics in diff view', async () => {
      const user = userEvent.setup();
      render(<VersionHistoryViewer {...defaultProps} />);

      await user.click(screen.getByText('Compare'));

      const fromButtons = screen.getAllByText('From');
      await user.click(fromButtons[2]);

      const toButtons = screen.getAllByText('To');
      await user.click(toButtons[1]);

      await waitFor(() => {
        // 1 modified field
        expect(screen.getByText('1 modified')).toBeInTheDocument();
      });
    });

    it('shows field names in diff view', async () => {
      const user = userEvent.setup();
      render(<VersionHistoryViewer {...defaultProps} />);

      await user.click(screen.getByText('Compare'));

      const fromButtons = screen.getAllByText('From');
      await user.click(fromButtons[2]);

      const toButtons = screen.getAllByText('To');
      await user.click(toButtons[1]);

      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
      });
    });
  });

  describe('Restore Functionality', () => {
    it('renders restore button for versions > 1', () => {
      render(<VersionHistoryViewer {...defaultProps} />);

      // Should have restore buttons for version 2 and 3 (not version 1)
      const restoreButtons = screen.getAllByTitle('Restore this version');
      expect(restoreButtons.length).toBe(2);
    });

    it('calls restore mutation when clicking restore', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      const mockOnRestore = vi.fn();

      mockRestoreMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      });

      // Mock window.confirm
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const user = userEvent.setup();
      render(<VersionHistoryViewer {...defaultProps} onRestore={mockOnRestore} />);

      const restoreButtons = screen.getAllByTitle('Restore this version');
      await user.click(restoreButtons[0]);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      vi.restoreAllMocks();
    });

    it('does not call restore when confirm is cancelled', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});

      mockRestoreMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      });

      // Mock window.confirm to return false
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      const user = userEvent.setup();
      render(<VersionHistoryViewer {...defaultProps} />);

      const restoreButtons = screen.getAllByTitle('Restore this version');
      await user.click(restoreButtons[0]);

      expect(mockMutateAsync).not.toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });

  describe('Pagination', () => {
    it('renders pagination when multiple pages exist', () => {
      mockListVersionsQuery.mockReturnValue({
        data: {
          versions: mockVersions,
          pagination: {
            page: 1,
            pageSize: 10,
            total: 25,
            totalPages: 3,
          },
        },
        isLoading: false,
        error: null,
      });

      render(<VersionHistoryViewer {...defaultProps} />);

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('disables Previous button on first page', () => {
      mockListVersionsQuery.mockReturnValue({
        data: {
          versions: mockVersions,
          pagination: {
            page: 1,
            pageSize: 10,
            total: 25,
            totalPages: 3,
          },
        },
        isLoading: false,
        error: null,
      });

      render(<VersionHistoryViewer {...defaultProps} />);

      const prevButton = screen.getByText('Previous');
      expect(prevButton).toBeDisabled();
    });

    it('does not render pagination for single page', () => {
      render(<VersionHistoryViewer {...defaultProps} />);

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  describe('Query Parameters', () => {
    it('passes correct parameters to listVersions query', () => {
      render(<VersionHistoryViewer {...defaultProps} />);

      expect(mockListVersionsQuery).toHaveBeenCalledWith(
        {
          organizationId: 'org-123',
          requirementId: 'req-1',
          page: 1,
          pageSize: 10,
        },
        expect.objectContaining({
          enabled: true,
        })
      );
    });

    it('disables query when organizationId is missing', () => {
      render(
        <VersionHistoryViewer
          organizationId=""
          requirementId="req-1"
        />
      );

      expect(mockListVersionsQuery).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });
});
