/**
 * RequirementStatusBadge Tests
 * REQ-2, TASK-13: Tests for status badge component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RequirementStatusBadge from '../RequirementStatusBadge';

describe('RequirementStatusBadge', () => {
  it('renders draft status correctly', () => {
    render(<RequirementStatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toHaveClass('bg-gray-100');
  });

  it('renders active status correctly', () => {
    render(<RequirementStatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Active')).toHaveClass('bg-success-50');
  });

  it('renders pending_approval status correctly', () => {
    render(<RequirementStatusBadge status="pending_approval" />);
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    expect(screen.getByText('Pending Approval')).toHaveClass('bg-warning-50');
  });

  it('renders deprecated status correctly', () => {
    render(<RequirementStatusBadge status="deprecated" />);
    expect(screen.getByText('Deprecated')).toBeInTheDocument();
    expect(screen.getByText('Deprecated')).toHaveClass('bg-orange-50');
  });

  it('renders archived status correctly', () => {
    render(<RequirementStatusBadge status="archived" />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('renders xs size correctly', () => {
    render(<RequirementStatusBadge status="active" size="xs" />);
    expect(screen.getByText('Active')).toHaveClass('px-1.5');
    expect(screen.getByText('Active')).toHaveClass('py-0.5');
  });

  it('renders sm size correctly (default)', () => {
    render(<RequirementStatusBadge status="active" />);
    expect(screen.getByText('Active')).toHaveClass('px-2');
  });

  it('renders md size correctly', () => {
    render(<RequirementStatusBadge status="active" size="md" />);
    expect(screen.getByText('Active')).toHaveClass('px-2.5');
    expect(screen.getByText('Active')).toHaveClass('py-1');
  });
});
