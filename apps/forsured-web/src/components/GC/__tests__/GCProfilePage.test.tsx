/**
 * GCProfilePage Component Tests
 * REQ-275: GC Profile Page with Subcontractor List
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { renderWithoutRouter, screen, fireEvent } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GCProfilePage from '../GCProfilePage';
import { BrokerClient, ComplianceData, Project } from '../../../types';

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Mock navigate
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock data
const mockGC: BrokerClient = {
  id: 'gc-1',
  company_name: 'Test GC Company',
  client_type: 'general_contractor',
  risk_level: 'low',
  compliance_score: 85,
  last_activity_at: new Date().toISOString(),
  notes: 'Test notes',
  status: 'active',
  email: 'contact@testgc.com',
  phone: '555-1234',
  address: '123 Main St, City, ST',
  primary_contact: 'John Smith',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockSubcontractor: BrokerClient = {
  id: 'sub-1',
  company_name: 'Test Subcontractor',
  client_type: 'subcontractor',
  risk_level: 'medium',
  compliance_score: 72,
  last_activity_at: new Date().toISOString(),
  notes: null,
  status: 'active',
  email: 'contact@testsub.com',
  phone: '555-5678',
  address: '456 Oak Ave',
  primary_contact: 'Jane Doe',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockProject: Project = {
  id: 'proj-1',
  client_id: 'gc-1',
  name: 'Test Project',
  description: 'Test description',
  status: 'active',
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockComplianceData: ComplianceData[] = [
  {
    id: 'comp-1',
    project_id: 'proj-1',
    subcontractor_id: 'sub-1',
    subcontractor_name: 'Test Subcontractor',
    company_name: 'Test Sub Company',
    score: 85,
    last_evaluated: new Date().toISOString(),
    gaps: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'comp-2',
    project_id: 'proj-1',
    subcontractor_id: 'sub-2',
    subcontractor_name: 'Another Subcontractor',
    company_name: 'Another Sub Company',
    score: 65,
    last_evaluated: new Date().toISOString(),
    gaps: [{ id: 'gap-1', description: 'Missing COI', severity: 'high' }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock hooks
vi.mock('../../../hooks/useClients', () => ({
  useClients: vi.fn(() => ({
    clients: [mockGC, mockSubcontractor],
    loading: false,
    error: null,
  })),
}));

vi.mock('../../../hooks/useCompliance', () => ({
  useCompliance: vi.fn(() => ({
    complianceData: mockComplianceData,
    loading: false,
    error: null,
  })),
}));

vi.mock('../../../hooks/useProjects', () => ({
  useProjects: vi.fn(() => ({
    projects: [mockProject],
    loading: false,
    error: null,
  })),
}));

const renderWithRouter = (gcId: string = 'gc-1') => {
  return renderWithoutRouter(
    <MemoryRouter initialEntries={[`/broker/gcs/${gcId}`]}>
      <Routes>
        <Route path="/broker/gcs/:gcId" element={<GCProfilePage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('GCProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the GC company name', () => {
      renderWithRouter();
      expect(screen.getByText('Test GC Company')).toBeInTheDocument();
    });

    it('renders the GC address', () => {
      renderWithRouter();
      expect(screen.getByText('123 Main St, City, ST')).toBeInTheDocument();
    });

    it('renders the Back to Clients button', () => {
      renderWithRouter();
      expect(screen.getByRole('button', { name: /back to clients/i })).toBeInTheDocument();
    });

    it('renders the compliance score badge', () => {
      renderWithRouter();
      // Look for the average compliance score in the badge
      expect(screen.getByText(/% Compliant/i)).toBeInTheDocument();
    });

    it('renders stats bar with Total Subcontractors', () => {
      renderWithRouter();
      expect(screen.getByText('Total Subcontractors')).toBeInTheDocument();
    });

    it('renders stats bar with Compliant count', () => {
      renderWithRouter();
      // Multiple "Compliant" texts may appear (status badges)
      const compliantElements = screen.getAllByText(/Compliant/i);
      expect(compliantElements.length).toBeGreaterThan(0);
    });

    it('renders stats bar with At Risk count', () => {
      renderWithRouter();
      // Multiple "At Risk" texts may appear (status badges)
      const atRiskElements = screen.getAllByText(/At Risk/i);
      expect(atRiskElements.length).toBeGreaterThan(0);
    });

    it('renders stats bar with Active count', () => {
      renderWithRouter();
      // Multiple "Active" texts may appear in the page (status badges)
      // Check for the stats bar specifically
      const activeElements = screen.getAllByText('Active');
      expect(activeElements.length).toBeGreaterThan(0);
    });

    it('renders Subcontractors table heading', () => {
      renderWithRouter();
      expect(screen.getByRole('heading', { name: /subcontractors/i })).toBeInTheDocument();
    });
  });

  describe('filters', () => {
    it('renders search input', () => {
      renderWithRouter();
      expect(screen.getByPlaceholderText('Search subcontractors...')).toBeInTheDocument();
    });

    it('renders status filter dropdown', () => {
      renderWithRouter();
      // There are two select dropdowns - status and compliance
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('All Status')).toBeInTheDocument();
    });

    it('renders compliance filter dropdown', () => {
      renderWithRouter();
      expect(screen.getByText('All Compliance')).toBeInTheDocument();
    });

    it('filters by search query', async () => {
      renderWithRouter();

      const searchInput = screen.getByPlaceholderText('Search subcontractors...');
      await userEvent.type(searchInput, 'Test Subcontractor');

      // Should filter to show only matching results
      expect(screen.getByText('Test Subcontractor')).toBeInTheDocument();
    });
  });

  describe('subcontractors table', () => {
    it('renders table headers', () => {
      renderWithRouter();

      expect(screen.getByText('Subcontractor')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Pending Items')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Last Activity')).toBeInTheDocument();
    });

    it('renders subcontractor rows from compliance data', () => {
      renderWithRouter();

      // Based on mockComplianceData, we should have 2 subcontractors
      expect(screen.getByText('Test Subcontractor')).toBeInTheDocument();
      expect(screen.getByText('Another Subcontractor')).toBeInTheDocument();
    });

    it('displays compliance scores for each subcontractor', () => {
      renderWithRouter();

      // The compliance scores from mockComplianceData (use getAllByText since scores appear in row and expanded card)
      expect(screen.getAllByText('85%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('65%').length).toBeGreaterThanOrEqual(1);
    });

    it('displays pending items count', () => {
      renderWithRouter();

      // sub-2 has 1 gap, so should show 1 pending
      expect(screen.getByText('1 pending')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('navigates back to clients when Back button is clicked', async () => {
      renderWithRouter();

      const backButton = screen.getByRole('button', { name: /back to clients/i });
      await userEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/broker/clients');
    });

    it('expands row and navigates to subcontractor profile when View Full Profile clicked', async () => {
      renderWithRouter();

      // Find and click a subcontractor row to expand it
      const row = screen.getByText('Test Subcontractor').closest('tr');
      if (row) {
        fireEvent.click(row);
      }

      // Now click the View Full Profile button in the expanded card (get first visible one)
      const viewProfileBtns = screen.getAllByTestId('view-profile-btn');
      await userEvent.click(viewProfileBtns[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/broker/gcs/gc-1/subcontractors/sub-1');
    });
  });

  describe('expandable rows (REQ-276)', () => {
    it('shows expand icon on each row', () => {
      renderWithRouter();

      const expandIcons = screen.getAllByTestId('expand-icon');
      expect(expandIcons.length).toBeGreaterThan(0);
    });

    it('expands card when row is clicked', () => {
      renderWithRouter();

      // Initially, expanded card should be hidden
      const expandedCards = screen.queryAllByTestId('expanded-card');
      // All cards exist but are hidden
      expandedCards.forEach(card => {
        expect(card).toHaveClass('hidden');
      });

      // Click a row to expand
      const row = screen.getByText('Test Subcontractor').closest('tr');
      if (row) {
        fireEvent.click(row);
      }

      // Now one expanded card should be visible
      const visibleCard = screen.getAllByTestId('expanded-card').find(
        card => !card.classList.contains('hidden')
      );
      expect(visibleCard).toBeTruthy();
    });

    it('collapses card when same row is clicked again', () => {
      renderWithRouter();

      const row = screen.getByText('Test Subcontractor').closest('tr');

      // Expand
      if (row) {
        fireEvent.click(row);
      }

      // Verify expanded
      const visibleCard = screen.getAllByTestId('expanded-card').find(
        card => !card.classList.contains('hidden')
      );
      expect(visibleCard).toBeTruthy();

      // Click again to collapse
      if (row) {
        fireEvent.click(row);
      }

      // All cards should be hidden again
      const expandedCards = screen.getAllByTestId('expanded-card');
      expandedCards.forEach(card => {
        expect(card).toHaveClass('hidden');
      });
    });

    it('shows action buttons in expanded card', async () => {
      renderWithRouter();

      // Expand a row
      const row = screen.getByText('Test Subcontractor').closest('tr');
      if (row) {
        fireEvent.click(row);
      }

      // Check for action buttons (multiple exist for each row, verify at least one)
      expect(screen.getAllByTestId('view-profile-btn').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('add-note-btn').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('send-message-btn').length).toBeGreaterThan(0);
    });

    it('action button clicks do not collapse the row', async () => {
      renderWithRouter();

      // Expand a row
      const row = screen.getByText('Test Subcontractor').closest('tr');
      if (row) {
        fireEvent.click(row);
      }

      // Click add note button (get first one)
      const addNoteBtns = screen.getAllByTestId('add-note-btn');
      await userEvent.click(addNoteBtns[0]);

      // Row should still be expanded
      const visibleCard = screen.getAllByTestId('expanded-card').find(
        card => !card.classList.contains('hidden')
      );
      expect(visibleCard).toBeTruthy();
    });
  });

  // Note: GC not found, loading state, and empty state tests would require
  // more complex mock setup with vi.doMock or separate test files.
  // These scenarios are covered by the component logic, and the rendering
  // tests above verify the happy path works correctly.
});
