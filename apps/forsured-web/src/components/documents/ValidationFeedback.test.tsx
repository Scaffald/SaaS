/**
 * Tests for ValidationFeedback component (REQ-167)
 * TDD: Write tests first
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { ValidationFeedback } from './ValidationFeedback';
import { ValidationResult } from '../../types/ocr.types';

describe('ValidationFeedback', () => {
  it('should render nothing when validation result is null', () => {
    const { container } = render(<ValidationFeedback validationResult={null} />);
    // With TamaguiProvider, there's always a wrapper, but the component should not render any feedback content
    const feedbackContent = container.querySelector('[data-testid="validation-feedback"]');
    expect(feedbackContent).toBeNull();
  });

  it('should display success message when validation is successful', () => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    render(<ValidationFeedback validationResult={result} />);
    expect(screen.getByText(/all fields are valid/i)).toBeInTheDocument();
  });

  it('should display error messages when validation fails', () => {
    const result: ValidationResult = {
      isValid: false,
      errors: [
        { field: 'policyNumber', message: 'Policy number is required', severity: 'error' },
        { field: 'carrierName', message: 'Carrier name is required', severity: 'error' },
      ],
      warnings: [],
    };

    render(<ValidationFeedback validationResult={result} />);
    expect(screen.getByText('Policy number is required')).toBeInTheDocument();
    expect(screen.getByText('Carrier name is required')).toBeInTheDocument();
  });

  it('should display warning messages separately from errors', () => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [
        {
          field: 'carrierName',
          message: 'Carrier is not in approved list',
          severity: 'warning',
        },
      ],
    };

    render(<ValidationFeedback validationResult={result} />);
    expect(screen.getByText('Carrier is not in approved list')).toBeInTheDocument();
  });

  it('should display both errors and warnings when both are present', () => {
    const result: ValidationResult = {
      isValid: false,
      errors: [
        { field: 'policyNumber', message: 'Policy number is required', severity: 'error' },
      ],
      warnings: [
        {
          field: 'carrierName',
          message: 'Carrier is not in approved list',
          severity: 'warning',
        },
      ],
    };

    render(<ValidationFeedback validationResult={result} />);
    expect(screen.getByText('Policy number is required')).toBeInTheDocument();
    expect(screen.getByText('Carrier is not in approved list')).toBeInTheDocument();
  });

  it('should use red styling for error messages', () => {
    const result: ValidationResult = {
      isValid: false,
      errors: [
        { field: 'policyNumber', message: 'Policy number is required', severity: 'error' },
      ],
      warnings: [],
    };

    const { container } = render(<ValidationFeedback validationResult={result} />);
    const errorSection = container.querySelector('[data-testid="error-section"]');
    expect(errorSection).toHaveClass('bg-red-50');
  });

  it('should use yellow styling for warning messages', () => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [
        {
          field: 'carrierName',
          message: 'Carrier is not in approved list',
          severity: 'warning',
        },
      ],
    };

    const { container } = render(<ValidationFeedback validationResult={result} />);
    const warningSection = container.querySelector('[data-testid="warning-section"]');
    expect(warningSection).toHaveClass('bg-yellow-50');
  });

  it('should use green styling for success message', () => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    const { container } = render(<ValidationFeedback validationResult={result} />);
    const successSection = container.querySelector('[data-testid="success-section"]');
    expect(successSection).toHaveClass('bg-green-50');
  });

  it('should display error count in header', () => {
    const result: ValidationResult = {
      isValid: false,
      errors: [
        { field: 'policyNumber', message: 'Policy number is required', severity: 'error' },
        { field: 'carrierName', message: 'Carrier name is required', severity: 'error' },
      ],
      warnings: [],
    };

    render(<ValidationFeedback validationResult={result} />);
    expect(screen.getByText(/2 error/i)).toBeInTheDocument();
  });

  it('should display warning count in header', () => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [
        {
          field: 'carrierName',
          message: 'Carrier is not in approved list',
          severity: 'warning',
        },
      ],
    };

    render(<ValidationFeedback validationResult={result} />);
    expect(screen.getByText(/1 warning/i)).toBeInTheDocument();
  });
});
