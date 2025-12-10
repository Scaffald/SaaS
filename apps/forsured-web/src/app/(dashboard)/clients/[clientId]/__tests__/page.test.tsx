/**
 * Client Profile Page Tests
 * REQ-274: Clickable Client Navigation
 * TASK-1: Create Client Profile Route and Page Component
 * TASK-2: Implement Client Profile Data Fetching
 * TASK-3: Render GC Relationships with Compliance Status and Activity Feed
 *
 * Tests for the client profile page that displays:
 * - Client header with client name
 * - GC Relationships section with compliance badges
 * - Compliance Status summary
 * - Recent Activity feed
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithoutRouter, screen } from '@/test/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ClientProfilePage from '../page';

// Mock trpc
const mockUseQuery = vi.fn();
vi.mock('../../../../../lib/trpc', () => ({
  trpc: {
    clientProfile: {
      getProfile: {
        useQuery: () => mockUseQuery(),
      },
    },
  },
}));

// Mock StatusBadge
vi.mock('../../../../../components/Common/StatusBadge', () => ({
  default: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

// Helper to render with router context
const renderWithRouter = (clientId: string = 'client-123') => {
  return renderWithoutRouter(
    <MemoryRouter initialEntries={[`/clients/${clientId}`]}>
      <Routes>
        <Route path="/clients/:clientId" element={<ClientProfilePage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ClientProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading skeleton while fetching data', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderWithRouter();

      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('error state', () => {
    it('shows error message when fetch fails', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Client not found' },
      });

      renderWithRouter();

      expect(screen.getByText('Error Loading Client')).toBeInTheDocument();
      expect(screen.getByText('Client not found')).toBeInTheDocument();
    });

    it('shows back button in error state', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Error' },
      });

      renderWithRouter();

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });
  });

  describe('success state', () => {
    const mockProfileData = {
      client: {
        id: 'client-123',
        name: 'ABC Construction',
        type: 'subcontractor',
      },
      gcRelationships: [
        { gcId: 'gc-1', gcName: 'GC One', complianceScore: 85, complianceStatus: 'compliant' },
        { gcId: 'gc-2', gcName: 'GC Two', complianceScore: 65, complianceStatus: 'warning' },
      ],
      recentActivity: [
        { id: 'act-1', type: 'document_uploaded', description: 'Uploaded COI', timestamp: '2024-01-01T00:00:00Z' },
      ],
    };

    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockProfileData,
        isLoading: false,
        error: null,
      });
    });

    it('renders client profile page', () => {
      renderWithRouter();

      expect(screen.getByText('Client Profile')).toBeInTheDocument();
    });

    it('displays client name from fetched data', () => {
      renderWithRouter();

      expect(screen.getByTestId('client-name')).toHaveTextContent('ABC Construction');
    });

    it('renders back navigation button', () => {
      renderWithRouter();

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('extracts clientId from URL params', () => {
      renderWithRouter('client-123');

      expect(screen.getByTestId('client-id')).toHaveTextContent('client-123');
    });

    it('extracts different clientId from URL params', () => {
      renderWithRouter('abc-456');

      expect(screen.getByTestId('client-id')).toHaveTextContent('abc-456');
    });
  });

  describe('GC Relationships section', () => {
    it('renders GC Relationships section header', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('GC Relationships')).toBeInTheDocument();
    });

    it('renders GC relationship items when relationships exist', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [
            { gcId: 'gc-1', gcName: 'GC One', complianceScore: 85, complianceStatus: 'compliant' },
            { gcId: 'gc-2', gcName: 'GC Two', complianceScore: 65, complianceStatus: 'warning' },
          ],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      const relationshipItems = screen.getAllByTestId('gc-relationship-item');
      expect(relationshipItems).toHaveLength(2);
    });

    it('displays GC names in relationship list', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [
            { gcId: 'gc-1', gcName: 'GC One', complianceScore: 85, complianceStatus: 'compliant' },
            { gcId: 'gc-2', gcName: 'GC Two', complianceScore: 65, complianceStatus: 'warning' },
          ],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('GC One')).toBeInTheDocument();
      expect(screen.getByText('GC Two')).toBeInTheDocument();
    });

    it('displays compliance scores for each GC', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [
            { gcId: 'gc-1', gcName: 'GC One', complianceScore: 85, complianceStatus: 'compliant' },
          ],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('Compliance Score: 85%')).toBeInTheDocument();
    });

    it('renders status badges for each GC', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [
            { gcId: 'gc-1', gcName: 'GC One', complianceScore: 85, complianceStatus: 'compliant' },
            { gcId: 'gc-2', gcName: 'GC Two', complianceScore: 65, complianceStatus: 'warning' },
          ],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      const statusBadges = screen.getAllByTestId('status-badge');
      expect(statusBadges).toHaveLength(2);
    });

    it('shows empty state message when no relationships', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('No GC relationships found for this client')).toBeInTheDocument();
    });

    it('renders GC names as clickable links', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [
            { gcId: 'gc-1', gcName: 'GC One', complianceScore: 85, complianceStatus: 'compliant' },
            { gcId: 'gc-2', gcName: 'GC Two', complianceScore: 65, complianceStatus: 'warning' },
          ],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      const gcLinks = screen.getAllByTestId('gc-name-link');
      expect(gcLinks).toHaveLength(2);
    });

    it('GC name links have correct href to GC profile', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [
            { gcId: 'gc-1', gcName: 'GC One', complianceScore: 85, complianceStatus: 'compliant' },
            { gcId: 'gc-2', gcName: 'GC Two', complianceScore: 65, complianceStatus: 'warning' },
          ],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      const gcLinks = screen.getAllByTestId('gc-name-link');
      expect(gcLinks[0]).toHaveAttribute('href', '/clients/gc-1');
      expect(gcLinks[1]).toHaveAttribute('href', '/clients/gc-2');
    });

    it('GC name links have appropriate link styling', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [
            { gcId: 'gc-1', gcName: 'GC One', complianceScore: 85, complianceStatus: 'compliant' },
          ],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      const gcLink = screen.getByTestId('gc-name-link');
      expect(gcLink).toHaveClass('text-blue-600');
    });
  });

  describe('Compliance Status section', () => {
    it('renders Compliance Status section header', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('Compliance Status')).toBeInTheDocument();
    });

    it('renders compliance summary cards when relationships exist', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [
            { gcId: 'gc-1', gcName: 'GC One', complianceScore: 85, complianceStatus: 'compliant' },
            { gcId: 'gc-2', gcName: 'GC Two', complianceScore: 65, complianceStatus: 'warning' },
            { gcId: 'gc-3', gcName: 'GC Three', complianceScore: 40, complianceStatus: 'critical' },
          ],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByTestId('compliance-summary')).toBeInTheDocument();
      expect(screen.getByText('Compliant')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('displays correct counts for each status', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [
            { gcId: 'gc-1', gcName: 'GC One', complianceScore: 85, complianceStatus: 'compliant' },
            { gcId: 'gc-2', gcName: 'GC Two', complianceScore: 82, complianceStatus: 'compliant' },
            { gcId: 'gc-3', gcName: 'GC Three', complianceScore: 65, complianceStatus: 'warning' },
          ],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      // Should show 2 compliant, 1 warning, 0 critical
      const summary = screen.getByTestId('compliance-summary');
      expect(summary).toHaveTextContent('2'); // compliant count
      expect(summary).toHaveTextContent('1'); // warning count
      expect(summary).toHaveTextContent('0'); // critical count
    });

    it('shows empty state when no compliance data', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('No compliance data available')).toBeInTheDocument();
    });
  });

  describe('Recent Activity section', () => {
    it('renders Recent Activity section header', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('renders activity items when activities exist', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [],
          recentActivity: [
            { id: 'act-1', type: 'upload', description: 'Uploaded COI document', timestamp: '2024-01-01T00:00:00Z' },
            { id: 'act-2', type: 'update', description: 'Updated compliance status', timestamp: '2024-01-02T00:00:00Z' },
          ],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      const activityItems = screen.getAllByTestId('activity-item');
      expect(activityItems).toHaveLength(2);
    });

    it('displays activity descriptions', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [],
          recentActivity: [
            { id: 'act-1', type: 'upload', description: 'Uploaded COI document', timestamp: '2024-01-01T00:00:00Z' },
          ],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('Uploaded COI document')).toBeInTheDocument();
    });

    it('shows empty state when no activities', () => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });
    });

    it('applies consistent styling with other pages', () => {
      renderWithRouter();

      const container = screen.getByTestId('client-profile-container');
      expect(container).toHaveClass('min-h-screen', 'bg-gray-50');
    });

    it('uses max-width container', () => {
      renderWithRouter();

      const innerContainer = screen.getByTestId('client-profile-content');
      expect(innerContainer).toHaveClass('max-w-7xl', 'mx-auto');
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: {
          client: { id: 'c1', name: 'Test', type: 'sub' },
          gcRelationships: [],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      });
    });

    it('has appropriate heading hierarchy', () => {
      renderWithRouter();

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Client Profile');

      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThanOrEqual(3);
    });
  });
});
