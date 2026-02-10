/**
 * Org-Level vs Project-Level Coverage Distinction
 * TASK-3: Build Org Coverage Requirements Settings UI
 *
 * Tests for OrgCoverageRequirementsPage component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@/test/test-utils';
import OrgCoverageRequirementsPage from '../OrgCoverageRequirementsPage';
import * as coverageService from '../../../lib/coverageRequirements/coverageLimitRequirementService';
import { CoverageLimitRequirement } from '../../../types';

// Mock the coverage service
vi.mock('../../../lib/coverageRequirements/coverageLimitRequirementService', async () => {
  const actual = await vi.importActual(
    '../../../lib/coverageRequirements/coverageLimitRequirementService'
  );
  return {
    ...actual,
    getOrgLevelRequirements: vi.fn(),
    createCoverageLimitRequirement: vi.fn(),
    updateCoverageLimitRequirement: vi.fn(),
    deleteCoverageLimitRequirement: vi.fn(),
  };
});

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substring(7),
  },
});

const mockRequirements: CoverageLimitRequirement[] = [
  {
    id: 'req-1',
    name: 'Minimum GL Coverage',
    level: 'org',
    organization_id: 'org-1',
    project_id: null,
    coverage_type: 'general_liability',
    minimum_limit: 1000000,
    required: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'req-2',
    name: 'Workers Comp Requirement',
    level: 'org',
    organization_id: 'org-1',
    project_id: null,
    coverage_type: 'workers_comp',
    minimum_limit: 500000,
    required: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

describe('OrgCoverageRequirementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(coverageService.getOrgLevelRequirements).mockResolvedValue({
      success: true,
      data: mockRequirements,
      statusCode: 200,
    });
  });

  describe('Rendering', () => {
    it('should render page title and ORG LEVEL badge', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(screen.getByText('Coverage Requirements')).toBeInTheDocument();
        expect(screen.getByText('ORG LEVEL')).toBeInTheDocument();
      });
    });

    it('should render info banner about org-level requirements', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Organization-Level Requirements')
        ).toBeInTheDocument();
        expect(
          screen.getByText(/These requirements apply to all projects/)
        ).toBeInTheDocument();
      });
    });

    it('should render Add Requirement button for admin users', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Add Requirement/i })
        ).toBeInTheDocument();
      });
    });

    it('should show admin access required message for non-admin users', async () => {
      render(
        <OrgCoverageRequirementsPage
          currentUser={{ id: 'user-1', role: 'broker' }}
        />
      );

      expect(screen.getByText('Admin Access Required')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Only administrators can manage organization-level coverage requirements/
        )
      ).toBeInTheDocument();
    });
  });

  describe('Requirements Table', () => {
    it('should display requirements in table', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(screen.getByText('Minimum GL Coverage')).toBeInTheDocument();
        expect(screen.getByText('Workers Comp Requirement')).toBeInTheDocument();
      });
    });

    it('should display coverage type labels', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(screen.getByText('General Liability')).toBeInTheDocument();
        expect(screen.getByText("Workers' Compensation")).toBeInTheDocument();
      });
    });

    it('should display formatted minimum limits', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(screen.getByText('$1,000,000')).toBeInTheDocument();
        expect(screen.getByText('$500,000')).toBeInTheDocument();
      });
    });

    it('should display ORG badge for each requirement', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        const orgBadges = screen.getAllByText('ORG');
        // One in header + 2 in table rows
        expect(orgBadges.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should display Required/Optional status badges', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(screen.getByText('Required')).toBeInTheDocument();
        expect(screen.getByText('Optional')).toBeInTheDocument();
      });
    });

    it('should show empty state when no requirements exist', async () => {
      vi.mocked(coverageService.getOrgLevelRequirements).mockResolvedValue({
        success: true,
        data: [],
        statusCode: 200,
      });

      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/No coverage requirements found/)
        ).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      // Make the promise hang to show loading state
      vi.mocked(coverageService.getOrgLevelRequirements).mockImplementation(
        () => new Promise(() => {})
      );

      render(<OrgCoverageRequirementsPage />);

      expect(
        screen.getByText('Loading coverage requirements...')
      ).toBeInTheDocument();
    });
  });

  describe('Search and Filter', () => {
    it('should filter requirements by search query', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(screen.getByText('Minimum GL Coverage')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search requirements...');
      fireEvent.change(searchInput, { target: { value: 'Workers' } });

      expect(screen.queryByText('Minimum GL Coverage')).not.toBeInTheDocument();
      expect(screen.getByText('Workers Comp Requirement')).toBeInTheDocument();
    });

    it('should show no results message when search finds nothing', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(screen.getByText('Minimum GL Coverage')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search requirements...');
      fireEvent.change(searchInput, { target: { value: 'xyz123' } });

      expect(
        screen.getByText('No requirements match your search')
      ).toBeInTheDocument();
    });
  });

  describe('Summary Card', () => {
    it('should display requirement counts', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Showing 2 org-level requirements/)
        ).toBeInTheDocument();
        expect(screen.getByText('Required:')).toBeInTheDocument();
        expect(screen.getByText('Optional:')).toBeInTheDocument();
      });
    });
  });

  describe('Create Requirement', () => {
    it('should open create modal when Add Requirement is clicked', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(screen.getByText('Coverage Requirements')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Requirement/i }));

      await waitFor(() => {
        expect(screen.getByText('Add Coverage Requirement')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Requirement', () => {
    it('should open edit modal when edit button is clicked', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(screen.getByText('Minimum GL Coverage')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Coverage Requirement')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Requirement', () => {
    it('should open delete confirmation modal when delete button is clicked', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(screen.getByText('Minimum GL Coverage')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Coverage Requirement')).toBeInTheDocument();
        expect(
          screen.getByText(/Are you sure you want to delete/)
        ).toBeInTheDocument();
      });
    });

    it('should close delete modal when Cancel is clicked', async () => {
      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(screen.getByText('Minimum GL Coverage')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Coverage Requirement')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(
          screen.queryByText('Delete Coverage Requirement')
        ).not.toBeInTheDocument();
      });
    });

    it('should call delete service when Delete is confirmed', async () => {
      vi.mocked(coverageService.deleteCoverageLimitRequirement).mockResolvedValue({
        success: true,
        statusCode: 200,
      });

      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(screen.getByText('Minimum GL Coverage')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Coverage Requirement')).toBeInTheDocument();
      });

      // Find the Delete button in the confirmation modal (the one with danger variant styling)
      // It's the last button with name "Delete" in the DOM when modal is open
      const allDeleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      const modalDeleteButton = allDeleteButtons[allDeleteButtons.length - 1];
      fireEvent.click(modalDeleteButton);

      await waitFor(() => {
        expect(
          coverageService.deleteCoverageLimitRequirement
        ).toHaveBeenCalledWith('req-1', expect.any(Object));
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast when fetch fails', async () => {
      vi.mocked(coverageService.getOrgLevelRequirements).mockResolvedValue({
        success: false,
        error: 'Network error',
        statusCode: 500,
      });

      render(<OrgCoverageRequirementsPage />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });
});
