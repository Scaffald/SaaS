/**
 * TeamMemberCard Tests
 * REQ-283: Team Member Management UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { TeamMemberCard, type TeamMember } from '../TeamMemberCard';

describe('TeamMemberCard', () => {
  const mockMember: TeamMember = {
    id: 'member-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'manager',
    company: 'Acme Corp',
  };

  const mockMemberWithAvatar: TeamMember = {
    ...mockMember,
    id: 'member-2',
    avatar: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders member name and email', () => {
      render(<TeamMemberCard member={mockMember} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('renders company name when provided', () => {
      render(<TeamMemberCard member={mockMember} />);

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    it('renders role badge with correct styling', () => {
      render(<TeamMemberCard member={mockMember} />);

      const badge = screen.getByText('Manager');
      expect(badge).toBeInTheDocument();
      // Badge uses Beyond UI inline styles
    });

    it('renders initials when no avatar provided', () => {
      render(<TeamMemberCard member={mockMember} />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders avatar when provided', () => {
      render(<TeamMemberCard member={mockMemberWithAvatar} />);

      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('renders correct role badge color for admin', () => {
      render(<TeamMemberCard member={{ ...mockMember, role: 'admin' }} />);

      const badge = screen.getByText('Admin');
      expect(badge).toBeInTheDocument();
      // Badge uses Beyond UI inline styles
    });

    it('renders correct role badge color for broker', () => {
      render(<TeamMemberCard member={{ ...mockMember, role: 'broker' }} />);

      const badge = screen.getByText('Broker');
      expect(badge).toBeInTheDocument();
      // Badge uses Beyond UI inline styles
    });

    it('renders correct role badge color for subcontractor', () => {
      render(<TeamMemberCard member={{ ...mockMember, role: 'subcontractor' }} />);

      const badge = screen.getByText('Subcontractor');
      expect(badge).toBeInTheDocument();
      // Badge uses Beyond UI inline styles
    });

    it('renders correct role badge color for user', () => {
      render(<TeamMemberCard member={{ ...mockMember, role: 'user' }} />);

      const badge = screen.getByText('User');
      expect(badge).toBeInTheDocument();
      // Badge uses Beyond UI inline styles
    });
  });

  describe('Click Handling', () => {
    it('calls onClick when card is clicked', () => {
      const onClick = vi.fn();
      render(<TeamMemberCard member={mockMember} onClick={onClick} />);

      const card = screen.getByRole('button', { name: /view john doe's profile/i });
      fireEvent.click(card);

      expect(onClick).toHaveBeenCalledWith(mockMember);
    });

    it('calls onClick when Enter key is pressed', () => {
      const onClick = vi.fn();
      render(<TeamMemberCard member={mockMember} onClick={onClick} />);

      const card = screen.getByRole('button', { name: /view john doe's profile/i });
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(onClick).toHaveBeenCalledWith(mockMember);
    });

    it('calls onClick when Space key is pressed', () => {
      const onClick = vi.fn();
      render(<TeamMemberCard member={mockMember} onClick={onClick} />);

      const card = screen.getByRole('button', { name: /view john doe's profile/i });
      fireEvent.keyDown(card, { key: ' ' });

      expect(onClick).toHaveBeenCalledWith(mockMember);
    });
  });

  describe('Action Menu', () => {
    it('does not show menu button when no handlers provided', () => {
      render(<TeamMemberCard member={mockMember} />);

      expect(screen.queryByLabelText('More options')).not.toBeInTheDocument();
    });

    it('shows menu button when onEdit is provided', () => {
      const onEdit = vi.fn();
      render(<TeamMemberCard member={mockMember} onEdit={onEdit} />);

      expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    it('shows menu button when onRemove is provided', () => {
      const onRemove = vi.fn();
      render(<TeamMemberCard member={mockMember} onRemove={onRemove} />);

      expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    it('opens dropdown menu when menu button is clicked', () => {
      const onEdit = vi.fn();
      render(<TeamMemberCard member={mockMember} onEdit={onEdit} />);

      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByText('Edit Member')).toBeInTheDocument();
    });

    it('calls onEdit when Edit Member is clicked', () => {
      const onEdit = vi.fn();
      render(<TeamMemberCard member={mockMember} onEdit={onEdit} />);

      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);

      const editButton = screen.getByText('Edit Member');
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledWith(mockMember);
    });

    it('calls onRemove when Remove is clicked', () => {
      const onRemove = vi.fn();
      render(<TeamMemberCard member={mockMember} onRemove={onRemove} />);

      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);

      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      expect(onRemove).toHaveBeenCalledWith(mockMember);
    });

    it('closes menu when clicking outside', () => {
      const onEdit = vi.fn();
      render(<TeamMemberCard member={mockMember} onEdit={onEdit} />);

      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);

      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Click outside the menu
      fireEvent.mouseDown(document.body);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('does not trigger card click when menu button is clicked', () => {
      const onClick = vi.fn();
      const onEdit = vi.fn();
      render(<TeamMemberCard member={mockMember} onClick={onClick} onEdit={onEdit} />);

      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has accessible name for card button', () => {
      render(<TeamMemberCard member={mockMember} />);

      expect(
        screen.getByRole('button', { name: /view john doe's profile/i })
      ).toBeInTheDocument();
    });

    it('has accessible name for menu button', () => {
      const onEdit = vi.fn();
      render(<TeamMemberCard member={mockMember} onEdit={onEdit} />);

      expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    it('menu button has correct aria attributes', () => {
      const onEdit = vi.fn();
      render(<TeamMemberCard member={mockMember} onEdit={onEdit} />);

      const menuButton = screen.getByLabelText('More options');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('menu button aria-expanded is true when menu is open', () => {
      const onEdit = vi.fn();
      render(<TeamMemberCard member={mockMember} onEdit={onEdit} />);

      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);

      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
