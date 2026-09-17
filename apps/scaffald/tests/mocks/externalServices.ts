/**
 * External Service Mocks
 *
 * Testing principle: only mock external services.
 * Never mock internal systems (database, tRPC, Supabase).
 *
 * This file contains mocks for third-party APIs and services that
 * Scaffald integrates with. Each mock should match the real API's
 * interface as closely as possible.
 *
 * All mocks are validated by the Mock Validation Framework before
 * tests run to ensure they stay in sync with real implementations.
 */

import { vi } from "vitest";

/**
 * Mapbox Mock (for @rnmapbox/maps)
 * Used for geocoding and map services
 */
export const mockMapbox = {
  geocode: {
    forward: vi.fn(async (query: string) => {
      console.log("[Mock Mapbox] Geocoding:", query);
      return {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            place_name: query,
            geometry: {
              type: "Point",
              coordinates: [-122.4194, 37.7749], // San Francisco
            },
            properties: {},
          },
        ],
      };
    }),
    reverse: vi.fn(async (longitude: number, latitude: number) => {
      console.log("[Mock Mapbox] Reverse geocoding:", { longitude, latitude });
      return {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            place_name: "San Francisco, CA, USA",
            geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            properties: {},
          },
        ],
      };
    }),
  },
};

/**
 * Google Sign-In Mock
 * Used for OAuth authentication
 */
export const mockGoogleSignIn = {
  configure: vi.fn((config: { webClientId: string }) => {
    console.log("[Mock Google Sign-In] Configured with:", config);
  }),
  hasPlayServices: vi.fn(async () => {
    console.log("[Mock Google Sign-In] Checking Play Services");
    return true;
  }),
  signIn: vi.fn(async () => {
    console.log("[Mock Google Sign-In] Signing in");
    return {
      idToken: "mock-id-token",
      user: {
        id: "mock-user-id",
        email: "test@example.com",
        name: "Test User",
        photo: "https://example.com/photo.jpg",
      },
    };
  }),
  signOut: vi.fn(async () => {
    console.log("[Mock Google Sign-In] Signing out");
  }),
  isSignedIn: vi.fn(async () => {
    console.log("[Mock Google Sign-In] Checking sign-in status");
    return false;
  }),
};

/**
 * Helper: Clear all external service mocks
 * Call this in afterEach to reset mock state between tests
 */
export function clearExternalServiceMocks(): void {

  mockMapbox.geocode.forward.mockClear();
  mockMapbox.geocode.reverse.mockClear();

  mockGoogleSignIn.configure.mockClear();
  mockGoogleSignIn.hasPlayServices.mockClear();
  mockGoogleSignIn.signIn.mockClear();
  mockGoogleSignIn.signOut.mockClear();
  mockGoogleSignIn.isSignedIn.mockClear();
}


/**
 * Helper: Assert Google Sign-In was called
 */
export function assertGoogleSignInCalled(): void {
  if (mockGoogleSignIn.signIn.mock.calls.length === 0) {
    throw new Error("Expected Google Sign-In to be called, but it was not");
  }
}

/**
 * Helper: Assert Mapbox geocoding was called with query
 */
export function assertMapboxGeocodeCalled(query: string): void {
  const calls = mockMapbox.geocode.forward.mock.calls;
  const found = calls.some(([q]) => q === query);
  if (!found) {
    throw new Error(
      `Expected Mapbox geocode to be called with "${query}", ` +
        `but found: ${calls.map(([q]) => q).join(", ")}`,
    );
  }
}
