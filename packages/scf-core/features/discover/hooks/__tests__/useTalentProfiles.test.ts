import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Supabase client - use vi.hoisted
const mockFrom = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn());
const mockGte = vi.hoisted(() => vi.fn());
const mockLte = vi.hoisted(() => vi.fn());
const mockLimit = vi.hoisted(() => vi.fn());
const mockOrder = vi.hoisted(() => vi.fn());
const mockIn = vi.hoisted(() => vi.fn());
const mockSchema = vi.hoisted(() => vi.fn());

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

import {
  buildTalentProfilesQuery,
  useTalentProfiles,
} from '../useTalentProfiles';
import type { ViewportBounds } from '@scaffald/ui';

describe("useTalentProfiles", () => {
  const mockBounds: ViewportBounds = {
    north: 43,
    south: 42,
    east: -70,
    west: -72,
  };

  const runTalentProfilesQuery = (
    options?: { bounds?: ViewportBounds | null; limit?: number },
  ) => {
    const fetchProfiles = buildTalentProfilesQuery(options);
    return fetchProfiles();
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up the chain properly
    mockLimit.mockResolvedValue({
      data: [],
      error: null,
    });
    mockIn.mockResolvedValue({
      data: [],
      error: null,
    });
    mockOrder.mockReturnThis();
    mockLte.mockReturnThis();
    mockGte.mockReturnThis();
    mockSelect.mockReturnValue({
      gte: mockGte,
      lte: mockLte,
      limit: mockLimit,
      order: mockOrder,
      in: mockIn,
    });
    mockFrom.mockReturnValue({
      select: mockSelect,
    });
    mockSchema.mockReturnValue({
      from: mockFrom,
    });

    // Default mock - will be overridden by individual tests
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
  });

  it("includes bounds in queryKey", () => {
    renderHook(() => useTalentProfiles({ bounds: mockBounds }));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["talent-profiles", mockBounds],
      }),
    );
  });

  it("applies bounds filter to Supabase query", async () => {
    mockLimit.mockResolvedValue({
      data: [],
      error: null,
    });

    mockUseQuery.mockImplementation((options) => {
      options.queryFn?.();
      return {
        data: [],
        isLoading: false,
        error: null,
      };
    });

    renderHook(() => useTalentProfiles({ bounds: mockBounds }));

    // Verify bounds filters are applied
    expect(mockGte).toHaveBeenCalledWith("longitude", mockBounds.west);
    expect(mockLte).toHaveBeenCalledWith("longitude", mockBounds.east);
    expect(mockGte).toHaveBeenCalledWith("latitude", mockBounds.south);
    expect(mockLte).toHaveBeenCalledWith("latitude", mockBounds.north);
  });

  it("enforces limit of 500", () => {
    mockLimit.mockResolvedValue({
      data: [],
      error: null,
    });

    mockUseQuery.mockImplementation((options) => {
      options.queryFn?.();
      return {
        data: [],
        isLoading: false,
        error: null,
      };
    });

    renderHook(() => useTalentProfiles({ bounds: mockBounds, limit: 1000 }));

    expect(mockLimit).toHaveBeenCalledWith(500);
  });

  it("transforms profiles correctly", async () => {
    const mockProfile = {
      id: "profile-1",
      name: "John Doe",
      headline: "Software Engineer",
      gamified_score: 85,
      skills_summary: { skills: ["JavaScript", "TypeScript"] },
      certifications: ["AWS Certified"],
      hourly_rate_cents: 5000,
      longitude: -71.0589,
      latitude: 42.3601,
      location: "Boston, MA",
      years_of_experience: 5,
      calculatedYearsOfExperience: 5,
      avatar_url: "https://example.com/avatar.jpg",
    };

    mockLimit.mockResolvedValue({
      data: [mockProfile],
      error: null,
    });

    mockIn.mockResolvedValue({
      data: [
        {
          worker_user_id: "profile-1",
          badge_status: "active",
          badge_expires_at: "2025-01-01",
        },
      ],
      error: null,
    });

    const profiles = await runTalentProfilesQuery({ bounds: mockBounds });

    expect(profiles).toHaveLength(1);
    const profile = profiles[0];
    expect(profile.id).toBe("profile-1");
    expect(profile.name).toBe("John Doe");
    expect(profile.title).toBe("Software Engineer");
    expect(profile.experienceYears).toBe(5);
    expect(profile.hourlyRate).toBe(50);
    expect(profile.coordinates).toEqual([-71.0589, 42.3601]);
    expect(profile.locationLabel).toBe("Boston, MA");
    expect(profile.badges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: expect.stringContaining("ID Verified"),
        }),
        expect.objectContaining({ label: "JavaScript" }),
      ]),
    );
  });

  it("handles database errors", async () => {
    const error = { message: "Database error" };
    mockLimit.mockResolvedValue({
      data: null,
      error,
    });

    await expect(runTalentProfilesQuery({ bounds: mockBounds })).rejects
      .toThrow("Failed to fetch profiles: Database error");
  });

  it("returns empty array for no results", async () => {
    mockLimit.mockResolvedValue({
      data: [],
      error: null,
    });

    const profiles = await runTalentProfilesQuery({ bounds: mockBounds });
    expect(profiles).toEqual([]);
  });

  it("respects enabled flag", () => {
    renderHook(() => useTalentProfiles({ bounds: mockBounds, enabled: false }));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });
});
