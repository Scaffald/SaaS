/**
 * Tests for OCRFieldDisplay component (REQ-167)
 * TDD: Write tests first
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { OCRFieldDisplay } from './OCRFieldDisplay';
import { createOCRField } from '../../types/ocr.types';

describe('OCRFieldDisplay', () => {
  it('should render field label and value', () => {
    const field = createOCRField('ABC12345', 95);
    render(
      <OCRFieldDisplay
        label="Policy Number"
        field={field}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Policy Number')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ABC12345')).toBeInTheDocument();
  });

  it('should display high confidence indicator (green) for score >= 90', () => {
    const field = createOCRField('ABC12345', 95);
    const { container } = render(
      <OCRFieldDisplay
        label="Policy Number"
        field={field}
        onChange={vi.fn()}
      />
    );

    const indicator = container.querySelector('[data-testid="confidence-indicator"]');
    expect(indicator).toHaveClass('bg-green-100');
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('should display medium confidence indicator (yellow) for score 70-89', () => {
    const field = createOCRField('ABC12345', 75);
    const { container } = render(
      <OCRFieldDisplay
        label="Policy Number"
        field={field}
        onChange={vi.fn()}
      />
    );

    const indicator = container.querySelector('[data-testid="confidence-indicator"]');
    expect(indicator).toHaveClass('bg-yellow-100');
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should display low confidence indicator (red) for score < 70', () => {
    const field = createOCRField('ABC12345', 65);
    const { container } = render(
      <OCRFieldDisplay
        label="Policy Number"
        field={field}
        onChange={vi.fn()}
      />
    );

    const indicator = container.querySelector('[data-testid="confidence-indicator"]');
    expect(indicator).toHaveClass('bg-red-100');
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('should show "Review Required" badge for low confidence fields', () => {
    const field = createOCRField('ABC12345', 65);
    render(
      <OCRFieldDisplay
        label="Policy Number"
        field={field}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Review Required')).toBeInTheDocument();
  });

  it('should not show "Review Required" badge for high confidence fields', () => {
    const field = createOCRField('ABC12345', 95);
    render(
      <OCRFieldDisplay
        label="Policy Number"
        field={field}
        onChange={vi.fn()}
      />
    );

    expect(screen.queryByText('Review Required')).not.toBeInTheDocument();
  });

  it('should call onChange when field value is edited', () => {
    const field = createOCRField('ABC12345', 95);
    const onChange = vi.fn();
    render(
      <OCRFieldDisplay
        label="Policy Number"
        field={field}
        onChange={onChange}
      />
    );

    const input = screen.getByDisplayValue('ABC12345') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'XYZ67890' } });

    expect(onChange).toHaveBeenCalledWith('XYZ67890');
  });

  it('should show edited indicator when field has been modified', () => {
    const field = { ...createOCRField('ABC12345', 95), edited: true };
    render(
      <OCRFieldDisplay
        label="Policy Number"
        field={field}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Edited')).toBeInTheDocument();
  });

  it('should show "Revert to Original" button when field has been edited', () => {
    const field = { ...createOCRField('ABC12345', 95), edited: true, value: 'XYZ67890' };
    const onRevert = vi.fn();
    render(
      <OCRFieldDisplay
        label="Policy Number"
        field={field}
        onChange={vi.fn()}
        onRevert={onRevert}
      />
    );

    const revertButton = screen.getByText('Revert to Original');
    expect(revertButton).toBeInTheDocument();

    fireEvent.click(revertButton);
    expect(onRevert).toHaveBeenCalled();
  });

  it('should not show "Revert to Original" button for unedited fields', () => {
    const field = createOCRField('ABC12345', 95);
    render(
      <OCRFieldDisplay
        label="Policy Number"
        field={field}
        onChange={vi.fn()}
      />
    );

    expect(screen.queryByText('Revert to Original')).not.toBeInTheDocument();
  });

  it('should display validation error when provided', () => {
    const field = createOCRField('ABC', 95);
    const error = 'Policy number must be between 5-50 characters';
    render(
      <OCRFieldDisplay
        label="Policy Number"
        field={field}
        onChange={vi.fn()}
        error={error}
      />
    );

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('should render as disabled when disabled prop is true', () => {
    const field = createOCRField('ABC12345', 95);
    render(
      <OCRFieldDisplay
        label="Policy Number"
        field={field}
        onChange={vi.fn()}
        disabled={true}
      />
    );

    const input = screen.getByDisplayValue('ABC12345') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it('should render with date input type when type is "date"', () => {
    const field = createOCRField('2024-01-15', 95);
    render(
      <OCRFieldDisplay
        label="Effective Date"
        field={field}
        onChange={vi.fn()}
        type="date"
      />
    );

    const input = screen.getByDisplayValue('2024-01-15') as HTMLInputElement;
    expect(input.type).toBe('date');
  });

  it('should render with number input type when type is "number"', () => {
    const field = createOCRField('1000000', 95);
    render(
      <OCRFieldDisplay
        label="Coverage Limit"
        field={field}
        onChange={vi.fn()}
        type="number"
      />
    );

    const input = screen.getByDisplayValue('1000000') as HTMLInputElement;
    expect(input.type).toBe('number');
  });
});
