/**
 * ClientsDropdown Component Tests
 * REQ-278: Clients Dropdown Rename & Quick Jump
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithoutRouter, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ClientsDropdown from '../ClientsDropdown';
import { BrokerClient } from '../../../types';

// Mock navigate
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock clients data
const mockClients: BrokerClient[] = [
  {
    id: 'gc-1',
    company_name: 'ABC General Contractors',
    client_type: 'general_contractor',
    risk_level: 'low',
    compliance_score: 92,
    last_activity_at: new Date().toISOString(),
    notes: null,
    status: 'active',
    email: 'contact@abcgc.com',
    phone: '555-1234',
    address: '123 Main St',
    primary_contact: 'John Smith',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'gc-2',
    company_name: 'XYZ Builders',
    client_type: 'general_contractor',
    risk_level: 'medium',
    compliance_score: 75,
    last_activity_at: new Date().toISOString(),
    notes: null,
    status: 'active',
    email: 'contact@xyzbuilders.com',
    phone: '555-5678',
    address: '456 Oak Ave',
    primary_contact: 'Jane Doe',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sub-1',
    company_name: 'Plumbing Pros',
    client_type: 'subcontractor',
    risk_level: 'low',
    compliance_score: 88,
    last_activity_at: new Date().toISOString(),
    notes: null,
    status: 'active',
    email: 'contact@plumbingpros.com',
    phone: '555-9999',
    address: '789 Elm St',
    primary_contact: 'Bob Wilson',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sub-2',
    company_name: 'Electric Solutions',
    client_type: 'subcontractor',
    risk_level: 'high',
    compliance_score: 45,
    last_activity_at: new Date().toISOString(),
    notes: null,
    status: 'active',
    email: 'contact@electricsolutions.com',
    phone: '555-0000',
    address: '321 Pine Rd',
    primary_contact: 'Alice Brown',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock useClients hook
vi.mock('../../../hooks/useClients', () => ({
  useClients: vi.fn(() => ({
    clients: mockClients,
    loading: false,
    error: null,
  })),
}));

const renderDropdown = () => {
  return renderWithoutRouter(
    <MemoryRouter>
      <ClientsDropdown />
    </MemoryRouter>
  );
};

describe('ClientsDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the dropdown trigger button', () => {
      renderDropdown();
      expect(screen.getByTestId('clients-dropdown-trigger')).toBeInTheDocument();
      expect(screen.getByText('Clients')).toBeInTheDocument();
    });

    it('dropdown is closed by default', () => {
      renderDropdown();
      expect(screen.queryByTestId('clients-dropdown-menu')).not.toBeInTheDocument();
    });
  });

  describe('dropdown interaction', () => {
    it('opens dropdown when trigger is clicked', async () => {
      renderDropdown();

      const trigger = screen.getByTestId('clients-dropdown-trigger');
      await userEvent.click(trigger);

      expect(screen.getByTestId('clients-dropdown-menu')).toBeInTheDocument();
    });

    it('closes dropdown when trigger is clicked again', async () => {
      renderDropdown();

      const trigger = screen.getByTestId('clients-dropdown-trigger');
      await userEvent.click(trigger); // Open
      await userEvent.click(trigger); // Close

      expect(screen.queryByTestId('clients-dropdown-menu')).not.toBeInTheDocument();
    });

    it('shows search input when dropdown is open', async () => {
      renderDropdown();

      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      // TextInput renders with placeholder - use that to find the input
      expect(screen.getByPlaceholderText('Search clients...')).toBeInTheDocument();
    });
  });

  describe('client list', () => {
    it('shows General Contractors section', async () => {
      renderDropdown();
      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      expect(screen.getByText(/General Contractors \(2\)/i)).toBeInTheDocument();
    });

    it('shows Subcontractors section', async () => {
      renderDropdown();
      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      expect(screen.getByText(/Subcontractors \(2\)/i)).toBeInTheDocument();
    });

    it('displays client names', async () => {
      renderDropdown();
      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      expect(screen.getByText('ABC General Contractors')).toBeInTheDocument();
      expect(screen.getByText('XYZ Builders')).toBeInTheDocument();
      expect(screen.getByText('Plumbing Pros')).toBeInTheDocument();
      expect(screen.getByText('Electric Solutions')).toBeInTheDocument();
    });

    it('displays compliance score badges', async () => {
      renderDropdown();
      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      expect(screen.getByTestId('compliance-badge-gc-1')).toHaveTextContent('92%');
      expect(screen.getByTestId('compliance-badge-gc-2')).toHaveTextContent('75%');
      expect(screen.getByTestId('compliance-badge-sub-1')).toHaveTextContent('88%');
      expect(screen.getByTestId('compliance-badge-sub-2')).toHaveTextContent('45%');
    });
  });

  describe('search functionality', () => {
    it('filters clients by company name', async () => {
      renderDropdown();
      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      const searchInput = screen.getByPlaceholderText('Search clients...');
      await userEvent.type(searchInput, 'ABC');

      expect(screen.getByText('ABC General Contractors')).toBeInTheDocument();
      expect(screen.queryByText('XYZ Builders')).not.toBeInTheDocument();
      expect(screen.queryByText('Plumbing Pros')).not.toBeInTheDocument();
    });

    it('filters clients by primary contact', async () => {
      renderDropdown();
      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      const searchInput = screen.getByPlaceholderText('Search clients...');
      await userEvent.type(searchInput, 'Bob');

      expect(screen.getByText('Plumbing Pros')).toBeInTheDocument();
      expect(screen.queryByText('ABC General Contractors')).not.toBeInTheDocument();
    });

    it('shows "No clients found" when search has no results', async () => {
      renderDropdown();
      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      const searchInput = screen.getByPlaceholderText('Search clients...');
      await userEvent.type(searchInput, 'NonExistent');

      expect(screen.getByText('No clients found')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('navigates to GC profile when GC is clicked', async () => {
      renderDropdown();
      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      const gcItem = screen.getByTestId('client-item-gc-1');
      await userEvent.click(gcItem);

      expect(mockNavigate).toHaveBeenCalledWith('/broker/gcs/gc-1');
    });

    it('navigates to subcontractor profile when sub is clicked', async () => {
      renderDropdown();
      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      const subItem = screen.getByTestId('client-item-sub-1');
      await userEvent.click(subItem);

      expect(mockNavigate).toHaveBeenCalledWith('/broker/clients/sub-1');
    });

    it('navigates to clients page when View All Clients is clicked', async () => {
      renderDropdown();
      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      const viewAllBtn = screen.getByText('View All Clients');
      await userEvent.click(viewAllBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/broker/clients');
    });

    it('closes dropdown after navigation', async () => {
      renderDropdown();
      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      const gcItem = screen.getByTestId('client-item-gc-1');
      await userEvent.click(gcItem);

      expect(screen.queryByTestId('clients-dropdown-menu')).not.toBeInTheDocument();
    });
  });

  describe('compliance badge colors', () => {
    it('shows green badge for high compliance (>=80)', async () => {
      renderDropdown();
      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      const badge = screen.getByTestId('compliance-badge-gc-1'); // 92%
      // Tamagui uses different class naming - check the badge renders with green styling
      expect(badge).toBeInTheDocument();
      expect(badge.className).toMatch(/green|success/i);
    });

    it('shows yellow badge for medium compliance (50-79)', async () => {
      renderDropdown();
      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      const badge = screen.getByTestId('compliance-badge-gc-2'); // 75%
      // Tamagui uses different class naming - check the badge renders with yellow styling
      expect(badge).toBeInTheDocument();
      expect(badge.className).toMatch(/yellow|warning/i);
    });

    it('shows red badge for low compliance (<50)', async () => {
      renderDropdown();
      await userEvent.click(screen.getByTestId('clients-dropdown-trigger'));

      const badge = screen.getByTestId('compliance-badge-sub-2'); // 45%
      // Tamagui uses different class naming - check the badge renders with red styling
      expect(badge).toBeInTheDocument();
      expect(badge.className).toMatch(/red|error/i);
    });
  });
});
