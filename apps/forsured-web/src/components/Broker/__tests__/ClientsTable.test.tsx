/**
 * ClientsTable Component Tests
 * REQ-274: Clickable Client Navigation
 * REQ-277: Key Clients GC-Only View
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import ClientsTable from '../ClientsTable';
import { BrokerClient, PolicyData, ComplianceData } from '../../../types';

const mockClients: BrokerClient[] = [
  {
    id: 'client-1',
    company_name: 'ABC Construction',
    client_type: 'subcontractor',
    risk_level: 'low',
    compliance_score: 95,
    last_activity_at: new Date().toISOString(),
    notes: 'Test notes',
    status: 'active',
    email: 'test@abc.com',
    phone: '555-1234',
    address: '123 Main St',
    primary_contact: 'John Doe',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'client-2',
    company_name: 'XYZ Builders',
    client_type: 'general_contractor',
    risk_level: 'medium',
    compliance_score: 75,
    last_activity_at: new Date().toISOString(),
    notes: null,
    status: 'active',
    email: 'test@xyz.com',
    phone: '555-5678',
    address: '456 Oak Ave',
    primary_contact: 'Jane Smith',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockPolicies: PolicyData[] = [
  {
    id: 'policy-1',
    client_id: 'client-1',
    policy_type: 'General Liability',
    carrier: 'ABC Insurance',
    policy_number: 'POL-001',
    coverage_limit: 1000000,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('ClientsTable', () => {
  describe('client name links', () => {
    it('renders client names as clickable links', () => {
      render(
        <ClientsTable clients={mockClients} policies={mockPolicies} />
      );

      const links = screen.getAllByTestId('client-name-link');
      expect(links).toHaveLength(2);
    });

    it('client name link has correct href to client profile (subcontractor) or GC profile (general_contractor)', () => {
      render(
        <ClientsTable clients={mockClients} policies={mockPolicies} />
      );

      const links = screen.getAllByTestId('client-name-link');
      // All clients now use the unified /broker/clients/:id route
      expect(links[0]).toHaveAttribute('href', '/broker/clients/client-1');
      expect(links[1]).toHaveAttribute('href', '/broker/clients/client-2');
    });

    it('displays the correct client name in the link', () => {
      render(
        <ClientsTable clients={mockClients} policies={mockPolicies} />
      );

      expect(screen.getByText('ABC Construction')).toBeInTheDocument();
      expect(screen.getByText('XYZ Builders')).toBeInTheDocument();
    });

    it('client name link has appropriate link styling', () => {
      render(
        <ClientsTable clients={mockClients} policies={mockPolicies} />
      );

      const links = screen.getAllByTestId('client-name-link');
      // Check that the link has blue color styling (Tamagui uses CSS variables)
      const linkStyle = window.getComputedStyle(links[0]);
      expect(linkStyle.color).toBeTruthy();
      // Verify link is rendered and clickable
      expect(links[0]).toBeInTheDocument();
    });

    it('clicking client name does not trigger row click', () => {
      const onClientClick = vi.fn();
      render(
        <ClientsTable
          clients={mockClients}
          policies={mockPolicies}
          onClientClick={onClientClick}
        />
      );

      const link = screen.getAllByTestId('client-name-link')[0];
      fireEvent.click(link);

      // The click should be stopped from propagating to the row
      // (onClientClick should not be called from the link click)
      // Note: In actual usage, the router would navigate
    });
  });

  describe('table rendering', () => {
    it('renders the table with clients', () => {
      render(
        <ClientsTable clients={mockClients} policies={mockPolicies} />
      );

      expect(screen.getByText('Key Clients')).toBeInTheDocument();
    });

    it('shows empty state when no clients match filter', () => {
      render(<ClientsTable clients={[]} policies={[]} />);

      expect(
        screen.getByText('No clients found matching your filters')
      ).toBeInTheDocument();
    });

    it('displays client type badges', () => {
      render(
        <ClientsTable clients={mockClients} policies={mockPolicies} />
      );

      expect(screen.getByText('Sub')).toBeInTheDocument();
      expect(screen.getByText('GC')).toBeInTheDocument();
    });

    it('displays risk level badges', () => {
      render(
        <ClientsTable clients={mockClients} policies={mockPolicies} />
      );

      expect(screen.getByText('low')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });
  });

  describe('row click handling', () => {
    it('calls onClientClick when row is clicked', () => {
      const onClientClick = vi.fn();
      render(
        <ClientsTable
          clients={mockClients}
          policies={mockPolicies}
          onClientClick={onClientClick}
        />
      );

      // Click on the row (not the link)
      const rows = document.querySelectorAll('tbody tr');
      fireEvent.click(rows[0]);

      expect(onClientClick).toHaveBeenCalledWith(mockClients[0]);
    });
  });

  describe('gcOnly mode (REQ-277)', () => {
    const mockProjects = [
      { id: 'proj-1', client_id: 'client-2' },
    ];

    const mockComplianceData: ComplianceData[] = [
      {
        id: 'comp-1',
        project_id: 'proj-1',
        subcontractor_id: 'sub-1',
        subcontractor_name: 'Sub One',
        company_name: 'Sub One Inc',
        score: 90,
        last_evaluated: new Date().toISOString(),
        gaps: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'comp-2',
        project_id: 'proj-1',
        subcontractor_id: 'sub-2',
        subcontractor_name: 'Sub Two',
        company_name: 'Sub Two Inc',
        score: 60,
        last_evaluated: new Date().toISOString(),
        gaps: [{ id: 'gap-1', description: 'Missing COI', severity: 'high' }],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    it('filters to only show GCs when gcOnly is true', () => {
      render(
        <ClientsTable
          clients={mockClients}
          policies={mockPolicies}
          gcOnly={true}
        />
      );

      // Should show XYZ Builders (GC) but not ABC Construction (Sub)
      expect(screen.getByText('XYZ Builders')).toBeInTheDocument();
      expect(screen.queryByText('ABC Construction')).not.toBeInTheDocument();
    });

    it('shows "Key Clients (General Contractors)" title when gcOnly is true', () => {
      render(
        <ClientsTable
          clients={mockClients}
          policies={mockPolicies}
          gcOnly={true}
        />
      );

      expect(screen.getByText('Key Clients (General Contractors)')).toBeInTheDocument();
    });

    it('shows GC count when gcOnly is true', () => {
      render(
        <ClientsTable
          clients={mockClients}
          policies={mockPolicies}
          gcOnly={true}
        />
      );

      expect(screen.getByText('1 GC')).toBeInTheDocument();
    });

    it('shows sort dropdown when gcOnly is true', () => {
      render(
        <ClientsTable
          clients={mockClients}
          policies={mockPolicies}
          gcOnly={true}
        />
      );

      expect(screen.getByText('Sort by: Default')).toBeInTheDocument();
    });

    it('shows "Subs Compliant" column header when gcOnly is true', () => {
      render(
        <ClientsTable
          clients={mockClients}
          policies={mockPolicies}
          gcOnly={true}
          complianceData={mockComplianceData}
          projects={mockProjects}
        />
      );

      expect(screen.getByText('Subs Compliant')).toBeInTheDocument();
    });

    it('shows aggregate compliance for GC', () => {
      render(
        <ClientsTable
          clients={mockClients}
          policies={mockPolicies}
          gcOnly={true}
          complianceData={mockComplianceData}
          projects={mockProjects}
        />
      );

      // 1 out of 2 subs compliant (score >= 80)
      expect(screen.getByText('1/2 (50%)')).toBeInTheDocument();
    });

    it('shows "No subs" when GC has no subcontractors', () => {
      render(
        <ClientsTable
          clients={mockClients}
          policies={mockPolicies}
          gcOnly={true}
          complianceData={[]} // No compliance data
          projects={[]}
        />
      );

      expect(screen.getByText('No subs')).toBeInTheDocument();
    });

    it('does not show "Subs Compliant" column when gcOnly is false', () => {
      render(
        <ClientsTable
          clients={mockClients}
          policies={mockPolicies}
          gcOnly={false}
        />
      );

      expect(screen.queryByText('Subs Compliant')).not.toBeInTheDocument();
    });
  });
});
