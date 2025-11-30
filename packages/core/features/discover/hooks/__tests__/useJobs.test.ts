import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFrom = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());
const mockLimit = vi.hoisted(() => vi.fn());
const mockSchema = vi.hoisted(() => vi.fn());
const mockReturns = vi.hoisted(() => vi.fn());

const mockSupabaseClient = vi.hoisted(() => ({
  schema: mockSchema,
}));

vi.mock("@app/core/utils/supabase/client", () => ({
  supabase: mockSupabaseClient,
}));

import { buildJobsQuery } from "../useJobs";
import type { ViewportBounds } from "@scaffald/neue-ui";

describe("buildJobsQuery", () => {
  const mockBounds: ViewportBounds = {
    north: 43,
    south: 42,
    east: -70,
    west: -72,
  };

  const runJobsQuery = (
    options?: { bounds?: ViewportBounds | null; limit?: number },
  ) => {
    const fetchJobs = buildJobsQuery(options);
    return fetchJobs();
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockReturns.mockResolvedValue({
      data: [],
      error: null,
    });
    mockLimit.mockReturnThis();
    mockEq.mockReturnThis();
    mockSelect.mockReturnValue({
      eq: mockEq,
      limit: mockLimit,
      returns: mockReturns,
    });
    mockFrom.mockReturnValue({
      select: mockSelect,
    });
    mockSchema.mockReturnValue({
      from: mockFrom,
    });
  });

  it('filters by status="open"', async () => {
    await runJobsQuery({ bounds: mockBounds });
    expect(mockEq).toHaveBeenCalledWith("status", "open");
  });

  it("filters jobs by bounds in memory", async () => {
    const mockJobs = [
      {
        id: "job-1",
        title: "Software Engineer",
        organization_id: "org-1",
        employment_type: "full-time",
        remote_option: "hybrid",
        location: "Boston, MA",
        address: {
          longitude: -71.0589,
          latitude: 42.3601,
          city: "Boston",
          state: "MA",
        },
        pay_range_min_cents: 50000,
        pay_range_max_cents: 80000,
        pay_range_type: "annual",
        status: "open",
        position_level: "mid",
        organizations: { name: "Acme Corp" },
      },
      {
        id: "job-2",
        title: "Designer",
        organization_id: "org-2",
        employment_type: null,
        remote_option: null,
        location: "New York, NY",
        address: {
          longitude: -100,
          latitude: 50,
        },
        pay_range_min_cents: null,
        pay_range_max_cents: null,
        pay_range_type: null,
        status: "open",
        position_level: null,
        organizations: null,
      },
    ];

    mockReturns.mockResolvedValue({
      data: mockJobs,
      error: null,
    });

    const jobs = await runJobsQuery({ bounds: mockBounds });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe("job-1");
  });

  it("enforces limit of 500", async () => {
    await runJobsQuery({ bounds: mockBounds, limit: 1000 });
    expect(mockLimit).toHaveBeenCalledWith(500);
  });

  it("transforms jobs correctly", async () => {
    const mockJob = {
      id: "job-1",
      title: "Software Engineer",
      organization_id: "org-1",
      employment_type: "full-time",
      remote_option: "hybrid",
      location: "Boston, MA",
      address: {
        longitude: -71.0589,
        latitude: 42.3601,
        city: "Boston",
        state: "MA",
      },
      pay_range_min_cents: 50000,
      pay_range_max_cents: 80000,
      pay_range_type: "annual",
      status: "open",
      position_level: "mid",
      organizations: { name: "Acme Corp" },
    };

    mockReturns.mockResolvedValue({
      data: [mockJob],
      error: null,
    });

    const jobs = await runJobsQuery({ bounds: mockBounds });
    expect(jobs[0]).toMatchObject({
      id: "job-1",
      title: "Software Engineer",
      organization_name: "Acme Corp",
      coordinates: [-71.0589, 42.3601],
      status: "open",
    });
  });

  it("extracts coordinates from address JSONB", async () => {
    const mockJob = {
      id: "job-1",
      title: "Engineer",
      organization_id: "org-1",
      employment_type: null,
      remote_option: null,
      location: null,
      address: {
        longitude: -71.0589,
        latitude: 42.3601,
      },
      pay_range_min_cents: null,
      pay_range_max_cents: null,
      pay_range_type: null,
      status: "open",
      position_level: null,
      organizations: null,
    };

    mockReturns.mockResolvedValue({
      data: [mockJob],
      error: null,
    });

    const jobs = await runJobsQuery({ bounds: mockBounds });
    expect(jobs[0].coordinates).toEqual([-71.0589, 42.3601]);
  });

  it("filters out jobs without valid coordinates", async () => {
    const mockJobs = [
      {
        id: "job-1",
        title: "Valid Job",
        organization_id: "org-1",
        employment_type: null,
        remote_option: null,
        location: null,
        address: {
          longitude: -71.0589,
          latitude: 42.3601,
        },
        pay_range_min_cents: null,
        pay_range_max_cents: null,
        pay_range_type: null,
        status: "open",
        position_level: null,
        organizations: null,
      },
      {
        id: "job-2",
        title: "Invalid Job",
        organization_id: "org-2",
        employment_type: null,
        remote_option: null,
        location: null,
        address: null,
        pay_range_min_cents: null,
        pay_range_max_cents: null,
        pay_range_type: null,
        status: "open",
        position_level: null,
        organizations: null,
      },
    ];

    mockReturns.mockResolvedValue({
      data: mockJobs,
      error: null,
    });

    const jobs = await runJobsQuery({ bounds: mockBounds });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe("job-1");
  });

  it("handles database errors", async () => {
    const error = { message: "Database error" };
    mockReturns.mockResolvedValue({
      data: null,
      error,
    });

    await expect(runJobsQuery({ bounds: mockBounds })).rejects.toThrow(
      "Failed to fetch jobs: Database error",
    );
  });

  it("returns empty array for no results", async () => {
    mockReturns.mockResolvedValue({
      data: [],
      error: null,
    });

    const jobs = await runJobsQuery({ bounds: mockBounds });
    expect(jobs).toEqual([]);
  });
});
