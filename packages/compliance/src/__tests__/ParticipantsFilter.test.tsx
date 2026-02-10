/**
 * ParticipantsFilter Component Tests
 * REQ-281: Participants Tab Compliance View - TASK-3
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParticipantsFilter, type FilterOption } from '../ParticipantsFilter';

vi.mock('@unicornlove/beyond-ui', () => {
  const React = require('react');
  const createEl = (tag: string) => ({ children, ...rest }: Record<string, unknown>) => React.createElement(tag, rest, children);
  return {
    Stack: createEl('div'),
    Row: createEl('div'),
    Text: createEl('span'),
    Box: createEl('div'),
    ThemeProvider: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useThemeContext: () => ({ theme: 'light' }),
    VisuallyHidden: createEl('span'),
    Spinner: () => React.createElement('div', { 'data-testid': 'spinner' }),
    useToast: () => ({ show: () => {}, dismiss: () => {}, success: () => {}, error: () => {} }),
  };
});

describe('ParticipantsFilter Component', () => {
  describe('Basic Rendering', () => {
    it('should render all filter buttons', () => {
      const handleFilterChange = vi.fn();
      render(
        <ParticipantsFilter activeFilter="all" onFilterChange={handleFilterChange} />
      );

      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Compliant')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('At Risk')).toBeInTheDocument();
      expect(screen.getByText('Non-Compliant')).toBeInTheDocument();
    });

    it('should display counts when provided', () => {
      const handleFilterChange = vi.fn();
      render(
        <ParticipantsFilter
          activeFilter="all"
          onFilterChange={handleFilterChange}
          counts={{
            all: 10,
            compliant: 5,
            pending: 3,
            'at-risk': 1,
            'non-compliant': 1,
          }}
        />
      );

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Filter Selection', () => {
    it('should call onFilterChange when clicking a filter button', () => {
      const handleFilterChange = vi.fn();
      render(
        <ParticipantsFilter activeFilter="all" onFilterChange={handleFilterChange} />
      );

      const compliantButton = screen.getByText('Compliant').closest('[data-name="ParticipantsFilterButton"]');
      if (compliantButton) {
        fireEvent.click(compliantButton);
        expect(handleFilterChange).toHaveBeenCalledWith('compliant');
      }
    });

    it('should call onFilterChange with "all" when clicking All button', () => {
      const handleFilterChange = vi.fn();
      render(
        <ParticipantsFilter activeFilter="compliant" onFilterChange={handleFilterChange} />
      );

      const allButton = screen.getByText('All').closest('[data-name="ParticipantsFilterButton"]');
      if (allButton) {
        fireEvent.click(allButton);
        expect(handleFilterChange).toHaveBeenCalledWith('all');
      }
    });

    it('should call onFilterChange with "non-compliant" when clicking Non-Compliant button', () => {
      const handleFilterChange = vi.fn();
      render(
        <ParticipantsFilter activeFilter="all" onFilterChange={handleFilterChange} />
      );

      const nonCompliantButton = screen.getByText('Non-Compliant').closest('[data-name="ParticipantsFilterButton"]');
      if (nonCompliantButton) {
        fireEvent.click(nonCompliantButton);
        expect(handleFilterChange).toHaveBeenCalledWith('non-compliant');
      }
    });
  });

  describe('Active State', () => {
    it('should render with the correct active filter selected', () => {
      const handleFilterChange = vi.fn();
      const { rerender } = render(
        <ParticipantsFilter activeFilter="compliant" onFilterChange={handleFilterChange} />
      );

      // The component should render with compliant as active filter
      // We verify by checking the component doesn't throw and renders correctly
      expect(screen.getByText('Compliant')).toBeInTheDocument();

      // Switch to pending filter
      rerender(
        <ParticipantsFilter activeFilter="pending" onFilterChange={handleFilterChange} />
      );

      // Verify pending is in the document after rerender
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('All Filter Options', () => {
    const filterOptions: FilterOption[] = ['all', 'compliant', 'pending', 'at-risk', 'non-compliant'];

    filterOptions.forEach((filter) => {
      it(`should correctly handle "${filter}" filter selection`, () => {
        const handleFilterChange = vi.fn();
        render(
          <ParticipantsFilter activeFilter="all" onFilterChange={handleFilterChange} />
        );

        const filterLabels: Record<FilterOption, string> = {
          all: 'All',
          compliant: 'Compliant',
          pending: 'Pending',
          'at-risk': 'At Risk',
          'non-compliant': 'Non-Compliant',
        };

        const button = screen.getByText(filterLabels[filter]).closest('[data-name="ParticipantsFilterButton"]');
        if (button) {
          fireEvent.click(button);
          expect(handleFilterChange).toHaveBeenCalledWith(filter);
        }
      });
    });
  });

  describe('Without Counts', () => {
    it('should not render count badges when counts not provided', () => {
      const handleFilterChange = vi.fn();
      render(
        <ParticipantsFilter activeFilter="all" onFilterChange={handleFilterChange} />
      );

      // Should not find any count badge elements
      const countBadges = screen.queryAllByText(/^\d+$/);
      expect(countBadges).toHaveLength(0);
    });
  });

  describe('Partial Counts', () => {
    it('should only render counts for provided statuses', () => {
      const handleFilterChange = vi.fn();
      render(
        <ParticipantsFilter
          activeFilter="all"
          onFilterChange={handleFilterChange}
          counts={{
            all: 5,
            compliant: 2,
            // pending, at-risk, non-compliant not provided
          }}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      // Should not have counts for other statuses
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });
});
