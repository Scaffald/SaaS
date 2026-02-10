/**
 * Task Management Workflow & UI
 * Tests for TaskAssignment component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { TaskAssignment } from '../TaskAssignment';
import { User } from '../../../types';

const mockUsers: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'manager', company: 'ACME Corp', created_at: '2024-01-01' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'broker', company: 'ACME Corp', created_at: '2024-01-01' },
  { id: '3', name: 'Carol White', email: 'carol@example.com', role: 'subcontractor', company: 'Sub Corp', created_at: '2024-01-01' },
];

describe('TaskAssignment', () => {
  let mockOnAssign: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnAssign = vi.fn();
  });

  describe('User Selection', () => {
    it('should render user picker button', () => {
      render(<TaskAssignment users={mockUsers} onAssign={mockOnAssign} />);
      expect(screen.getByRole('button', { name: /assign/i })).toBeTruthy();
    });

    it('should show dropdown when button is clicked', async () => {
      render(<TaskAssignment users={mockUsers} onAssign={mockOnAssign} />);
      const button = screen.getByRole('button', { name: /assign/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeTruthy();
        expect(screen.getByText('Bob Smith')).toBeTruthy();
        expect(screen.getByText('Carol White')).toBeTruthy();
      });
    });

    it('should call onAssign when user is selected', async () => {
      render(<TaskAssignment users={mockUsers} onAssign={mockOnAssign} />);
      const button = screen.getByRole('button', { name: /assign/i });
      fireEvent.click(button);

      await waitFor(() => {
        const userOption = screen.getByText('Alice Johnson');
        fireEvent.click(userOption);
      });

      expect(mockOnAssign).toHaveBeenCalledWith('1');
    });

    it('should close dropdown after selection', async () => {
      render(<TaskAssignment users={mockUsers} onAssign={mockOnAssign} />);
      const button = screen.getByRole('button', { name: /assign/i });
      fireEvent.click(button);

      const userOption = await screen.findByText('Alice Johnson');
      fireEvent.click(userOption);

      await waitFor(() => {
        expect(screen.queryByText('Bob Smith')).toBeNull();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should render search input when dropdown is open', async () => {
      render(<TaskAssignment users={mockUsers} onAssign={mockOnAssign} />);
      fireEvent.click(screen.getByRole('button', { name: /assign/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search users/i)).toBeTruthy();
      });
    });

    it('should filter users by name', async () => {
      render(<TaskAssignment users={mockUsers} onAssign={mockOnAssign} />);
      fireEvent.click(screen.getByRole('button', { name: /assign/i }));

      const searchInput = await screen.findByPlaceholderText(/search users/i);
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeTruthy();
        expect(screen.queryByText('Bob Smith')).toBeNull();
      });
    });

    it('should filter users by email', async () => {
      render(<TaskAssignment users={mockUsers} onAssign={mockOnAssign} />);
      fireEvent.click(screen.getByRole('button', { name: /assign/i }));

      const searchInput = await screen.findByPlaceholderText(/search users/i);
      fireEvent.change(searchInput, { target: { value: 'bob@' } });

      await waitFor(() => {
        expect(screen.queryByText('Alice Johnson')).toBeNull();
        expect(screen.getByText('Bob Smith')).toBeTruthy();
      });
    });

    it('should show "No users found" when no matches', async () => {
      render(<TaskAssignment users={mockUsers} onAssign={mockOnAssign} />);
      fireEvent.click(screen.getByRole('button', { name: /assign/i }));

      const searchInput = await screen.findByPlaceholderText(/search users/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeTruthy();
      });
    });
  });

  describe('Current Assignment Display', () => {
    it('should show assigned user name when provided', () => {
      render(
        <TaskAssignment
          users={mockUsers}
          assignedUserId="1"
          onAssign={mockOnAssign}
        />
      );
      expect(screen.getByText(/alice johnson/i)).toBeTruthy();
    });

    it('should show "Unassigned" when no user assigned', () => {
      render(<TaskAssignment users={mockUsers} onAssign={mockOnAssign} />);
      expect(screen.getByText(/unassigned/i)).toBeTruthy();
    });

    it('should show "Reassign" button when user is already assigned', () => {
      render(
        <TaskAssignment
          users={mockUsers}
          assignedUserId="1"
          onAssign={mockOnAssign}
        />
      );
      expect(screen.getByRole('button', { name: /reassign/i })).toBeTruthy();
    });
  });

  describe('Role-based Filtering', () => {
    it('should filter users by allowed roles when specified', async () => {
      render(
        <TaskAssignment
          users={mockUsers}
          onAssign={mockOnAssign}
          allowedRoles={['manager', 'broker']}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /assign/i }));

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeTruthy();
        expect(screen.getByText('Bob Smith')).toBeTruthy();
        expect(screen.queryByText('Carol White')).toBeNull();
      });
    });

    it('should show all users when no role filter specified', async () => {
      render(<TaskAssignment users={mockUsers} onAssign={mockOnAssign} />);
      fireEvent.click(screen.getByRole('button', { name: /assign/i }));

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeTruthy();
        expect(screen.getByText('Bob Smith')).toBeTruthy();
        expect(screen.getByText('Carol White')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TaskAssignment users={mockUsers} onAssign={mockOnAssign} />);
      const button = screen.getByRole('button', { name: /assign/i });
      expect(button.getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('should support keyboard navigation', async () => {
      render(<TaskAssignment users={mockUsers} onAssign={mockOnAssign} />);
      const button = screen.getByRole('button', { name: /assign/i });

      // Open with Enter
      fireEvent.keyDown(button, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeTruthy();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      render(
        <TaskAssignment
          users={mockUsers}
          onAssign={mockOnAssign}
          loading={true}
        />
      );
      // Check for loading text (may appear multiple times, so use queryAllByText)
      const loadingTexts = screen.queryAllByText(/loading/i);
      expect(loadingTexts.length).toBeGreaterThan(0);
    });

    it('should disable button when loading', () => {
      render(
        <TaskAssignment
          users={mockUsers}
          onAssign={mockOnAssign}
          loading={true}
        />
      );
      const button = screen.getByRole('button');
      expect(button.getAttribute('disabled')).toBe('');
    });
  });

  describe('Empty State', () => {
    it('should handle empty user list gracefully', async () => {
      render(<TaskAssignment users={[]} onAssign={mockOnAssign} />);
      fireEvent.click(screen.getByRole('button', { name: /assign/i }));

      await waitFor(() => {
        expect(screen.getByText(/no users available/i)).toBeTruthy();
      });
    });
  });
});
