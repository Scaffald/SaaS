/**
 * ParticipantsComplianceView Component Tests
 * REQ-281: Participants Tab Compliance View - TASK-4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ParticipantsComplianceView } from '../ParticipantsComplianceView';

// Mock tRPC
const mockListByProject = vi.fn();
const mockGetComplianceSummary = vi.fn();

vi.mock('../../../lib/trpc', () => ({
  trpc: {
    participants: {
      listByProject: {
        useQuery: (input: unknown, options: { enabled: boolean }) => {
          if (!options.enabled) {
            return { data: undefined, isLoading: false };
          }
          return mockListByProject(input);
        },
      },
      getComplianceSummary: {
        useQuery: (input: unknown, options: { enabled: boolean }) => {
          if (!options.enabled) {
            return { data: undefined };
          }
          return mockGetComplianceSummary(input);
        },
      },
    },
  },
}));

// Mock compliance components
vi.mock('@unicornlove/compliance', () => ({
  ParticipantsTable: ({ participants, onRowClick }: { participants: unknown[]; onRowClick: (p: unknown) => void }) => (
    <div data-testid="participants-table">
      {(participants as Array<{ id: string; name: string }>).map((p) => (
        <div
          key={p.id}
          data-testid={`participant-row-${p.id}`}
          onClick={() => onRowClick(p)}
        >
          {p.name}
        </div>
      ))}
    </div>
  ),
  ParticipantsFilter: ({
    activeFilter,
    onFilterChange,
    counts,
  }: {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    counts?: Record<string, number>;
  }) => (
    <div data-testid="participants-filter">
      <span data-testid="active-filter">{activeFilter}</span>
      <button data-testid="filter-all" onClick={() => onFilterChange('all')}>
        All {counts?.all}
      </button>
      <button data-testid="filter-compliant" onClick={() => onFilterChange('compliant')}>
        Compliant {counts?.compliant}
      </button>
      <button data-testid="filter-at-risk" onClick={() => onFilterChange('at-risk')}>
        At Risk {counts?.['at-risk']}
      </button>
      <button data-testid="filter-non-compliant" onClick={() => onFilterChange('non-compliant')}>
        Non-Compliant {counts?.['non-compliant']}
      </button>
    </div>
  ),
}));

const TEST_ORG_ID = '11111111-1111-4111-a111-111111111111';
const TEST_PROJECT_ID = '33333333-3333-4333-a333-333333333333';

const mockParticipants = [
  {
    id: '55555555-5555-4555-a555-555555555551',
    name: 'ABC Contractors',
    type: 'subcontractor',
    status: 'compliant',
    score: 95,
    lastUpdated: new Date('2024-01-15'),
    openIssues: 0,
  },
  {
    id: '55555555-5555-4555-a555-555555555552',
    name: 'XYZ Services',
    type: 'vendor',
    status: 'at-risk',
    score: 72,
    lastUpdated: new Date('2024-01-10'),
    openIssues: 2,
  },
  {
    id: '55555555-5555-4555-a555-555555555553',
    name: 'Quick Fix LLC',
    type: 'subcontractor',
    status: 'non-compliant',
    score: 45,
    lastUpdated: new Date('2024-01-05'),
    openIssues: 5,
  },
];

const mockSummary = {
  total: 10,
  compliant: 5,
  pending: 2,
  atRisk: 2,
  nonCompliant: 1,
  averageScore: 78,
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('ParticipantsComplianceView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListByProject.mockReturnValue({
      data: { participants: mockParticipants, total: 3 },
      isLoading: false,
    });
    mockGetComplianceSummary.mockReturnValue({
      data: mockSummary,
    });
  });

  describe('Rendering', () => {
    it('should render the filter component', () => {
      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId={TEST_PROJECT_ID}
        />
      );

      expect(screen.getByTestId('participants-filter')).toBeInTheDocument();
    });

    it('should render the participants table', () => {
      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId={TEST_PROJECT_ID}
        />
      );

      expect(screen.getByTestId('participants-table')).toBeInTheDocument();
    });

    it('should display summary metrics', () => {
      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId={TEST_PROJECT_ID}
        />
      );

      expect(screen.getByText('Total Participants')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Compliant')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display participant count', () => {
      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId={TEST_PROJECT_ID}
        />
      );

      expect(screen.getByText('3 participants found')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should start with "all" filter active', () => {
      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId={TEST_PROJECT_ID}
        />
      );

      expect(screen.getByTestId('active-filter')).toHaveTextContent('all');
    });

    it('should change filter when clicking filter button', async () => {
      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId={TEST_PROJECT_ID}
        />
      );

      fireEvent.click(screen.getByTestId('filter-compliant'));

      await waitFor(() => {
        expect(screen.getByTestId('active-filter')).toHaveTextContent('compliant');
      });
    });

    it('should show clear filter button when filter is active', async () => {
      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId={TEST_PROJECT_ID}
        />
      );

      fireEvent.click(screen.getByTestId('filter-at-risk'));

      await waitFor(() => {
        expect(screen.getByText('Clear filter')).toBeInTheDocument();
      });
    });

    it('should clear filter when clicking clear button', async () => {
      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId={TEST_PROJECT_ID}
        />
      );

      // First set a filter
      fireEvent.click(screen.getByTestId('filter-compliant'));

      await waitFor(() => {
        expect(screen.getByTestId('active-filter')).toHaveTextContent('compliant');
      });

      // Clear the filter
      fireEvent.click(screen.getByText('Clear filter'));

      await waitFor(() => {
        expect(screen.getByTestId('active-filter')).toHaveTextContent('all');
      });
    });

    it('should pass counts to filter component', () => {
      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId={TEST_PROJECT_ID}
        />
      );

      // Check that counts are passed through
      expect(screen.getByTestId('filter-all')).toHaveTextContent('All 10');
      expect(screen.getByTestId('filter-compliant')).toHaveTextContent('Compliant 5');
    });
  });

  describe('Participant Interaction', () => {
    it('should call onParticipantClick when clicking a participant row', () => {
      const handleClick = vi.fn();

      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId={TEST_PROJECT_ID}
          onParticipantClick={handleClick}
        />
      );

      fireEvent.click(screen.getByTestId('participant-row-55555555-5555-4555-a555-555555555551'));

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading state when fetching participants', () => {
      mockListByProject.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId={TEST_PROJECT_ID}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no participants found', () => {
      mockListByProject.mockReturnValue({
        data: { participants: [], total: 0 },
        isLoading: false,
      });

      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId={TEST_PROJECT_ID}
        />
      );

      expect(screen.getByText('No participants found for this project')).toBeInTheDocument();
    });

    it('should show filtered empty message when filter returns no results', async () => {
      mockListByProject.mockReturnValue({
        data: { participants: [], total: 0 },
        isLoading: false,
      });

      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId={TEST_PROJECT_ID}
        />
      );

      fireEvent.click(screen.getByTestId('filter-non-compliant'));

      await waitFor(() => {
        expect(screen.getByText('No non-compliant participants found')).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should not fetch data when organizationId is missing', () => {
      renderWithProviders(
        <ParticipantsComplianceView
          organizationId=""
          projectId={TEST_PROJECT_ID}
        />
      );

      // The mock returns undefined when enabled is false
      expect(screen.queryByTestId('participants-table')).not.toBeInTheDocument();
    });

    it('should not fetch data when projectId is missing', () => {
      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId=""
        />
      );

      // The mock returns undefined when enabled is false
      expect(screen.queryByTestId('participants-table')).not.toBeInTheDocument();
    });

    it('should pass filter status to API when filtering', async () => {
      renderWithProviders(
        <ParticipantsComplianceView
          organizationId={TEST_ORG_ID}
          projectId={TEST_PROJECT_ID}
        />
      );

      fireEvent.click(screen.getByTestId('filter-compliant'));

      await waitFor(() => {
        // Check that the API was called with the status filter
        expect(mockListByProject).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'compliant',
          })
        );
      });
    });
  });
});
