/**
 * TeamMembersList Tests
 * Team Member Management UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { TeamMembersList } from '../TeamMembersList';
import type { TeamMember } from '../TeamMemberCard';

describe('TeamMembersList', () => {
  const mockMembers: TeamMember[] = [
    {
      id: 'member-1',
      name: 'Alice Admin',
      email: 'alice@example.com',
      role: 'admin',
      company: 'Acme Corp',
    },
    {
      id: 'member-2',
      name: 'Bob Broker',
      email: 'bob@example.com',
      role: 'broker',
      company: 'Insurance Inc',
    },
    {
      id: 'member-3',
      name: 'Carol Contractor',
      email: 'carol@example.com',
      role: 'subcontractor',
      company: 'Construction Co',
    },
    {
      id: 'member-4',
      name: 'David Manager',
      email: 'david@example.com',
      role: 'manager',
      company: 'Acme Corp',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all members in the list', () => {
      render(<TeamMembersList members={mockMembers} />);

      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.getByText('Bob Broker')).toBeInTheDocument();
      expect(screen.getByText('Carol Contractor')).toBeInTheDocument();
      expect(screen.getByText('David Manager')).toBeInTheDocument();
    });

    it('renders correct member count', () => {
      render(<TeamMembersList members={mockMembers} />);

      expect(screen.getByText('4 members found')).toBeInTheDocument();
    });

    it('renders singular form for one member', () => {
      render(<TeamMembersList members={[mockMembers[0]]} />);

      expect(screen.getByText('1 member found')).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(<TeamMembersList members={mockMembers} />);

      expect(
        screen.getByPlaceholderText('Search by name, email, or company...')
      ).toBeInTheDocument();
    });

    it('renders role filter dropdown', () => {
      render(<TeamMembersList members={mockMembers} />);

      expect(screen.getByRole('combobox', { name: /filter by role/i })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      const { container } = render(<TeamMembersList members={[]} loading={true} />);

      // Should show skeleton cards (using Beyond UI styling)
      // The skeleton renders div elements with backgroundColor
      const skeletonElements = container.querySelectorAll('div');
      // Should have multiple divs for the skeleton structure
      expect(skeletonElements.length).toBeGreaterThan(5);
    });

    it('does not show members when loading', () => {
      render(<TeamMembersList members={mockMembers} loading={true} />);

      expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no members', () => {
      render(<TeamMembersList members={[]} />);

      expect(screen.getByText('No team members found')).toBeInTheDocument();
      expect(
        screen.getByText('Get started by inviting team members')
      ).toBeInTheDocument();
    });

    it('shows filter-specific empty state when filters applied', () => {
      render(<TeamMembersList members={[]} />);

      // Apply search filter
      const searchInput = screen.getByPlaceholderText('Search by name, email, or company...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No team members found')).toBeInTheDocument();
      expect(
        screen.getByText('Try adjusting your search or filters')
      ).toBeInTheDocument();
    });
  });

  describe('Client-Side Search', () => {
    it('filters members by name', () => {
      render(<TeamMembersList members={mockMembers} />);

      const searchInput = screen.getByPlaceholderText('Search by name, email, or company...');
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.queryByText('Bob Broker')).not.toBeInTheDocument();
      expect(screen.getByText('1 member found')).toBeInTheDocument();
    });

    it('filters members by email', () => {
      render(<TeamMembersList members={mockMembers} />);

      const searchInput = screen.getByPlaceholderText('Search by name, email, or company...');
      fireEvent.change(searchInput, { target: { value: 'bob@example' } });

      expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument();
      expect(screen.getByText('Bob Broker')).toBeInTheDocument();
    });

    it('filters members by company', () => {
      render(<TeamMembersList members={mockMembers} />);

      const searchInput = screen.getByPlaceholderText('Search by name, email, or company...');
      fireEvent.change(searchInput, { target: { value: 'Acme' } });

      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.getByText('David Manager')).toBeInTheDocument();
      expect(screen.queryByText('Bob Broker')).not.toBeInTheDocument();
      expect(screen.getByText('2 members found')).toBeInTheDocument();
    });

    it('search is case insensitive', () => {
      render(<TeamMembersList members={mockMembers} />);

      const searchInput = screen.getByPlaceholderText('Search by name, email, or company...');
      fireEvent.change(searchInput, { target: { value: 'ALICE' } });

      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });
  });

  describe('Client-Side Role Filter', () => {
    it('filters members by admin role', () => {
      render(<TeamMembersList members={mockMembers} />);

      const roleSelect = screen.getByRole('combobox', { name: /filter by role/i });
      fireEvent.change(roleSelect, { target: { value: 'admin' } });

      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.queryByText('Bob Broker')).not.toBeInTheDocument();
      expect(screen.getByText('1 member found')).toBeInTheDocument();
    });

    it('filters members by broker role', () => {
      render(<TeamMembersList members={mockMembers} />);

      const roleSelect = screen.getByRole('combobox', { name: /filter by role/i });
      fireEvent.change(roleSelect, { target: { value: 'broker' } });

      expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument();
      expect(screen.getByText('Bob Broker')).toBeInTheDocument();
    });

    it('shows all members when "all" role selected', () => {
      render(<TeamMembersList members={mockMembers} />);

      const roleSelect = screen.getByRole('combobox', { name: /filter by role/i });

      // First filter by admin
      fireEvent.change(roleSelect, { target: { value: 'admin' } });
      expect(screen.getByText('1 member found')).toBeInTheDocument();

      // Then select all
      fireEvent.change(roleSelect, { target: { value: 'all' } });
      expect(screen.getByText('4 members found')).toBeInTheDocument();
    });
  });

  describe('Clear Filters', () => {
    it('shows clear filters button when search is active', () => {
      render(<TeamMembersList members={mockMembers} />);

      const searchInput = screen.getByPlaceholderText('Search by name, email, or company...');
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });

    it('shows clear filters button when role filter is active', () => {
      render(<TeamMembersList members={mockMembers} />);

      const roleSelect = screen.getByRole('combobox', { name: /filter by role/i });
      fireEvent.change(roleSelect, { target: { value: 'admin' } });

      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });

    it('clears all filters when clear filters is clicked', () => {
      render(<TeamMembersList members={mockMembers} />);

      // Apply both filters
      const searchInput = screen.getByPlaceholderText('Search by name, email, or company...');
      const roleSelect = screen.getByRole('combobox', { name: /filter by role/i });

      fireEvent.change(searchInput, { target: { value: 'Alice' } });
      fireEvent.change(roleSelect, { target: { value: 'admin' } });

      expect(screen.getByText('1 member found')).toBeInTheDocument();

      // Clear filters
      fireEvent.click(screen.getByText('Clear filters'));

      expect(screen.getByText('4 members found')).toBeInTheDocument();
      expect(searchInput).toHaveValue('');
      expect(roleSelect).toHaveValue('all');
    });

    it('does not show clear filters button when no filters active', () => {
      render(<TeamMembersList members={mockMembers} />);

      expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
    });
  });

  describe('Server-Side Callbacks', () => {
    it('calls onSearch when search input changes', () => {
      const onSearch = vi.fn();
      render(<TeamMembersList members={mockMembers} onSearch={onSearch} />);

      const searchInput = screen.getByPlaceholderText('Search by name, email, or company...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(onSearch).toHaveBeenCalledWith('test');
    });

    it('calls onRoleFilter when role filter changes', () => {
      const onRoleFilter = vi.fn();
      render(<TeamMembersList members={mockMembers} onRoleFilter={onRoleFilter} />);

      const roleSelect = screen.getByRole('combobox', { name: /filter by role/i });
      fireEvent.change(roleSelect, { target: { value: 'admin' } });

      expect(onRoleFilter).toHaveBeenCalledWith('admin');
    });

    it('does not apply client-side filtering when server-side callbacks provided', () => {
      const onSearch = vi.fn();
      const onRoleFilter = vi.fn();
      render(
        <TeamMembersList
          members={mockMembers}
          onSearch={onSearch}
          onRoleFilter={onRoleFilter}
        />
      );

      // Even with search input, all members should be shown
      // because filtering is handled server-side
      const searchInput = screen.getByPlaceholderText('Search by name, email, or company...');
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      // All members still visible (server would filter)
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.getByText('Bob Broker')).toBeInTheDocument();
      expect(screen.getByText('4 members found')).toBeInTheDocument();
    });
  });

  describe('Member Interactions', () => {
    it('calls onMemberClick when member card is clicked', () => {
      const onMemberClick = vi.fn();
      render(<TeamMembersList members={mockMembers} onMemberClick={onMemberClick} />);

      const aliceCard = screen.getByRole('button', { name: /view alice admin's profile/i });
      fireEvent.click(aliceCard);

      expect(onMemberClick).toHaveBeenCalledWith(mockMembers[0]);
    });

    it('calls onMemberEdit when edit is clicked', () => {
      const onMemberEdit = vi.fn();
      render(<TeamMembersList members={mockMembers} onMemberEdit={onMemberEdit} />);

      // Open menu for first member
      const menuButtons = screen.getAllByLabelText('More options');
      fireEvent.click(menuButtons[0]);

      // Click edit
      const editButton = screen.getByText('Edit Member');
      fireEvent.click(editButton);

      expect(onMemberEdit).toHaveBeenCalledWith(mockMembers[0]);
    });

    it('calls onMemberRemove when remove is clicked', () => {
      const onMemberRemove = vi.fn();
      render(<TeamMembersList members={mockMembers} onMemberRemove={onMemberRemove} />);

      // Open menu for first member
      const menuButtons = screen.getAllByLabelText('More options');
      fireEvent.click(menuButtons[0]);

      // Click remove
      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      expect(onMemberRemove).toHaveBeenCalledWith(mockMembers[0]);
    });
  });

  describe('Accessibility', () => {
    it('has accessible search input', () => {
      render(<TeamMembersList members={mockMembers} />);

      const searchInput = screen.getByPlaceholderText('Search by name, email, or company...');
      expect(searchInput).toBeInTheDocument();
    });

    it('has accessible role filter', () => {
      render(<TeamMembersList members={mockMembers} />);

      expect(screen.getByRole('combobox', { name: /filter by role/i })).toBeInTheDocument();
    });
  });
});
