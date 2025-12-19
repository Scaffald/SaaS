/**
 * DocumentFilterPanel tests
 * REQ-284: Document Organization by Client/Project/GC
 * TASK-1: Create Document Filter Panel Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { DocumentFilterPanel } from '../DocumentFilterPanel';
import type {
  DocumentFilterState,
  ClientOption,
  ProjectOption,
} from '../../../types/document-filters';

describe('DocumentFilterPanel', () => {
  const mockClients: ClientOption[] = [
    { id: 'client-1', name: 'ABC Construction', type: 'gc' },
    { id: 'client-2', name: 'XYZ Contractors', type: 'subcontractor' },
    { id: 'client-3', name: 'BuildRight Inc', type: 'gc' },
  ];

  const mockProjects: ProjectOption[] = [
    { id: 'proj-1', name: 'Downtown Office', clientId: 'client-1' },
    { id: 'proj-2', name: 'Highway Bridge', clientId: 'client-1' },
    { id: 'proj-3', name: 'Residential Complex', clientId: 'client-2' },
    { id: 'proj-4', name: 'Shopping Mall', clientId: 'client-3' },
  ];

  const defaultProps = {
    filters: {} as DocumentFilterState,
    onFiltersChange: vi.fn(),
    clients: mockClients,
    projects: mockProjects,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all filter dropdowns', () => {
      render(<DocumentFilterPanel {...defaultProps} />);

      expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/project/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/document type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('renders filter heading', () => {
      render(<DocumentFilterPanel {...defaultProps} />);

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('renders all client options', () => {
      render(<DocumentFilterPanel {...defaultProps} />);

      const clientSelect = screen.getByLabelText(/client/i);
      expect(clientSelect).toContainHTML('ABC Construction');
      expect(clientSelect).toContainHTML('XYZ Contractors');
      expect(clientSelect).toContainHTML('BuildRight Inc');
    });

    it('renders all project options when no client selected', () => {
      render(<DocumentFilterPanel {...defaultProps} />);

      const projectSelect = screen.getByLabelText(/project/i);
      expect(projectSelect).toContainHTML('Downtown Office');
      expect(projectSelect).toContainHTML('Highway Bridge');
      expect(projectSelect).toContainHTML('Residential Complex');
      expect(projectSelect).toContainHTML('Shopping Mall');
    });

    it('renders document type options', () => {
      render(<DocumentFilterPanel {...defaultProps} />);

      const docTypeSelect = screen.getByLabelText(/document type/i);
      expect(docTypeSelect).toContainHTML('Certificate of Insurance');
      expect(docTypeSelect).toContainHTML('Business License');
      expect(docTypeSelect).toContainHTML('Contract');
    });

    it('renders status options', () => {
      render(<DocumentFilterPanel {...defaultProps} />);

      const statusSelect = screen.getByLabelText(/status/i);
      expect(statusSelect).toContainHTML('Verified');
      expect(statusSelect).toContainHTML('Pending');
      expect(statusSelect).toContainHTML('Expiring Soon');
      expect(statusSelect).toContainHTML('Expired');
    });
  });

  describe('filter selection', () => {
    it('calls onFiltersChange when client filter is selected', async () => {
      const onFiltersChange = vi.fn();
      render(
        <DocumentFilterPanel
          {...defaultProps}
          onFiltersChange={onFiltersChange}
        />
      );

      const clientSelect = screen.getByLabelText(/client/i);
      await userEvent.selectOptions(clientSelect, 'client-1');

      expect(onFiltersChange).toHaveBeenCalledWith({
        clientId: 'client-1',
        projectId: undefined,
      });
    });

    it('calls onFiltersChange when project filter is selected', async () => {
      const onFiltersChange = vi.fn();
      render(
        <DocumentFilterPanel
          {...defaultProps}
          onFiltersChange={onFiltersChange}
        />
      );

      const projectSelect = screen.getByLabelText(/project/i);
      await userEvent.selectOptions(projectSelect, 'proj-1');

      expect(onFiltersChange).toHaveBeenCalledWith({
        projectId: 'proj-1',
      });
    });

    it('calls onFiltersChange when document type filter is selected', async () => {
      const onFiltersChange = vi.fn();
      render(
        <DocumentFilterPanel
          {...defaultProps}
          onFiltersChange={onFiltersChange}
        />
      );

      const docTypeSelect = screen.getByLabelText(/document type/i);
      await userEvent.selectOptions(docTypeSelect, 'coi');

      expect(onFiltersChange).toHaveBeenCalledWith({
        docType: 'coi',
      });
    });

    it('calls onFiltersChange when status filter is selected', async () => {
      const onFiltersChange = vi.fn();
      render(
        <DocumentFilterPanel
          {...defaultProps}
          onFiltersChange={onFiltersChange}
        />
      );

      const statusSelect = screen.getByLabelText(/status/i);
      await userEvent.selectOptions(statusSelect, 'verified');

      expect(onFiltersChange).toHaveBeenCalledWith({
        status: 'verified',
      });
    });

    it('preserves existing filters when adding new filter', async () => {
      const onFiltersChange = vi.fn();
      const existingFilters: DocumentFilterState = {
        clientId: 'client-1',
        docType: 'coi',
      };

      render(
        <DocumentFilterPanel
          {...defaultProps}
          filters={existingFilters}
          onFiltersChange={onFiltersChange}
        />
      );

      const statusSelect = screen.getByLabelText(/status/i);
      await userEvent.selectOptions(statusSelect, 'pending');

      expect(onFiltersChange).toHaveBeenCalledWith({
        clientId: 'client-1',
        docType: 'coi',
        status: 'pending',
      });
    });
  });

  describe('project filtering by client', () => {
    it('shows only projects for selected client', async () => {
      const onFiltersChange = vi.fn();
      const filters: DocumentFilterState = { clientId: 'client-1' };

      render(
        <DocumentFilterPanel
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      );

      const projectSelect = screen.getByLabelText(/project/i);
      // Should show client-1 projects
      expect(projectSelect).toContainHTML('Downtown Office');
      expect(projectSelect).toContainHTML('Highway Bridge');
      // Should not show other client projects
      expect(projectSelect).not.toContainHTML('Residential Complex');
      expect(projectSelect).not.toContainHTML('Shopping Mall');
    });

    it('resets project filter when client changes', async () => {
      const onFiltersChange = vi.fn();
      const filters: DocumentFilterState = {
        clientId: 'client-1',
        projectId: 'proj-1',
      };

      render(
        <DocumentFilterPanel
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      );

      const clientSelect = screen.getByLabelText(/client/i);
      await userEvent.selectOptions(clientSelect, 'client-2');

      expect(onFiltersChange).toHaveBeenCalledWith({
        clientId: 'client-2',
        projectId: undefined,
      });
    });
  });

  describe('clear filters', () => {
    it('does not show clear button when no filters active', () => {
      render(<DocumentFilterPanel {...defaultProps} />);

      expect(screen.queryByText(/clear all/i)).not.toBeInTheDocument();
    });

    it('shows clear button when filters are active', () => {
      const filters: DocumentFilterState = { clientId: 'client-1' };

      render(<DocumentFilterPanel {...defaultProps} filters={filters} />);

      expect(screen.getByText(/clear all/i)).toBeInTheDocument();
    });

    it('calls onFiltersChange with empty object when clear clicked', async () => {
      const onFiltersChange = vi.fn();
      const filters: DocumentFilterState = {
        clientId: 'client-1',
        docType: 'coi',
        status: 'verified',
      };

      render(
        <DocumentFilterPanel
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      );

      const clearButton = screen.getByText(/clear all/i);
      await userEvent.click(clearButton);

      expect(onFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('loading state', () => {
    it('disables all inputs when loading', () => {
      render(<DocumentFilterPanel {...defaultProps} loading={true} />);

      expect(screen.getByLabelText(/client/i)).toBeDisabled();
      expect(screen.getByLabelText(/project/i)).toBeDisabled();
      expect(screen.getByLabelText(/document type/i)).toBeDisabled();
      expect(screen.getByLabelText(/status/i)).toBeDisabled();
    });

    it('shows loading indicator when loading', () => {
      render(<DocumentFilterPanel {...defaultProps} loading={true} />);

      expect(screen.getByText(/updating filters/i)).toBeInTheDocument();
    });

    it('disables clear button when loading', () => {
      const filters: DocumentFilterState = { clientId: 'client-1' };

      render(
        <DocumentFilterPanel {...defaultProps} filters={filters} loading={true} />
      );

      const clearButton = screen.getByText(/clear all/i);
      expect(clearButton).toBeDisabled();
    });
  });

  describe('disabled state', () => {
    it('disables all inputs when disabled', () => {
      render(<DocumentFilterPanel {...defaultProps} disabled={true} />);

      expect(screen.getByLabelText(/client/i)).toBeDisabled();
      expect(screen.getByLabelText(/project/i)).toBeDisabled();
      expect(screen.getByLabelText(/document type/i)).toBeDisabled();
      expect(screen.getByLabelText(/status/i)).toBeDisabled();
    });
  });

  describe('controlled values', () => {
    it('reflects clientId value in dropdown', () => {
      const filters: DocumentFilterState = { clientId: 'client-2' };

      render(<DocumentFilterPanel {...defaultProps} filters={filters} />);

      const clientSelect = screen.getByLabelText(/client/i) as HTMLSelectElement;
      expect(clientSelect.value).toBe('client-2');
    });

    it('reflects projectId value in dropdown', () => {
      const filters: DocumentFilterState = { projectId: 'proj-3' };

      render(<DocumentFilterPanel {...defaultProps} filters={filters} />);

      const projectSelect = screen.getByLabelText(/project/i) as HTMLSelectElement;
      expect(projectSelect.value).toBe('proj-3');
    });

    it('reflects docType value in dropdown', () => {
      const filters: DocumentFilterState = { docType: 'license' };

      render(<DocumentFilterPanel {...defaultProps} filters={filters} />);

      const docTypeSelect = screen.getByLabelText(/document type/i) as HTMLSelectElement;
      expect(docTypeSelect.value).toBe('license');
    });

    it('reflects status value in dropdown', () => {
      const filters: DocumentFilterState = { status: 'expired' };

      render(<DocumentFilterPanel {...defaultProps} filters={filters} />);

      const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement;
      expect(statusSelect.value).toBe('expired');
    });
  });

  describe('filter removal', () => {
    it('removes client filter when "All Clients" selected', async () => {
      const onFiltersChange = vi.fn();
      const filters: DocumentFilterState = { clientId: 'client-1' };

      render(
        <DocumentFilterPanel
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      );

      const clientSelect = screen.getByLabelText(/client/i);
      await userEvent.selectOptions(clientSelect, '');

      expect(onFiltersChange).toHaveBeenCalledWith({
        clientId: undefined,
        projectId: undefined,
      });
    });

    it('removes status filter when "All Statuses" selected', async () => {
      const onFiltersChange = vi.fn();
      const filters: DocumentFilterState = { status: 'verified' };

      render(
        <DocumentFilterPanel
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      );

      const statusSelect = screen.getByLabelText(/status/i);
      await userEvent.selectOptions(statusSelect, '');

      expect(onFiltersChange).toHaveBeenCalledWith({
        status: undefined,
      });
    });
  });
});
