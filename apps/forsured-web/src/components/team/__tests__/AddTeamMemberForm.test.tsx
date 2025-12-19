/**
 * AddTeamMemberForm tests
 * REQ-283: Team Member Management UI
 * TASK-3: Implement Add Team Member Form with Email Invitation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { AddTeamMemberForm } from '../AddTeamMemberForm';

describe('AddTeamMemberForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all form fields', () => {
      render(<AddTeamMemberForm {...defaultProps} />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByText(/access level/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send invitation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders with default "user" access level selected', () => {
      render(<AddTeamMemberForm {...defaultProps} />);

      // Tamagui Select shows "Member" text for default value "user"
      // The Select displays the label for the selected value
      expect(screen.getByText('Member')).toBeInTheDocument();
    });

    it('renders help text about invitation email', () => {
      render(<AddTeamMemberForm {...defaultProps} />);

      expect(
        screen.getByText(/an invitation email will be sent/i)
      ).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('shows error when email is empty on blur', async () => {
      render(<AddTeamMemberForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format', async () => {
      render(<AddTeamMemberForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('shows error when name is empty on blur', async () => {
      render(<AddTeamMemberForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/full name/i);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('shows error for name less than 2 characters', async () => {
      render(<AddTeamMemberForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/full name/i);
      await userEvent.type(nameInput, 'A');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('shows error for duplicate email', async () => {
      render(
        <AddTeamMemberForm
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

    it('prevents submit with validation errors', async () => {
      const onSubmit = vi.fn();
      render(<AddTeamMemberForm {...defaultProps} onSubmit={onSubmit} />);

      const submitButton = screen.getByRole('button', { name: /send invitation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with form data when valid', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AddTeamMemberForm {...defaultProps} onSubmit={onSubmit} />);

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');

      const submitButton = screen.getByRole('button', { name: /send invitation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          email: 'john@example.com',
          name: 'John Doe',
          role: 'user',
        });
      });
    });

    it('submits with default role when role not changed', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AddTeamMemberForm {...defaultProps} onSubmit={onSubmit} />);

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);

      await userEvent.type(nameInput, 'Jane Admin');
      await userEvent.type(emailInput, 'jane@example.com');

      // Note: Tamagui Select doesn't support userEvent.selectOptions
      // Testing with default role value ('user')
      const submitButton = screen.getByRole('button', { name: /send invitation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          email: 'jane@example.com',
          name: 'Jane Admin',
          role: 'user',
        });
      });
    });

    it('trims whitespace and lowercases email', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AddTeamMemberForm {...defaultProps} onSubmit={onSubmit} />);

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);

      await userEvent.type(nameInput, '  John Doe  ');
      await userEvent.type(emailInput, '  JOHN@Example.COM  ');

      const submitButton = screen.getByRole('button', { name: /send invitation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          email: 'john@example.com',
          name: 'John Doe',
          role: 'user',
        });
      });
    });

    it('shows general error when onSubmit throws', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
      render(<AddTeamMemberForm {...defaultProps} onSubmit={onSubmit} />);

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');

      const submitButton = screen.getByRole('button', { name: /send invitation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('cancel button', () => {
    it('calls onCancel when clicked', async () => {
      const onCancel = vi.fn();
      render(<AddTeamMemberForm {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('disables all inputs when loading', () => {
      render(<AddTeamMemberForm {...defaultProps} loading={true} />);

      expect(screen.getByLabelText(/full name/i)).toBeDisabled();
      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /sending invitation/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('shows loading spinner in submit button', () => {
      render(<AddTeamMemberForm {...defaultProps} loading={true} />);

      expect(screen.getByText(/sending invitation/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper aria attributes for invalid inputs', async () => {
      render(<AddTeamMemberForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
      });
    });

    it('associates error messages with inputs', async () => {
      render(<AddTeamMemberForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/full name/i);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        const errorElement = screen.getByText(/name is required/i);
        expect(errorElement).toHaveAttribute('id', 'name-error');
      });
    });
  });
});
