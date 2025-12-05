import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Supabase client - use vi.hoisted
const mockRpc = vi.hoisted(() => vi.fn());
const mockSchema = vi.hoisted(() => vi.fn());
const mockReturns = vi.hoisted(() => vi.fn());

const mockSupabaseClient = vi.hoisted(() => ({
  schema: mockSchema,
}));

vi.mock("@scf/core/utils/supabase/client", () => ({
  supabase: mockSupabaseClient,
}));

// Mock React Query
const mockUseQuery = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
  useQuery: mockUseQuery,
}));

import { useOrganizations } from "../useOrganizations";
import type { ViewportBounds } from "@unicornlove/ui";

describe("useOrganizations", () => {
  const mockBounds: ViewportBounds = {
    north: 43,
    south: 42,
    east: -70,
    west: -72,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSchema.mockReturnValue({
      rpc: mockRpc,
    });
    mockRpc.mockReturnValue({
      returns: mockReturns,
    });
    mockReturns.mockResolvedValue({
      data: [],
      error: null,
    });

    // Default mock - will be overridden by individual tests
    // The issue is that useQuery must return synchronously, but queryFn is async
    // So we need each test to handle this properly
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
  });

  it("calls RPC function correctly", () => {
    const queryResult: {
      data: unknown;
      isLoading: boolean;
      error: Error | null;
    } = {
      data: [],
      isLoading: false,
      error: null,
    };

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) {
        // Execute queryFn to trigger RPC call
        Promise.resolve(options.queryFn()).catch(() => {});
      }
      return queryResult;
    });

    renderHook(() => useOrganizations({ bounds: mockBounds }));

    expect(mockRpc).toHaveBeenCalledWith("get_organizations_with_coords");
  });

  it("filters organizations by bounds in memory", async () => {
    const mockOrgs = [
      {
        id: "org-1",
        name: "Org 1",
        slug: "org-1",
        longitude: -71.0589, // Within bounds
        latitude: 42.3601,
        address: { city: "Boston", state: "MA" },
        employee_count_range: "10-50",
        industry_name: "Technology",
      },
      {
        id: "org-2",
        name: "Org 2",
        slug: "org-2",
        longitude: -100, // Outside bounds
        latitude: 50,
        address: null,
        employee_count_range: null,
        industry_name: null,
      },
    ];

    mockReturns.mockResolvedValue({
      data: mockOrgs,
      error: null,
    });

    // Use a synchronous mock that stores the result
    const queryResult: {
      data: unknown;
      isLoading: boolean;
      error: Error | null;
    } = {
      data: undefined,
      isLoading: true,
      error: null,
    };

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) {
        // Execute queryFn and update result when it resolves
        Promise.resolve(options.queryFn())
          .then((data) => {
            queryResult.data = data;
            queryResult.isLoading = false;
          })
          .catch((err) => {
            queryResult.error = err instanceof Error
              ? err
              : new Error(String(err));
            queryResult.isLoading = false;
          });
      }
      return queryResult;
    });

    const { result, rerender } = renderHook(() =>
      useOrganizations({ bounds: mockBounds })
    );

    // Wait for promise to resolve and trigger re-render
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      rerender();
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      // Only org-1 should be in results (org-2 is outside bounds)
      expect(result.current.data?.length).toBe(1);
      expect(result.current.data?.[0].id).toBe("org-1");
    }, { timeout: 3000 });
  });

  it("enforces limit of 200", async () => {
    const manyOrgs = Array.from({ length: 300 }, (_, i) => ({
      id: `org-${i}`,
      name: `Org ${i}`,
      slug: `org-${i}`,
      longitude: -71.0589,
      latitude: 42.3601,
      address: null,
      employee_count_range: null,
      industry_name: null,
    }));

    mockReturns.mockResolvedValue({
      data: manyOrgs,
      error: null,
    });

    const queryResult: {
      data: unknown;
      isLoading: boolean;
      error: Error | null;
    } = {
      data: undefined,
      isLoading: true,
      error: null,
    };

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) {
        Promise.resolve(options.queryFn())
          .then((data) => {
            queryResult.data = data;
            queryResult.isLoading = false;
          })
          .catch((err) => {
            queryResult.error = err instanceof Error
              ? err
              : new Error(String(err));
            queryResult.isLoading = false;
          });
      }
      return queryResult;
    });

    const { result } = renderHook(() =>
      useOrganizations({ bounds: mockBounds, limit: 300 })
    );

    await waitFor(() => {
      expect(result.current.data?.length).toBeLessThanOrEqual(200);
    }, { timeout: 3000 });
  });

  it("transforms organizations correctly", async () => {
    const mockOrg = {
      id: "org-1",
      name: "Acme Corp",
      slug: "acme-corp",
      longitude: -71.0589,
      latitude: 42.3601,
      address: { city: "Boston", state: "MA" },
      employee_count_range: "10-50",
      industry_name: "Technology",
    };

    mockReturns.mockResolvedValue({
      data: [mockOrg],
      error: null,
    });

    const queryResult: {
      data: unknown;
      isLoading: boolean;
      error: Error | null;
    } = {
      data: undefined,
      isLoading: true,
      error: null,
    };

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) {
        Promise.resolve(options.queryFn())
          .then((data) => {
            queryResult.data = data;
            queryResult.isLoading = false;
          })
          .catch((err) => {
            queryResult.error = err instanceof Error
              ? err
              : new Error(String(err));
            queryResult.isLoading = false;
          });
      }
      return queryResult;
    });

    const { result } = renderHook(() =>
      useOrganizations({ bounds: mockBounds })
    );

    await waitFor(() => {
      expect(result.current.data?.[0]).toMatchObject({
        id: "org-1",
        name: "Acme Corp",
        industry: "Technology",
        coordinates: [-71.0589, 42.3601],
      });
    }, { timeout: 3000 });
  });

  it("filters out invalid coordinates", async () => {
    const mockOrgs = [
      {
        id: "org-1",
        name: "Valid Org",
        slug: "valid-org",
        longitude: -71.0589,
        latitude: 42.3601,
        address: null,
        employee_count_range: null,
        industry_name: null,
      },
      {
        id: "org-2",
        name: "Invalid Org",
        slug: "invalid-org",
        longitude: null,
        latitude: null,
        address: null,
        employee_count_range: null,
        industry_name: null,
      },
    ];

    mockReturns.mockResolvedValue({
      data: mockOrgs,
      error: null,
    });

    const queryResult: {
      data: unknown;
      isLoading: boolean;
      error: Error | null;
    } = {
      data: undefined,
      isLoading: true,
      error: null,
    };

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) {
        Promise.resolve(options.queryFn())
          .then((data) => {
            queryResult.data = data;
            queryResult.isLoading = false;
          })
          .catch((err) => {
            queryResult.error = err instanceof Error
              ? err
              : new Error(String(err));
            queryResult.isLoading = false;
          });
      }
      return queryResult;
    });

    const { result } = renderHook(() =>
      useOrganizations({ bounds: mockBounds })
    );

    await waitFor(() => {
      // Only valid org should be included
      expect(result.current.data?.length).toBe(1);
      expect(result.current.data?.[0].id).toBe("org-1");
    }, { timeout: 3000 });
  });

  it("handles RPC errors", async () => {
    const error = { message: "RPC error" };
    mockReturns.mockResolvedValue({
      data: null,
      error,
    });

    const queryResult: {
      data: unknown;
      isLoading: boolean;
      error: Error | null;
    } = {
      data: undefined,
      isLoading: true,
      error: null,
    };

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) {
        Promise.resolve(options.queryFn())
          .then(() => {
            queryResult.isLoading = false;
          })
          .catch((err) => {
            queryResult.error = err instanceof Error
              ? err
              : new Error(String(err));
            queryResult.isLoading = false;
          });
      }
      return queryResult;
    });

    const { result } = renderHook(() =>
      useOrganizations({ bounds: mockBounds })
    );

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    }, { timeout: 3000 });
  });

  it("returns empty array for no results", async () => {
    mockReturns.mockResolvedValue({
      data: [],
      error: null,
    });

    const queryResult: {
      data: unknown;
      isLoading: boolean;
      error: Error | null;
    } = {
      data: undefined,
      isLoading: true,
      error: null,
    };

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) {
        Promise.resolve(options.queryFn())
          .then((data) => {
            queryResult.data = data;
            queryResult.isLoading = false;
          })
          .catch((err) => {
            queryResult.error = err instanceof Error
              ? err
              : new Error(String(err));
            queryResult.isLoading = false;
          });
      }
      return queryResult;
    });

    const { result } = renderHook(() =>
      useOrganizations({ bounds: mockBounds })
    );

    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    }, { timeout: 3000 });
  });
});
