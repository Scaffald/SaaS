/**
 * BrokerOnboarding tests
 * REQ-285: Broker Onboarding Form Improvements
 * TASK-1: Update Brokerage Details Form Section
 * TASK-2: Implement Administrator Setup Flow
 * TASK-3: Build Team Member Invitation Flow
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import BrokerOnboarding from '../BrokerOnboarding';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Mock window.matchMedia and localStorage
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
  }),
}));

const renderWithProviders = (component: React.ReactNode) => {
  // Test-utils already provides BrowserRouter and TamaguiProvider
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('BrokerOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the form title', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByText('Welcome, Insurance Broker')).toBeInTheDocument();
      expect(screen.getByText('Set up your brokerage profile')).toBeInTheDocument();
    });

    it('renders Brokerage Details section', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByText('Brokerage Details')).toBeInTheDocument();
    });

    it('renders Administrator Account section', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByText('Administrator Account')).toBeInTheDocument();
      expect(screen.getByText('You will be the administrator and main contact for this brokerage.')).toBeInTheDocument();
    });

    it('renders brokerage name field', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByPlaceholderText('Enter your brokerage name')).toBeInTheDocument();
    });

    it('renders license number field', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByPlaceholderText('Enter license number')).toBeInTheDocument();
    });

    it('renders location field', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByPlaceholderText('City, State')).toBeInTheDocument();
    });

    it('renders administrator name field', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
    });

    it('renders administrator email field', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    });

    it('renders administrator phone field', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByPlaceholderText('(555) 123-4567')).toBeInTheDocument();
    });

    it('renders password field', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
    });

    it('renders confirm password field', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    });

    it('renders password requirements hint', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByText('Must be at least 8 characters with a number and special character')).toBeInTheDocument();
    });

    it('does not render Primary Focus field (removed per requirements)', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.queryByText('Primary Focus')).not.toBeInTheDocument();
      expect(screen.queryByText('Select primary focus')).not.toBeInTheDocument();
    });

    it('renders submit button', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByRole('button', { name: /continue to dashboard/i })).toBeInTheDocument();
    });

    it('renders skip button', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByText('Skip for now')).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('submit button is disabled when form is empty', () => {
      renderWithProviders(<BrokerOnboarding />);

      const submitButton = screen.getByRole('button', { name: /continue to dashboard/i });
      expect(submitButton).toBeDisabled();
    });

    it('submit button is enabled when all fields are filled', async () => {
      renderWithProviders(<BrokerOnboarding />);

      await userEvent.type(screen.getByPlaceholderText('Enter your brokerage name'), 'ABC Insurance');
      await userEvent.type(screen.getByPlaceholderText('Enter license number'), 'LIC123456');
      await userEvent.type(screen.getByPlaceholderText('City, State'), 'New York, NY');
      await userEvent.type(screen.getByPlaceholderText('Enter your full name'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('Enter your email address'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('(555) 123-4567'), '555-123-4567');
      await userEvent.type(screen.getByPlaceholderText('Create a password'), 'Password1!');
      await userEvent.type(screen.getByPlaceholderText('Confirm your password'), 'Password1!');

      const submitButton = screen.getByRole('button', { name: /continue to dashboard/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('shows error for invalid email format', async () => {
      renderWithProviders(<BrokerOnboarding />);

      // Fill all fields with invalid email
      await userEvent.type(screen.getByPlaceholderText('Enter your brokerage name'), 'ABC Insurance');
      await userEvent.type(screen.getByPlaceholderText('Enter license number'), 'LIC123456');
      await userEvent.type(screen.getByPlaceholderText('City, State'), 'New York, NY');
      await userEvent.type(screen.getByPlaceholderText('Enter your full name'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('Enter your email address'), 'invalid-email');
      await userEvent.type(screen.getByPlaceholderText('(555) 123-4567'), '555-123-4567');
      await userEvent.type(screen.getByPlaceholderText('Create a password'), 'Password1!');
      await userEvent.type(screen.getByPlaceholderText('Confirm your password'), 'Password1!');

      // Submit form via form element
      const form = screen.getByRole('button', { name: /continue to dashboard/i }).closest('form');
      expect(form).toBeTruthy();
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('shows error for invalid phone format', async () => {
      renderWithProviders(<BrokerOnboarding />);

      // Fill all fields with invalid phone
      await userEvent.type(screen.getByPlaceholderText('Enter your brokerage name'), 'ABC Insurance');
      await userEvent.type(screen.getByPlaceholderText('Enter license number'), 'LIC123456');
      await userEvent.type(screen.getByPlaceholderText('City, State'), 'New York, NY');
      await userEvent.type(screen.getByPlaceholderText('Enter your full name'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('Enter your email address'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('(555) 123-4567'), '123');
      await userEvent.type(screen.getByPlaceholderText('Create a password'), 'Password1!');
      await userEvent.type(screen.getByPlaceholderText('Confirm your password'), 'Password1!');

      // Submit form via form element
      const form = screen.getByRole('button', { name: /continue to dashboard/i }).closest('form');
      expect(form).toBeTruthy();
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
      });
    });

    it('shows error for weak password', async () => {
      renderWithProviders(<BrokerOnboarding />);

      // Fill all fields with weak password (no special char)
      await userEvent.type(screen.getByPlaceholderText('Enter your brokerage name'), 'ABC Insurance');
      await userEvent.type(screen.getByPlaceholderText('Enter license number'), 'LIC123456');
      await userEvent.type(screen.getByPlaceholderText('City, State'), 'New York, NY');
      await userEvent.type(screen.getByPlaceholderText('Enter your full name'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('Enter your email address'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('(555) 123-4567'), '555-123-4567');
      await userEvent.type(screen.getByPlaceholderText('Create a password'), 'password1');
      await userEvent.type(screen.getByPlaceholderText('Confirm your password'), 'password1');

      // Submit form via form element
      const form = screen.getByRole('button', { name: /continue to dashboard/i }).closest('form');
      expect(form).toBeTruthy();
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText(/Password must contain/i)).toBeInTheDocument();
      });
    });

    it('shows error for password mismatch', async () => {
      renderWithProviders(<BrokerOnboarding />);

      // Fill all fields with mismatched passwords
      await userEvent.type(screen.getByPlaceholderText('Enter your brokerage name'), 'ABC Insurance');
      await userEvent.type(screen.getByPlaceholderText('Enter license number'), 'LIC123456');
      await userEvent.type(screen.getByPlaceholderText('City, State'), 'New York, NY');
      await userEvent.type(screen.getByPlaceholderText('Enter your full name'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('Enter your email address'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('(555) 123-4567'), '555-123-4567');
      await userEvent.type(screen.getByPlaceholderText('Create a password'), 'Password1!');
      await userEvent.type(screen.getByPlaceholderText('Confirm your password'), 'DifferentPassword1!');

      // Submit form via form element
      const form = screen.getByRole('button', { name: /continue to dashboard/i }).closest('form');
      expect(form).toBeTruthy();
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('navigates to dashboard on successful submission', async () => {
      renderWithProviders(<BrokerOnboarding />);

      // Fill all fields
      await userEvent.type(screen.getByPlaceholderText('Enter your brokerage name'), 'ABC Insurance');
      await userEvent.type(screen.getByPlaceholderText('Enter license number'), 'LIC123456');
      await userEvent.type(screen.getByPlaceholderText('City, State'), 'New York, NY');
      await userEvent.type(screen.getByPlaceholderText('Enter your full name'), 'John Doe');
      await userEvent.type(screen.getByPlaceholderText('Enter your email address'), 'john@example.com');
      await userEvent.type(screen.getByPlaceholderText('(555) 123-4567'), '555-123-4567');
      await userEvent.type(screen.getByPlaceholderText('Create a password'), 'Password1!');
      await userEvent.type(screen.getByPlaceholderText('Confirm your password'), 'Password1!');

      // Submit form via form element
      const form = screen.getByRole('button', { name: /continue to dashboard/i }).closest('form');
      expect(form).toBeTruthy();
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/broker/dashboard');
      });
    });
  });

  describe('skip functionality', () => {
    it('navigates to dashboard when skip is clicked', async () => {
      renderWithProviders(<BrokerOnboarding />);

      const skipButton = screen.getByText('Skip for now');
      await userEvent.click(skipButton);

      expect(mockNavigate).toHaveBeenCalledWith('/broker/dashboard');
    });
  });

  describe('field updates', () => {
    it('updates brokerage name on input', async () => {
      renderWithProviders(<BrokerOnboarding />);

      const input = screen.getByPlaceholderText('Enter your brokerage name');
      await userEvent.type(input, 'Test Brokerage');

      expect(input).toHaveValue('Test Brokerage');
    });

    it('updates administrator email on input', async () => {
      renderWithProviders(<BrokerOnboarding />);

      const input = screen.getByPlaceholderText('Enter your email address');
      await userEvent.type(input, 'test@example.com');

      expect(input).toHaveValue('test@example.com');
    });

    it('updates password on input', async () => {
      renderWithProviders(<BrokerOnboarding />);

      const input = screen.getByPlaceholderText('Create a password');
      await userEvent.type(input, 'TestPassword1!');

      expect(input).toHaveValue('TestPassword1!');
    });
  });

  describe('password visibility toggle', () => {
    it('toggles password visibility', async () => {
      renderWithProviders(<BrokerOnboarding />);

      const passwordInput = screen.getByPlaceholderText('Create a password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find the toggle button (Eye icon) next to password field
      const toggleButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('svg')
      );
      // The first toggle button should be for the password field
      const toggleButton = toggleButtons[1]; // Skip the skip button

      await userEvent.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('team member invitations', () => {
    it('renders team invitation section', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByText('Invite Team Members')).toBeInTheDocument();
      expect(screen.getByText('(Optional)')).toBeInTheDocument();
      expect(screen.getByText('Invite colleagues to join your brokerage. They will receive an email with a signup link.')).toBeInTheDocument();
    });

    it('renders team member email input', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByPlaceholderText('colleague@example.com')).toBeInTheDocument();
    });

    it('renders add team member button', () => {
      renderWithProviders(<BrokerOnboarding />);

      expect(screen.getByRole('button', { name: /add team member/i })).toBeInTheDocument();
    });

    it('adds team member email when add button is clicked', async () => {
      renderWithProviders(<BrokerOnboarding />);

      const emailInput = screen.getByPlaceholderText('colleague@example.com');
      const addButton = screen.getByRole('button', { name: /add team member/i });

      await userEvent.type(emailInput, 'teammate@example.com');
      await userEvent.click(addButton);

      expect(screen.getByText('teammate@example.com')).toBeInTheDocument();
      expect(screen.getByText('Pending Invitations (1)')).toBeInTheDocument();
    });

    it('adds team member email when Enter key is pressed', async () => {
      renderWithProviders(<BrokerOnboarding />);

      const emailInput = screen.getByPlaceholderText('colleague@example.com');

      await userEvent.type(emailInput, 'teammate@example.com{enter}');

      expect(screen.getByText('teammate@example.com')).toBeInTheDocument();
    });

    it('shows error for invalid email format', async () => {
      renderWithProviders(<BrokerOnboarding />);

      const emailInput = screen.getByPlaceholderText('colleague@example.com');
      const addButton = screen.getByRole('button', { name: /add team member/i });

      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.click(addButton);

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('shows error for empty email', async () => {
      renderWithProviders(<BrokerOnboarding />);

      const addButton = screen.getByRole('button', { name: /add team member/i });

      await userEvent.click(addButton);

      expect(screen.getByText('Please enter an email address')).toBeInTheDocument();
    });

    it('shows error for duplicate email', async () => {
      renderWithProviders(<BrokerOnboarding />);

      const emailInput = screen.getByPlaceholderText('colleague@example.com');
      const addButton = screen.getByRole('button', { name: /add team member/i });

      // Add first email
      await userEvent.type(emailInput, 'teammate@example.com');
      await userEvent.click(addButton);

      // Try to add same email again
      await userEvent.type(emailInput, 'teammate@example.com');
      await userEvent.click(addButton);

      expect(screen.getByText('This email has already been added')).toBeInTheDocument();
    });

    it('shows error when using admin email for team member', async () => {
      renderWithProviders(<BrokerOnboarding />);

      // First set the admin email
      const adminEmailInput = screen.getByPlaceholderText('Enter your email address');
      await userEvent.type(adminEmailInput, 'admin@example.com');

      // Try to add same email as team member
      const teamEmailInput = screen.getByPlaceholderText('colleague@example.com');
      const addButton = screen.getByRole('button', { name: /add team member/i });

      await userEvent.type(teamEmailInput, 'admin@example.com');
      await userEvent.click(addButton);

      expect(screen.getByText('This email is already used for the administrator account')).toBeInTheDocument();
    });

    it('removes team member email when remove button is clicked', async () => {
      renderWithProviders(<BrokerOnboarding />);

      const emailInput = screen.getByPlaceholderText('colleague@example.com');
      const addButton = screen.getByRole('button', { name: /add team member/i });

      // Add email
      await userEvent.type(emailInput, 'teammate@example.com');
      await userEvent.click(addButton);

      expect(screen.getByText('teammate@example.com')).toBeInTheDocument();

      // Remove email
      const removeButton = screen.getByRole('button', { name: /remove teammate@example.com/i });
      await userEvent.click(removeButton);

      expect(screen.queryByText('teammate@example.com')).not.toBeInTheDocument();
      expect(screen.queryByText('Pending Invitations')).not.toBeInTheDocument();
    });

    it('clears input after adding email', async () => {
      renderWithProviders(<BrokerOnboarding />);

      const emailInput = screen.getByPlaceholderText('colleague@example.com') as HTMLInputElement;
      const addButton = screen.getByRole('button', { name: /add team member/i });

      await userEvent.type(emailInput, 'teammate@example.com');
      await userEvent.click(addButton);

      expect(emailInput.value).toBe('');
    });

    it('can add multiple team members', async () => {
      renderWithProviders(<BrokerOnboarding />);

      const emailInput = screen.getByPlaceholderText('colleague@example.com');
      const addButton = screen.getByRole('button', { name: /add team member/i });

      // Add first email
      await userEvent.type(emailInput, 'teammate1@example.com');
      await userEvent.click(addButton);

      // Add second email
      await userEvent.type(emailInput, 'teammate2@example.com');
      await userEvent.click(addButton);

      // Add third email
      await userEvent.type(emailInput, 'teammate3@example.com');
      await userEvent.click(addButton);

      expect(screen.getByText('teammate1@example.com')).toBeInTheDocument();
      expect(screen.getByText('teammate2@example.com')).toBeInTheDocument();
      expect(screen.getByText('teammate3@example.com')).toBeInTheDocument();
      expect(screen.getByText('Pending Invitations (3)')).toBeInTheDocument();
    });
  });
});
