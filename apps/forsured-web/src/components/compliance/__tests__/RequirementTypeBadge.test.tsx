/**
 * RequirementTypeBadge Tests
 * REQ-2, TASK-13: Tests for type badge component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RequirementTypeBadge from '../RequirementTypeBadge';

describe('RequirementTypeBadge', () => {
  it('renders general_liability type correctly', () => {
    render(<RequirementTypeBadge type="general_liability" />);
    expect(screen.getByText('General Liability')).toBeInTheDocument();
    expect(screen.getByText('General Liability')).toHaveClass('bg-blue-50');
  });

  it('renders umbrella_liability type correctly', () => {
    render(<RequirementTypeBadge type="umbrella_liability" />);
    expect(screen.getByText('Umbrella')).toBeInTheDocument();
    expect(screen.getByText('Umbrella')).toHaveClass('bg-purple-50');
  });

  it('renders auto_liability type correctly', () => {
    render(<RequirementTypeBadge type="auto_liability" />);
    expect(screen.getByText('Auto')).toBeInTheDocument();
    expect(screen.getByText('Auto')).toHaveClass('bg-cyan-50');
  });

  it('renders workers_comp type correctly', () => {
    render(<RequirementTypeBadge type="workers_comp" />);
    expect(screen.getByText('Workers Comp')).toBeInTheDocument();
    expect(screen.getByText('Workers Comp')).toHaveClass('bg-amber-50');
  });

  it('renders professional_liability type correctly', () => {
    render(<RequirementTypeBadge type="professional_liability" />);
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toHaveClass('bg-indigo-50');
  });

  it('renders excess_liability type correctly', () => {
    render(<RequirementTypeBadge type="excess_liability" />);
    expect(screen.getByText('Excess')).toBeInTheDocument();
    expect(screen.getByText('Excess')).toHaveClass('bg-violet-50');
  });

  it('renders icon by default', () => {
    const { container } = render(<RequirementTypeBadge type="general_liability" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    const { container } = render(<RequirementTypeBadge type="general_liability" showIcon={false} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('renders xs size correctly', () => {
    render(<RequirementTypeBadge type="general_liability" size="xs" />);
    expect(screen.getByText('General Liability')).toHaveClass('px-1.5');
  });

  it('renders sm size correctly (default)', () => {
    render(<RequirementTypeBadge type="general_liability" />);
    expect(screen.getByText('General Liability')).toHaveClass('px-2');
  });

  it('renders md size correctly', () => {
    render(<RequirementTypeBadge type="general_liability" size="md" />);
    expect(screen.getByText('General Liability')).toHaveClass('px-2.5');
  });
});
