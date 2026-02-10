/**
 * Unit Tests for useTaskViewFilter Hook
 * Inbox vs Assigned by Me View
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@/test/test-utils';
import { useTaskViewFilter, viewTypeToRole, TaskViewType } from '../useTaskViewFilter';

// Mock window.location and history
const mockLocation = {
  href: 'http://localhost:3000/tasks',
  search: '',
};

const mockHistoryReplaceState = vi.fn();

beforeEach(() => {
  // Reset location
  mockLocation.href = 'http://localhost:3000/tasks';
  mockLocation.search = '';

  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
  });

  // Mock history.replaceState
  window.history.replaceState = mockHistoryReplaceState;
  mockHistoryReplaceState.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useTaskViewFilter Hook', () => {
  describe('viewTypeToRole utility', () => {
    it('should return "assigned" for inbox view', () => {
      expect(viewTypeToRole('inbox')).toBe('assigned');
    });

    it('should return "created" for assigned-by-me view', () => {
      expect(viewTypeToRole('assigned-by-me')).toBe('created');
    });
  });

  describe('Initial State', () => {
    it('should default to inbox view when no URL parameter', () => {
      const { result } = renderHook(() => useTaskViewFilter());

      expect(result.current.currentView).toBe('inbox');
    });

    it('should initialize from inbox URL parameter', () => {
      mockLocation.search = '?view=inbox';

      const { result } = renderHook(() => useTaskViewFilter());

      expect(result.current.currentView).toBe('inbox');
    });

    it('should initialize from assigned-by-me URL parameter', () => {
      mockLocation.search = '?view=assigned-by-me';

      const { result } = renderHook(() => useTaskViewFilter());

      expect(result.current.currentView).toBe('assigned-by-me');
    });

    it('should default to inbox for invalid URL parameter', () => {
      mockLocation.search = '?view=invalid-value';

      const { result } = renderHook(() => useTaskViewFilter());

      expect(result.current.currentView).toBe('inbox');
    });
  });

  describe('setView', () => {
    it('should update currentView state', () => {
      const { result } = renderHook(() => useTaskViewFilter());

      act(() => {
        result.current.setView('assigned-by-me');
      });

      expect(result.current.currentView).toBe('assigned-by-me');
    });

    it('should update URL when changing to assigned-by-me', () => {
      const { result } = renderHook(() => useTaskViewFilter());

      act(() => {
        result.current.setView('assigned-by-me');
      });

      expect(mockHistoryReplaceState).toHaveBeenCalled();
      const calledUrl = mockHistoryReplaceState.mock.calls[0][2];
      expect(calledUrl).toContain('view=assigned-by-me');
    });

    it('should remove URL param when changing to default inbox view', () => {
      mockLocation.search = '?view=assigned-by-me';
      const { result } = renderHook(() => useTaskViewFilter());

      act(() => {
        result.current.setView('inbox');
      });

      expect(mockHistoryReplaceState).toHaveBeenCalled();
      const calledUrl = mockHistoryReplaceState.mock.calls[0][2];
      expect(calledUrl).not.toContain('view=');
    });

    it('should preserve other URL parameters', () => {
      mockLocation.href = 'http://localhost:3000/tasks?status=pending&sort=date';
      mockLocation.search = '?status=pending&sort=date';

      const { result } = renderHook(() => useTaskViewFilter());

      act(() => {
        result.current.setView('assigned-by-me');
      });

      expect(mockHistoryReplaceState).toHaveBeenCalled();
      const calledUrl = mockHistoryReplaceState.mock.calls[0][2];
      expect(calledUrl).toContain('status=pending');
      expect(calledUrl).toContain('sort=date');
      expect(calledUrl).toContain('view=assigned-by-me');
    });
  });

  describe('getTaskRole', () => {
    it('should return "assigned" when view is inbox', () => {
      const { result } = renderHook(() => useTaskViewFilter());

      expect(result.current.getTaskRole()).toBe('assigned');
    });

    it('should return "created" when view is assigned-by-me', () => {
      const { result } = renderHook(() => useTaskViewFilter());

      act(() => {
        result.current.setView('assigned-by-me');
      });

      expect(result.current.getTaskRole()).toBe('created');
    });

    it('should update when view changes', () => {
      const { result } = renderHook(() => useTaskViewFilter());

      expect(result.current.getTaskRole()).toBe('assigned');

      act(() => {
        result.current.setView('assigned-by-me');
      });

      expect(result.current.getTaskRole()).toBe('created');

      act(() => {
        result.current.setView('inbox');
      });

      expect(result.current.getTaskRole()).toBe('assigned');
    });
  });

  describe('View Toggling', () => {
    it('should toggle from inbox to assigned-by-me', () => {
      const { result } = renderHook(() => useTaskViewFilter());

      expect(result.current.currentView).toBe('inbox');

      act(() => {
        result.current.setView('assigned-by-me');
      });

      expect(result.current.currentView).toBe('assigned-by-me');
    });

    it('should toggle from assigned-by-me to inbox', () => {
      mockLocation.search = '?view=assigned-by-me';
      const { result } = renderHook(() => useTaskViewFilter());

      expect(result.current.currentView).toBe('assigned-by-me');

      act(() => {
        result.current.setView('inbox');
      });

      expect(result.current.currentView).toBe('inbox');
    });
  });
});
