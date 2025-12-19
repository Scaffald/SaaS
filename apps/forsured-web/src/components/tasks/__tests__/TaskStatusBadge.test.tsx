/**
 * REQ-166: Task Management Workflow & UI
 * Tests for TaskStatusBadge component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { TaskStatusBadge } from '../TaskStatusBadge';

describe('TaskStatusBadge', () => {
  describe('Status Display', () => {
    it('should render pending status', () => {
      render(<TaskStatusBadge status="pending" />);
      const badge = screen.getByText('Pending');
      expect(badge).toBeInTheDocument();
    });

    it('should render in_progress status', () => {
      render(<TaskStatusBadge status="in_progress" />);
      const badge = screen.getByText('In Progress');
      expect(badge).toBeInTheDocument();
    });

    it('should render completed status', () => {
      render(<TaskStatusBadge status="completed" />);
      const badge = screen.getByText('Completed');
      expect(badge).toBeInTheDocument();
    });

    it('should render cancelled status', () => {
      render(<TaskStatusBadge status="cancelled" />);
      const badge = screen.getByText('Cancelled');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for screen readers', () => {
      render(<TaskStatusBadge status="in_progress" />);
      const badge = screen.getByLabelText('Task status: In Progress');
      expect(badge).toBeTruthy();
    });

    it('should include status role for semantic meaning', () => {
      render(<TaskStatusBadge status="completed" />);
      const badge = screen.getByRole('status');
      expect(badge).toBeTruthy();
    });
  });

  describe('Size Variants', () => {
    it('should render small size variant', () => {
      render(<TaskStatusBadge status="pending" size="sm" />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should render medium size variant by default', () => {
      render(<TaskStatusBadge status="pending" />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should render large size variant', () => {
      render(<TaskStatusBadge status="pending" size="lg" />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('Status Icon', () => {
    it('should show clock icon for pending status', () => {
      render(<TaskStatusBadge status="pending" showIcon />);
      expect(screen.getByTestId('status-icon-pending')).toBeTruthy();
    });

    it('should show spinner icon for in_progress status', () => {
      render(<TaskStatusBadge status="in_progress" showIcon />);
      expect(screen.getByTestId('status-icon-in_progress')).toBeTruthy();
    });

    it('should show checkmark icon for completed status', () => {
      render(<TaskStatusBadge status="completed" showIcon />);
      expect(screen.getByTestId('status-icon-completed')).toBeTruthy();
    });

    it('should show x icon for cancelled status', () => {
      render(<TaskStatusBadge status="cancelled" showIcon />);
      expect(screen.getByTestId('status-icon-cancelled')).toBeTruthy();
    });

    it('should not show icon when showIcon is false', () => {
      render(<TaskStatusBadge status="pending" showIcon={false} />);
      expect(screen.queryByTestId('status-icon-pending')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined status gracefully', () => {
      // @ts-expect-error: Testing runtime error handling
      render(<TaskStatusBadge status={undefined} />);
      expect(screen.getByText('Unknown')).toBeTruthy();
    });

    it('should handle invalid status gracefully', () => {
      // @ts-expect-error: Testing runtime error handling
      render(<TaskStatusBadge status="invalid" />);
      expect(screen.getByText('Unknown')).toBeTruthy();
    });
  });

  describe('Custom Props', () => {
    it('should render correctly with different status props', () => {
      const { rerender } = render(<TaskStatusBadge status="pending" />);
      expect(screen.getByText('Pending')).toBeInTheDocument();

      rerender(<TaskStatusBadge status="completed" />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });
});
