/**
 * Org-Level vs Project-Level Coverage Distinction
 * TASK-4: Build Project-Level Coverage Requirements UI
 *
 * Tests for ProjectCoverageRequirementsPage component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import ProjectCoverageRequirementsPage from '../ProjectCoverageRequirementsPage';
import * as coverageService from '../../../lib/coverageRequirements/coverageLimitRequirementService';
import { CoverageLimitRequirement } from '../../../types';

// Mock the coverage service
vi.mock('../../../lib/coverageRequirements/coverageLimitRequirementService', async () => {
  const actual = await vi.importActual(
    '../../../lib/coverageRequirements/coverageLimitRequirementService'
  );
  return {
    ...actual,
    getProjectLevelRequirements: vi.fn(),
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

const mockProjectRequirements: CoverageLimitRequirement[] = [
  {
    id: 'req-p1',
    name: 'Project-Specific GL Coverage',
    level: 'project',
    organization_id: 'org-1',
    project_id: 'proj-1',
    coverage_type: 'general_liability',
    minimum_limit: 2000000,
    required: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockOrgRequirements: CoverageLimitRequirement[] = [
  {
    id: 'req-o1',
    name: 'Org GL Coverage',
    level: 'org',
    organization_id: 'org-1',
    project_id: null,
    coverage_type: 'general_liability',
    minimum_limit: 1000000,
    required: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const defaultProps = {
  projectId: 'proj-1',
  projectName: 'Test Project',
  organizationId: 'org-1',
};

describe('ProjectCoverageRequirementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(coverageService.getProjectLevelRequirements).mockResolvedValue({
      success: true,
      data: mockProjectRequirements,
      statusCode: 200,
    });
    vi.mocked(coverageService.getOrgLevelRequirements).mockResolvedValue({
      success: true,
      data: mockOrgRequirements,
      statusCode: 200,
    });
  });

  describe('Rendering', () => {
    it('should render page title and PROJECT badge', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Coverage Requirements')).toBeInTheDocument();
        expect(screen.getByText('PROJECT')).toBeInTheDocument();
      });
    });

    it('should display project name in subtitle', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
    });

    it('should render info banner about project-level requirements', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Project-Level Requirements')).toBeInTheDocument();
        expect(
          screen.getByText(/These requirements are specific to this project/)
        ).toBeInTheDocument();
      });
    });

    it('should render Add Project Requirement button', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Add Project Requirement/i })
        ).toBeInTheDocument();
      });
    });

    it('should show access denied for unauthorized users', () => {
      render(
        <ProjectCoverageRequirementsPage
          {...defaultProps}
          currentUser={{ id: 'user-1', role: 'subcontractor' }}
        />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Requirements Tables', () => {
    it('should display project-specific requirements', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Project-Specific GL Coverage')).toBeInTheDocument();
        expect(screen.getByText('$2,000,000')).toBeInTheDocument();
      });
    });

    it('should display inherited org requirements', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Org GL Coverage')).toBeInTheDocument();
        expect(screen.getByText('$1,000,000')).toBeInTheDocument();
      });
    });

    it('should show PROJECT badge for project requirements', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        // There should be PROJECT badges in header and table rows
        const projectBadges = screen.getAllByText('PROJECT');
        expect(projectBadges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should show ORG badge for inherited org requirements', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        const orgBadges = screen.getAllByText('ORG');
        expect(orgBadges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should show empty state when no project requirements exist', async () => {
      vi.mocked(coverageService.getProjectLevelRequirements).mockResolvedValue({
        success: true,
        data: [],
        statusCode: 200,
      });

      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/No project-specific requirements/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Inherited Org Requirements Section', () => {
    it('should show collapsible header for org requirements', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Inherited Organization Requirements')
        ).toBeInTheDocument();
      });
    });

    it('should display count of inherited org requirements', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        // Should show the org requirement in the inherited section
        expect(screen.getByText('Org GL Coverage')).toBeInTheDocument();
      });
    });

    it('should show org requirements are read-only', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/read-only/)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    it('should filter project requirements by search query', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Project-Specific GL Coverage')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search requirements...');
      fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });

      await waitFor(() => {
        expect(
          screen.getByText(/No project requirements match your search/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Summary Card', () => {
    it('should display total requirement counts', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        // Should show summary with project and org counts
        expect(screen.getByText(/Total requirements for this project/)).toBeInTheDocument();
        expect(screen.getByText(/project \+ .* org/)).toBeInTheDocument();
      });
    });
  });

  describe('Create Requirement', () => {
    it('should open create modal when Add Project Requirement is clicked', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Coverage Requirements')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Project Requirement/i }));

      // Modal should open and show the form input
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('e.g., Minimum General Liability Coverage')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create Requirement/i })).toBeInTheDocument();
      });
    });

    it('should call create service with project level', async () => {
      vi.mocked(coverageService.createCoverageLimitRequirement).mockResolvedValue({
        success: true,
        data: mockProjectRequirements[0],
        statusCode: 201,
      });

      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Coverage Requirements')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Project Requirement/i }));

      // Wait for form to appear
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('e.g., Minimum General Liability Coverage')
        ).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByPlaceholderText('e.g., Minimum General Liability Coverage');
      fireEvent.change(nameInput, { target: { value: 'x' } });
      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.change(nameInput, { target: { value: 'New Requirement' } });

      fireEvent.click(screen.getByRole('button', { name: /Create Requirement/i }));

      await waitFor(() => {
        expect(coverageService.createCoverageLimitRequirement).toHaveBeenCalledWith(
          expect.objectContaining({
            level: 'project',
            project_id: 'proj-1',
            name: 'New Requirement',
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('Edit Requirement', () => {
    it('should only allow editing project-level requirements', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Project-Specific GL Coverage')).toBeInTheDocument();
      });

      // Project requirements should have edit buttons
      const editButtons = screen.getAllByTitle('Edit');
      expect(editButtons.length).toBe(1); // Only 1 project requirement

      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Project Requirement')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Requirement', () => {
    it('should open delete confirmation for project requirements', async () => {
      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Project-Specific GL Coverage')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Project Requirement')).toBeInTheDocument();
      });
    });

    it('should call delete service when confirmed', async () => {
      vi.mocked(coverageService.deleteCoverageLimitRequirement).mockResolvedValue({
        success: true,
        statusCode: 200,
      });

      render(<ProjectCoverageRequirementsPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Project-Specific GL Coverage')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Project Requirement')).toBeInTheDocument();
      });

      const allDeleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      const modalDeleteButton = allDeleteButtons[allDeleteButtons.length - 1];
      fireEvent.click(modalDeleteButton);

      await waitFor(() => {
        expect(coverageService.deleteCoverageLimitRequirement).toHaveBeenCalledWith(
          'req-p1',
          expect.any(Object)
        );
      });
    });
  });

  describe('Access Control', () => {
    it('should allow admin users to access', async () => {
      render(
        <ProjectCoverageRequirementsPage
          {...defaultProps}
          currentUser={{ id: 'admin-1', role: 'admin' }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Coverage Requirements')).toBeInTheDocument();
      });
    });

    it('should allow project managers with access to this project', async () => {
      render(
        <ProjectCoverageRequirementsPage
          {...defaultProps}
          currentUser={{
            id: 'pm-1',
            role: 'project_manager',
            project_ids: ['proj-1'],
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Coverage Requirements')).toBeInTheDocument();
      });
    });

    it('should deny project managers without access to this project', () => {
      render(
        <ProjectCoverageRequirementsPage
          {...defaultProps}
          currentUser={{
            id: 'pm-1',
            role: 'project_manager',
            project_ids: ['other-project'],
          }}
        />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should allow GCs with access to this project', async () => {
      render(
        <ProjectCoverageRequirementsPage
          {...defaultProps}
          currentUser={{
            id: 'gc-1',
            role: 'gc',
            project_ids: ['proj-1'],
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Coverage Requirements')).toBeInTheDocument();
      });
    });
  });
});
