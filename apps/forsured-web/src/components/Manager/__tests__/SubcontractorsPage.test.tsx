/**
 * SubcontractorsPage Component Unit Tests
 *
 * Tests for the manager subcontractors page component:
 * - Rendering with and without subcontractors
 * - Add Subcontractor button visibility and functionality
 * - Navigation when clicking Add Subcontractor button
 * - Empty state behavior
 * - Loading and error states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import SubcontractorsPage from '../SubcontractorsPage';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('../../../contexts/DatabaseContext', () => ({
  useDatabase: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('../SubcontractorDetailModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="subcontractor-detail-modal">Modal</div> : null),
}));

// Import mocked modules
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const mockNavigate = vi.fn();
const mockForsured = vi.fn();

describe('SubcontractorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);
    (useDatabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      forsured: mockForsured,
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when data is loading', async () => {
      // Mock a promise that never resolves to keep loading state
      mockForsured.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            then: vi.fn(),
          }),
        }),
      });

      render(<SubcontractorsPage />);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText(/loading subcontractors/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no subcontractors exist', async () => {
      // Mock empty response
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          then: vi.fn((callback) => {
            callback({ data: [], error: null });
            return { catch: vi.fn() };
          }),
        }),
      });

      mockForsured.mockReturnValue({
        select: mockSelect,
      });

      render(<SubcontractorsPage />);

      await waitFor(() => {
        expect(screen.getByText(/no subcontractors yet/i)).toBeInTheDocument();
      });

      // Should show Add Subcontractor button in empty state
      const addButton = screen.getByRole('button', { name: /add subcontractor/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should navigate to new route when clicking Add Subcontractor in empty state', async () => {
      const user = userEvent.setup();

      // Mock empty response
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          then: vi.fn((callback) => {
            callback({ data: [], error: null });
            return { catch: vi.fn() };
          }),
        }),
      });

      mockForsured.mockReturnValue({
        select: mockSelect,
      });

      render(<SubcontractorsPage />);

      await waitFor(() => {
        expect(screen.getByText(/no subcontractors yet/i)).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add subcontractor/i });
      await user.click(addButton);

      expect(mockNavigate).toHaveBeenCalledWith('/manager/subcontractors/new');
    });
  });

  describe('List View with Subcontractors', () => {
    const mockSubcontractors = [
      {
        id: 'sub-1',
        organization_id: 'org-1',
        name: 'John Doe',
        company: 'Test Company',
        company_name: 'Test Company',
        contact_name: 'John Doe',
        contact_info: {
          email: 'john@test.com',
          phone: '555-1234',
        },
        compliance_score: 85,
        risk_level: 'low',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'sub-2',
        organization_id: 'org-1',
        name: 'Jane Smith',
        company: 'Another Company',
        company_name: 'Another Company',
        contact_name: 'Jane Smith',
        contact_info: {
          email: 'jane@test.com',
          phone: '555-5678',
        },
        compliance_score: 60,
        risk_level: 'critical',
        status: 'active',
        created_at: '2024-01-02T00:00:00Z',
      },
    ];

    it('should display subcontractors list when data exists', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          then: vi.fn((callback) => {
            callback({ data: mockSubcontractors, error: null });
            return { catch: vi.fn() };
          }),
        }),
      });

      mockForsured.mockReturnValue({
        select: mockSelect,
      });

      render(<SubcontractorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Company')).toBeInTheDocument();
      });

      expect(screen.getByText('Another Company')).toBeInTheDocument();
    });

    it('should show Add Subcontractor button in header when subcontractors exist', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          then: vi.fn((callback) => {
            callback({ data: mockSubcontractors, error: null });
            return { catch: vi.fn() };
          }),
        }),
      });

      mockForsured.mockReturnValue({
        select: mockSelect,
      });

      render(<SubcontractorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Company')).toBeInTheDocument();
      });

      // Should have Add Subcontractor button in header
      const addButtons = screen.getAllByRole('button', { name: /add subcontractor/i });
      expect(addButtons.length).toBeGreaterThan(0);
    });

    it('should navigate to new route when clicking Add Subcontractor button in header', async () => {
      const user = userEvent.setup();

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          then: vi.fn((callback) => {
            callback({ data: mockSubcontractors, error: null });
            return { catch: vi.fn() };
          }),
        }),
      });

      mockForsured.mockReturnValue({
        select: mockSelect,
      });

      render(<SubcontractorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Company')).toBeInTheDocument();
      });

      // Find and click the Add Subcontractor button
      const addButtons = screen.getAllByRole('button', { name: /add subcontractor/i });
      const headerButton = addButtons[0]; // First one should be in header
      
      await user.click(headerButton);

      expect(mockNavigate).toHaveBeenCalledWith('/manager/subcontractors/new');
    });

    it('should display correct subcontractor count in header', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          then: vi.fn((callback) => {
            callback({ data: mockSubcontractors, error: null });
            return { catch: vi.fn() };
          }),
        }),
      });

      mockForsured.mockReturnValue({
        select: mockSelect,
      });

      render(<SubcontractorsPage />);

      await waitFor(() => {
        expect(screen.getByText(/manage 2 subcontractors/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should show error message when data fetch fails', async () => {
      const mockError = new Error('Failed to load subcontractors');
      
      // Mock a promise that rejects
      const mockOrder = vi.fn().mockReturnValue(
        Promise.reject(mockError)
      );
      
      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      mockForsured.mockReturnValue({
        select: mockSelect,
      });

      render(<SubcontractorsPage />);

      // Wait for error state to appear - text appears in h3 element
      await waitFor(() => {
        const errorHeading = screen.getByRole('heading', { name: /failed to load subcontractors/i });
        expect(errorHeading).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(toast.error).toHaveBeenCalledWith('Failed to load subcontractors');
    });
  });

  describe('Button Accessibility', () => {
    it('should have accessible Add Subcontractor button', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          then: vi.fn((callback) => {
            callback({ data: [], error: null });
            return { catch: vi.fn() };
          }),
        }),
      });

      mockForsured.mockReturnValue({
        select: mockSelect,
      });

      render(<SubcontractorsPage />);

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /add subcontractor/i });
        expect(addButton).toBeInTheDocument();
        expect(addButton).not.toBeDisabled();
      });
    });
  });
});

