import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock tRPC API - use vi.hoisted to avoid initialization issues
const mockUseQuery = vi.hoisted(() => vi.fn());

vi.mock("@scf/core/utils/api", () => ({
  api: {
    map: {
      getLocationCounts: {
        useQuery: mockUseQuery,
      },
    },
  },
}));

import {
  formatCount,
  formatLocationWithCounts,
  useLocationResultCounts,
} from '../useLocationResultCounts';

describe("useLocationResultCounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
  });

  it("calculates bounds from coordinates correctly", () => {
    renderHook(() =>
      useLocationResultCounts({
        coordinates: { lat: 42.3601, lng: -71.0589 },
        enabled: true,
      })
    );

    // The hook should calculate bounds from coordinates
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        bounds: expect.objectContaining({
          north: expect.any(Number),
          south: expect.any(Number),
          east: expect.any(Number),
          west: expect.any(Number),
        }),
      }),
      expect.any(Object),
    );
  });

  it("formats count correctly", () => {
    expect(formatCount(10)).toBe("10");
    expect(formatCount(1000)).toBe("Many results"); // >= 500 returns "Many results"
    expect(formatCount(499)).toBe("499");
    expect(formatCount(500)).toBe("Many results");
    expect(formatCount(600)).toBe("Many results");
    expect(formatCount("many")).toBe("Many results");
  });

  it('returns 'Many results' for counts >= 500', () => {
    expect(formatCount(500)).toBe("Many results");
    expect(formatCount(501)).toBe("Many results");
    expect(formatCount(1000)).toBe("Many results");
  });

  it("formats location with counts correctly", () => {
    expect(formatLocationWithCounts("Boston", "MA")).toBe("Boston, MA");

    expect(formatLocationWithCounts("Boston", "MA", {
      workers: 10,
      jobs: 5,
      employers: 3,
      cached: false,
    })).toBe("Boston, MA - 10 workers, 5 jobs, 3 employers");

    expect(formatLocationWithCounts("Boston", "MA", {
      workers: 500,
      jobs: 0,
      employers: 0,
      cached: false,
    })).toBe("Boston, MA - Many results workers");
  });

  it("respects enabled flag", () => {
    renderHook(() =>
      useLocationResultCounts({
        coordinates: { lat: 42.3601, lng: -71.0589 },
        enabled: false,
      })
    );

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it("handles query errors gracefully", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: "Query failed" },
    });

    const { result } = renderHook(() =>
      useLocationResultCounts({
        coordinates: { lat: 42.3601, lng: -71.0589 },
        enabled: true,
      })
    );

    // Hook should handle errors without crashing
    expect(result.current.error).toBeTruthy();
    expect(result.current.counts).toBeUndefined();
  });

  it("returns cached status correctly", () => {
    mockUseQuery.mockReturnValue({
      data: {
        workers: 10,
        jobs: 5,
        employers: 3,
        cached: true,
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useLocationResultCounts({
        coordinates: { lat: 42.3601, lng: -71.0589 },
        enabled: true,
      })
    );

    expect(result.current.isCached).toBe(true);
    expect(result.current.counts).toBeDefined();
  });
});
