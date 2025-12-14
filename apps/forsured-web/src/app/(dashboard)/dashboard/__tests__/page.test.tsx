/**
 * REQ-129: Dashboard Page Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import DashboardPage from '../page';
import * as dashboardService from '../../../../lib/api/dashboard/dashboardService';
import { LexiconProvider } from '../../../../contexts/LexiconContext';

// Mock the trpc client for LexiconContext
vi.mock('../../../../lib/trpc', () => ({
  trpc: {
    userSetTypes: {
      getUserLexicon: {
        useQuery: vi.fn(() => ({
          data: null,
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        })),
      },
      // TASK-14: Mock for broker context switching
      getByIdWithLexicon: {
        useQuery: vi.fn(() => ({
          data: null,
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        })),
      },
    },
  },
}));

// Wrapper with LexiconProvider for tests
const renderWithLexicon = (ui: React.ReactElement) => {
  return render(<LexiconProvider>{ui}</LexiconProvider>);
};

// Mock the dashboard service
vi.mock('../../../../lib/api/dashboard/dashboardService', () => ({
  dashboardService: {
    getOverview: vi.fn(),
    getSubcontractorScores: vi.fn(),
    getTaskSummary: vi.fn(),
    getExpiringPolicies: vi.fn(),
    getActivityFeed: vi.fn(),
    exportDashboard: vi.fn(),
  },
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock responses
    vi.mocked(dashboardService.dashboardService.getOverview).mockResolvedValue({
      overall_compliance_score: 85,
      total_subcontractors: 10,
      compliant_count: 6,
      warning_count: 3,
      critical_count: 1,
      total_projects: 5,
      active_projects: 4,
      last_updated: new Date().toISOString(),
    });

    vi.mocked(dashboardService.dashboardService.getSubcontractorScores).mockResolvedValue([
      {
        id: '1',
        company_name: 'Test Company',
        compliance_score: 90,
        status: 'compliant',
        open_tasks_count: 2,
        policies_expiring_count: 0,
        last_updated: new Date().toISOString(),
        project_count: 1,
        risk_level: 'low',
      },
    ]);

    vi.mocked(dashboardService.dashboardService.getTaskSummary).mockResolvedValue({
      total_open_tasks: 15,
      high_priority_count: 3,
      medium_priority_count: 7,
      low_priority_count: 5,
      urgent_count: 2,
      overdue_count: 1,
      due_today_count: 3,
      last_updated: new Date().toISOString(),
    });

    vi.mocked(dashboardService.dashboardService.getExpiringPolicies).mockResolvedValue([
      {
        id: '1',
        policy_number: 'POL-001',
        policy_type: 'general_liability',
        subcontractor_id: '1',
        subcontractor_name: 'Test Company',
        expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        days_remaining: 7,
        project_count: 1,
        status: 'active',
      },
    ]);

    vi.mocked(dashboardService.dashboardService.getActivityFeed).mockResolvedValue([
      {
        id: '1',
        event_type: 'policy_uploaded',
        description: 'New policy uploaded',
        subcontractor_name: 'Test Company',
        timestamp: new Date().toISOString(),
      },
    ]);
  });

  it('should render dashboard title', async () => {
    renderWithLexicon(<DashboardPage />);

    await waitFor(() => {
      // REQ-4: Uses lexicon t('nav.dashboard') which defaults to 'Dashboard'
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('should display overall compliance score', async () => {
    renderWithLexicon(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Overall Compliance Score')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });

  it('should display subcontractor count metrics', async () => {
    renderWithLexicon(<DashboardPage />);

    await waitFor(() => {
      // REQ-4: Uses lexicon getContractorLabel(true) which defaults to 'Subcontractors'
      expect(screen.getByText('Compliant Subcontractors')).toBeInTheDocument();
      expect(screen.getByText('Warning Status')).toBeInTheDocument();
      expect(screen.getByText('Critical Status')).toBeInTheDocument();
    });
  });

  it('should display task summary', async () => {
    renderWithLexicon(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Open Tasks')).toBeInTheDocument();
      expect(screen.getByText('Urgent Priority')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByText('Due Today')).toBeInTheDocument();
    });
  });

  it('should display subcontractor compliance table', async () => {
    renderWithLexicon(<DashboardPage />);

    await waitFor(() => {
      // REQ-4: Uses lexicon getContractorLabel() which defaults to 'Subcontractor'
      expect(screen.getByText('Subcontractor Compliance')).toBeInTheDocument();
      const companyElements = screen.getAllByText('Test Company');
      expect(companyElements.length).toBeGreaterThan(0); // Company appears in table
    });
  });

  it('should display expiring policies', async () => {
    renderWithLexicon(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Policies Expiring Soon (30 days)')).toBeInTheDocument();
      expect(screen.getByText('general liability')).toBeInTheDocument();
      expect(screen.getByText('7 days')).toBeInTheDocument();
    });
  });

  it('should display activity feed', async () => {
    renderWithLexicon(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('New policy uploaded')).toBeInTheDocument();
    });
  });

  it('should call all data fetch methods on load', async () => {
    renderWithLexicon(<DashboardPage />);

    await waitFor(() => {
      expect(dashboardService.dashboardService.getOverview).toHaveBeenCalled();
      expect(dashboardService.dashboardService.getSubcontractorScores).toHaveBeenCalled();
      expect(dashboardService.dashboardService.getTaskSummary).toHaveBeenCalled();
      expect(dashboardService.dashboardService.getExpiringPolicies).toHaveBeenCalled();
      expect(dashboardService.dashboardService.getActivityFeed).toHaveBeenCalled();
    });
  });

  it('should show loading state initially', () => {
    renderWithLexicon(<DashboardPage />);

    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should have export CSV button', async () => {
    renderWithLexicon(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Export to CSV')).toBeInTheDocument();
    });
  });

  it('should display search input', async () => {
    renderWithLexicon(<DashboardPage />);

    await waitFor(() => {
      // REQ-4: Uses lexicon getContractorLabel(true).toLowerCase() which defaults to 'subcontractors'
      const searchInput = screen.getByPlaceholderText('Search subcontractors...');
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('should update last updated timestamp', async () => {
    renderWithLexicon(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });
});
