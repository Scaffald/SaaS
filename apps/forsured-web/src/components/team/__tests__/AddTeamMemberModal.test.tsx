/**
 * AddTeamMemberModal tests
 * Team Member Management UI
 * TASK-3: Implement Add Team Member Form with Email Invitation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { AddTeamMemberModal } from '../AddTeamMemberModal';

describe('AddTeamMemberModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset body overflow
    document.body.style.overflow = '';
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<AddTeamMemberModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/invite team member/i)).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<AddTeamMemberModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('modal header', () => {
    it('displays title and description', () => {
      render(<AddTeamMemberModal {...defaultProps} />);

      expect(screen.getByText(/invite team member/i)).toBeInTheDocument();
      expect(screen.getByText(/send an invitation to join your team/i)).toBeInTheDocument();
    });

    it('displays close button', () => {
      render(<AddTeamMemberModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
    });
  });

  describe('close behavior', () => {
    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(<AddTeamMemberModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await userEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop is clicked', async () => {
      const onClose = vi.fn();
      render(<AddTeamMemberModal {...defaultProps} onClose={onClose} />);

      // The backdrop is the outer div with the click handler
      // The modal structure is: backdrop div (with onClick) > modal content div
      // We need to click the backdrop directly, not the dialog inside
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop) {
        // Click the backdrop area (simulating click on the backdrop itself)
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('calls onClose when Escape key is pressed', async () => {
      const onClose = vi.fn();
      render(<AddTeamMemberModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });

    it('does not close on backdrop click when loading', async () => {
      const onClose = vi.fn();
      render(<AddTeamMemberModal {...defaultProps} onClose={onClose} loading={true} />);

      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).not.toHaveBeenCalled();
      }
    });

    it('does not close on Escape when loading', () => {
      const onClose = vi.fn();
      render(<AddTeamMemberModal {...defaultProps} onClose={onClose} loading={true} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('form integration', () => {
    it('renders the AddTeamMemberForm', () => {
      render(<AddTeamMemberModal {...defaultProps} />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('passes onSubmit to form', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AddTeamMemberModal {...defaultProps} onSubmit={onSubmit} />);

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);

      await userEvent.type(nameInput, 'Test User');
      await userEvent.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /send invitation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        });
      });
    });

    it('passes loading state to form', () => {
      render(<AddTeamMemberModal {...defaultProps} loading={true} />);

      expect(screen.getByText(/sending invitation/i)).toBeInTheDocument();
    });

    it('passes existingEmails to form for validation', async () => {
      render(
        <AddTeamMemberModal
          {...defaultProps}
          existingEmails={['existing@example.com']}
        />
      );

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'existing@example.com');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/this email is already on your team/i)).toBeInTheDocument();
      });
    });
  });

  describe('body scroll lock', () => {
    it('disables body scroll when open', () => {
      render(<AddTeamMemberModal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(<AddTeamMemberModal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');

      rerender(<AddTeamMemberModal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('accessibility', () => {
    it('has correct aria attributes', () => {
      render(<AddTeamMemberModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'add-member-modal-title');
    });

    it('has proper heading hierarchy', () => {
      render(<AddTeamMemberModal {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/invite team member/i);
    });
  });

  describe('close button disabled state', () => {
    it('disables close button when loading', () => {
      render(<AddTeamMemberModal {...defaultProps} loading={true} />);

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      expect(closeButton).toBeDisabled();
    });
  });
});
