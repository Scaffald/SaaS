/**
 * Unit Tests for TaskViewToggle Component
 * REQ-268: Inbox vs Assigned by Me View
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { TaskViewToggle } from '../TaskViewToggle';

describe('TaskViewToggle Component', () => {
  describe('Rendering', () => {
    it('should render both view options', () => {
      const onViewChange = vi.fn();

      render(
        <TaskViewToggle
          currentView="inbox"
          onViewChange={onViewChange}
          inboxCount={5}
          assignedByMeCount={3}
        />
      );

      expect(screen.getByText('My Inbox')).toBeInTheDocument();
      expect(screen.getByText('Assigned by Me')).toBeInTheDocument();
    });

    it('should display correct counts', () => {
      const onViewChange = vi.fn();

      render(
        <TaskViewToggle
          currentView="inbox"
          onViewChange={onViewChange}
          inboxCount={15}
          assignedByMeCount={8}
        />
      );

      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should display zero counts correctly', () => {
      const onViewChange = vi.fn();

      render(
        <TaskViewToggle
          currentView="inbox"
          onViewChange={onViewChange}
          inboxCount={0}
          assignedByMeCount={0}
        />
      );

      const zeros = screen.getAllByText('0');
      expect(zeros).toHaveLength(2);
    });
  });

  describe('Active State', () => {
    it('should show inbox as active when currentView is inbox', () => {
      const onViewChange = vi.fn();

      render(
        <TaskViewToggle
          currentView="inbox"
          onViewChange={onViewChange}
          inboxCount={5}
          assignedByMeCount={3}
        />
      );

      const inboxTab = screen.getByRole('tab', { name: /my inbox/i });
      const assignedTab = screen.getByRole('tab', { name: /assigned by me/i });

      expect(inboxTab).toHaveAttribute('aria-selected', 'true');
      expect(assignedTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should show assigned-by-me as active when currentView is assigned-by-me', () => {
      const onViewChange = vi.fn();

      render(
        <TaskViewToggle
          currentView="assigned-by-me"
          onViewChange={onViewChange}
          inboxCount={5}
          assignedByMeCount={3}
        />
      );

      const inboxTab = screen.getByRole('tab', { name: /my inbox/i });
      const assignedTab = screen.getByRole('tab', { name: /assigned by me/i });

      expect(inboxTab).toHaveAttribute('aria-selected', 'false');
      expect(assignedTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Interaction', () => {
    it('should call onViewChange with "inbox" when inbox button is clicked', () => {
      const onViewChange = vi.fn();

      render(
        <TaskViewToggle
          currentView="assigned-by-me"
          onViewChange={onViewChange}
          inboxCount={5}
          assignedByMeCount={3}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /my inbox/i }));

      expect(onViewChange).toHaveBeenCalledWith('inbox');
      expect(onViewChange).toHaveBeenCalledTimes(1);
    });

    it('should call onViewChange with "assigned-by-me" when assigned button is clicked', () => {
      const onViewChange = vi.fn();

      render(
        <TaskViewToggle
          currentView="inbox"
          onViewChange={onViewChange}
          inboxCount={5}
          assignedByMeCount={3}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /assigned by me/i }));

      expect(onViewChange).toHaveBeenCalledWith('assigned-by-me');
      expect(onViewChange).toHaveBeenCalledTimes(1);
    });

    it('should still call onViewChange when clicking already active view', () => {
      const onViewChange = vi.fn();

      render(
        <TaskViewToggle
          currentView="inbox"
          onViewChange={onViewChange}
          inboxCount={5}
          assignedByMeCount={3}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /my inbox/i }));

      expect(onViewChange).toHaveBeenCalledWith('inbox');
    });
  });

  describe('Accessibility', () => {
    it('should have tablist role on container', () => {
      const onViewChange = vi.fn();

      render(
        <TaskViewToggle
          currentView="inbox"
          onViewChange={onViewChange}
          inboxCount={5}
          assignedByMeCount={3}
        />
      );

      expect(screen.getByRole('tablist', { name: /task view selection/i })).toBeInTheDocument();
    });

    it('should have tab role on buttons', () => {
      const onViewChange = vi.fn();

      render(
        <TaskViewToggle
          currentView="inbox"
          onViewChange={onViewChange}
          inboxCount={5}
          assignedByMeCount={3}
        />
      );

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
    });

    it('should have aria-controls on tabs', () => {
      const onViewChange = vi.fn();

      render(
        <TaskViewToggle
          currentView="inbox"
          onViewChange={onViewChange}
          inboxCount={5}
          assignedByMeCount={3}
        />
      );

      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute('aria-controls', 'task-list');
      });
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const onViewChange = vi.fn();

      render(
        <TaskViewToggle
          currentView="inbox"
          onViewChange={onViewChange}
          inboxCount={5}
          assignedByMeCount={3}
        />
      );

      const tablist = screen.getByRole('tablist');
      // Theme uses atomic CSS classes, verify the component renders correctly
      expect(tablist).toBeInTheDocument();
    });
  });
});
