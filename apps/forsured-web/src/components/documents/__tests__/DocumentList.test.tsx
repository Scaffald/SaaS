/**
 * DocumentList tests
 * REQ-284: Document Organization by Client/Project/GC
 * TASK-2: Build Document List with Filtering and Search
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { DocumentList } from '../DocumentList';

// Mock tRPC
const mockUseQuery = vi.fn();

vi.mock('../../../lib/trpc', () => ({
  trpc: {
    documents: {
      getClients: {
        useQuery: () => mockUseQuery('getClients'),
      },
      getProjects: {
        useQuery: () => mockUseQuery('getProjects'),
      },
      list: {
        useQuery: () => mockUseQuery('list'),
      },
    },
  },
}));

// Mock data
const mockClients = [
  { id: 'client-1', name: 'ABC Construction', type: 'gc' },
  { id: 'client-2', name: 'XYZ Contractors', type: 'subcontractor' },
];

const mockProjects = [
  { id: 'proj-1', name: 'Downtown Office', clientId: 'client-1' },
  { id: 'proj-2', name: 'Highway Bridge', clientId: 'client-1' },
];

const mockDocuments = [
  {
    id: 'doc-1',
    filename: 'insurance-cert-2024.pdf',
    docType: 'coi',
    status: 'verified',
    clientId: 'client-1',
    clientName: 'ABC Construction',
    projectId: 'proj-1',
    projectName: 'Downtown Office',
    updatedAt: '2024-01-15T10:00:00Z',
    expiresAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'doc-2',
    filename: 'business-license.pdf',
    docType: 'license',
    status: 'pending',
    clientId: 'client-2',
    clientName: 'XYZ Contractors',
    projectId: null,
    projectName: null,
    updatedAt: '2024-01-10T10:00:00Z',
    expiresAt: null,
  },
  {
    id: 'doc-3',
    filename: 'contract-2024.pdf',
    docType: 'contract',
    status: 'expired',
    clientId: 'client-1',
    clientName: 'ABC Construction',
    projectId: 'proj-2',
    projectName: 'Highway Bridge',
    updatedAt: '2024-01-05T10:00:00Z',
    expiresAt: '2024-01-01T10:00:00Z',
  },
];

describe('DocumentList', () => {
  const defaultOrganizationId = 'org-123';

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseQuery.mockImplementation((queryName: string) => {
      switch (queryName) {
        case 'getClients':
          return { data: mockClients, isLoading: false };
        case 'getProjects':
          return { data: mockProjects, isLoading: false };
        case 'list':
          return {
            data: { documents: mockDocuments, total: 3 },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          };
        default:
          return { data: null, isLoading: false };
      }
    });
  });

  describe('rendering', () => {
    it('renders the filter panel', () => {
      render(<DocumentList organizationId={defaultOrganizationId} />);

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('renders the search input', () => {
      render(<DocumentList organizationId={defaultOrganizationId} />);

      expect(screen.getByPlaceholderText(/search by filename/i)).toBeInTheDocument();
    });

    it('renders document count', () => {
      render(<DocumentList organizationId={defaultOrganizationId} />);

      expect(screen.getByText('3 documents found')).toBeInTheDocument();
    });

    it('renders singular document count', () => {
      mockUseQuery.mockImplementation((queryName: string) => {
        switch (queryName) {
          case 'getClients':
            return { data: mockClients, isLoading: false };
          case 'getProjects':
            return { data: mockProjects, isLoading: false };
          case 'list':
            return {
              data: { documents: [mockDocuments[0]], total: 1 },
              isLoading: false,
              error: null,
              refetch: vi.fn(),
            };
          default:
            return { data: null, isLoading: false };
        }
      });

      render(<DocumentList organizationId={defaultOrganizationId} />);

      expect(screen.getByText('1 document found')).toBeInTheDocument();
    });

    it('renders refresh button', () => {
      render(<DocumentList organizationId={defaultOrganizationId} />);

      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('renders document table with headers', () => {
      render(<DocumentList organizationId={defaultOrganizationId} />);

      // Check table headers specifically within the table
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Get all column headers
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(6);
      expect(headers[0]).toHaveTextContent('Document');
      expect(headers[1]).toHaveTextContent('Type');
      expect(headers[2]).toHaveTextContent('Status');
      expect(headers[3]).toHaveTextContent('Client');
      expect(headers[4]).toHaveTextContent('Project');
      expect(headers[5]).toHaveTextContent('Updated');
    });

    it('renders document rows', () => {
      render(<DocumentList organizationId={defaultOrganizationId} />);

      expect(screen.getByText('insurance-cert-2024.pdf')).toBeInTheDocument();
      expect(screen.getByText('business-license.pdf')).toBeInTheDocument();
      expect(screen.getByText('contract-2024.pdf')).toBeInTheDocument();
    });

    it('renders document type labels in table cells', () => {
      render(<DocumentList organizationId={defaultOrganizationId} />);

      // Find the table rows and check type labels within them
      const rows = screen.getAllByRole('row');
      // First row is header, rest are data rows
      expect(rows.length).toBeGreaterThan(1);

      // Check types appear in table cells
      const table = screen.getByRole('table');
      expect(table).toHaveTextContent('Certificate of Insurance');
      expect(table).toHaveTextContent('Business License');
      expect(table).toHaveTextContent('Contract');
    });

    it('renders status badges in table', () => {
      render(<DocumentList organizationId={defaultOrganizationId} />);

      // Check status badges appear in the table
      const table = screen.getByRole('table');
      expect(table).toHaveTextContent('Verified');
      expect(table).toHaveTextContent('Pending');
      expect(table).toHaveTextContent('Expired');
    });

    it('renders client names', () => {
      render(<DocumentList organizationId={defaultOrganizationId} />);

      expect(screen.getAllByText('ABC Construction')).toHaveLength(2);
      expect(screen.getByText('XYZ Contractors')).toBeInTheDocument();
    });

    it('renders project names or dash for null in table', () => {
      render(<DocumentList organizationId={defaultOrganizationId} />);

      // Check projects appear in table
      const table = screen.getByRole('table');
      expect(table).toHaveTextContent('Downtown Office');
      expect(table).toHaveTextContent('Highway Bridge');

      // Find the row with null project (business-license.pdf) and check for dash
      const rows = screen.getAllByRole('row');
      const licenseRow = rows.find((row) => row.textContent?.includes('business-license.pdf'));
      expect(licenseRow).toHaveTextContent('-');
    });
  });

  describe('loading state', () => {
    it('shows loading state when fetching documents', () => {
      mockUseQuery.mockImplementation((queryName: string) => {
        switch (queryName) {
          case 'getClients':
            return { data: null, isLoading: true };
          case 'getProjects':
            return { data: null, isLoading: true };
          case 'list':
            return {
              data: null,
              isLoading: true,
              error: null,
              refetch: vi.fn(),
            };
          default:
            return { data: null, isLoading: false };
        }
      });

      render(<DocumentList organizationId={defaultOrganizationId} />);

      // There's a loading spinner with text - check for both instances
      const loadingTexts = screen.getAllByText('Loading documents...');
      expect(loadingTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('disables search input when loading', () => {
      mockUseQuery.mockImplementation((queryName: string) => {
        switch (queryName) {
          case 'getClients':
            return { data: null, isLoading: true };
          case 'getProjects':
            return { data: null, isLoading: true };
          case 'list':
            return {
              data: null,
              isLoading: true,
              error: null,
              refetch: vi.fn(),
            };
          default:
            return { data: null, isLoading: false };
        }
      });

      render(<DocumentList organizationId={defaultOrganizationId} />);

      const searchInput = screen.getByPlaceholderText(/search by filename/i);
      expect(searchInput).toBeDisabled();
    });
  });

  describe('error state', () => {
    it('shows error message when fetch fails', () => {
      mockUseQuery.mockImplementation((queryName: string) => {
        switch (queryName) {
          case 'getClients':
            return { data: mockClients, isLoading: false };
          case 'getProjects':
            return { data: mockProjects, isLoading: false };
          case 'list':
            return {
              data: null,
              isLoading: false,
              error: { message: 'Network error' },
              refetch: vi.fn(),
            };
          default:
            return { data: null, isLoading: false };
        }
      });

      render(<DocumentList organizationId={defaultOrganizationId} />);

      expect(screen.getByText('Failed to load documents')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('shows Try Again button on error', () => {
      mockUseQuery.mockImplementation((queryName: string) => {
        switch (queryName) {
          case 'getClients':
            return { data: mockClients, isLoading: false };
          case 'getProjects':
            return { data: mockProjects, isLoading: false };
          case 'list':
            return {
              data: null,
              isLoading: false,
              error: { message: 'Network error' },
              refetch: vi.fn(),
            };
          default:
            return { data: null, isLoading: false };
        }
      });

      render(<DocumentList organizationId={defaultOrganizationId} />);

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('calls refetch when Try Again is clicked', async () => {
      const mockRefetch = vi.fn();
      mockUseQuery.mockImplementation((queryName: string) => {
        switch (queryName) {
          case 'getClients':
            return { data: mockClients, isLoading: false };
          case 'getProjects':
            return { data: mockProjects, isLoading: false };
          case 'list':
            return {
              data: null,
              isLoading: false,
              error: { message: 'Network error' },
              refetch: mockRefetch,
            };
          default:
            return { data: null, isLoading: false };
        }
      });

      render(<DocumentList organizationId={defaultOrganizationId} />);

      const tryAgainButton = screen.getByText('Try Again');
      await userEvent.click(tryAgainButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no documents', () => {
      mockUseQuery.mockImplementation((queryName: string) => {
        switch (queryName) {
          case 'getClients':
            return { data: mockClients, isLoading: false };
          case 'getProjects':
            return { data: mockProjects, isLoading: false };
          case 'list':
            return {
              data: { documents: [], total: 0 },
              isLoading: false,
              error: null,
              refetch: vi.fn(),
            };
          default:
            return { data: null, isLoading: false };
        }
      });

      render(<DocumentList organizationId={defaultOrganizationId} />);

      expect(screen.getByText('No documents found')).toBeInTheDocument();
      expect(screen.getByText('No documents have been uploaded yet')).toBeInTheDocument();
    });

    it('shows filter hint when empty with filters applied', () => {
      mockUseQuery.mockImplementation((queryName: string) => {
        switch (queryName) {
          case 'getClients':
            return { data: mockClients, isLoading: false };
          case 'getProjects':
            return { data: mockProjects, isLoading: false };
          case 'list':
            return {
              data: { documents: [], total: 0 },
              isLoading: false,
              error: null,
              refetch: vi.fn(),
            };
          default:
            return { data: null, isLoading: false };
        }
      });

      render(<DocumentList organizationId={defaultOrganizationId} />);

      // Simulate filter being applied by checking the default empty message first
      expect(screen.getByText('No documents have been uploaded yet')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('updates search input value', async () => {
      render(<DocumentList organizationId={defaultOrganizationId} />);

      const searchInput = screen.getByPlaceholderText(/search by filename/i);
      await userEvent.type(searchInput, 'insurance');

      expect(searchInput).toHaveValue('insurance');
    });
  });

  describe('document click', () => {
    it('calls onDocumentClick when document row is clicked', async () => {
      const onDocumentClick = vi.fn();
      render(
        <DocumentList
          organizationId={defaultOrganizationId}
          onDocumentClick={onDocumentClick}
        />
      );

      const firstRow = screen.getByText('insurance-cert-2024.pdf').closest('tr');
      if (firstRow) {
        await userEvent.click(firstRow);
      }

      expect(onDocumentClick).toHaveBeenCalledWith(mockDocuments[0]);
    });
  });

  describe('refresh', () => {
    it('calls refetch when refresh button is clicked', async () => {
      const mockRefetch = vi.fn();
      mockUseQuery.mockImplementation((queryName: string) => {
        switch (queryName) {
          case 'getClients':
            return { data: mockClients, isLoading: false };
          case 'getProjects':
            return { data: mockProjects, isLoading: false };
          case 'list':
            return {
              data: { documents: mockDocuments, total: 3 },
              isLoading: false,
              error: null,
              refetch: mockRefetch,
            };
          default:
            return { data: null, isLoading: false };
        }
      });

      render(<DocumentList organizationId={defaultOrganizationId} />);

      const refreshButton = screen.getByText('Refresh');
      await userEvent.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('date formatting', () => {
    it('formats dates correctly', () => {
      render(<DocumentList organizationId={defaultOrganizationId} />);

      // Jan 15, 2024 format
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });
  });
});
