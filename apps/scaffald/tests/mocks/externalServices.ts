/**
 * External Service Mocks
 *
 * REQ-9 Testing Principle: ONLY mock external services.
 * Never mock internal systems (database, tRPC, Supabase).
 *
 * This file contains mocks for third-party APIs and services that
 * Scaffald integrates with. Each mock should match the real API's
 * interface as closely as possible.
 *
 * All mocks are validated by the Mock Validation Framework before
 * tests run to ensure they stay in sync with real implementations.
 */

import { vi } from 'vitest';

/**
 * Sentry Mock
 * Used for error tracking and monitoring
 */
export const mockSentry = {
  init: vi.fn(),
  captureException: vi.fn((error: Error) => {
    console.log('[Mock Sentry] Captured exception:', error.message);
    return 'mock-event-id';
  }),
  captureMessage: vi.fn((message: string) => {
    console.log('[Mock Sentry] Captured message:', message);
    return 'mock-event-id';
  }),
  setUser: vi.fn((user: { id: string; email?: string }) => {
    console.log('[Mock Sentry] Set user:', user);
  }),
  setContext: vi.fn((name: string, context: Record<string, unknown>) => {
    console.log('[Mock Sentry] Set context:', name, context);
  }),
  addBreadcrumb: vi.fn((breadcrumb: { message: string; level?: string; category?: string }) => {
    console.log('[Mock Sentry] Added breadcrumb:', breadcrumb);
  }),
};

/**
 * Mapbox Mock (for @rnmapbox/maps)
 * Used for geocoding and map services
 */
export const mockMapbox = {
  geocode: {
    forward: vi.fn(async (query: string) => {
      console.log('[Mock Mapbox] Geocoding:', query);
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            place_name: query,
            geometry: {
              type: 'Point',
              coordinates: [-122.4194, 37.7749], // San Francisco
            },
            properties: {},
          },
        ],
      };
    }),
    reverse: vi.fn(async (longitude: number, latitude: number) => {
      console.log('[Mock Mapbox] Reverse geocoding:', { longitude, latitude });
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            place_name: 'San Francisco, CA, USA',
            geometry: {
              type: 'Point',
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
    console.log('[Mock Google Sign-In] Configured with:', config);
  }),
  hasPlayServices: vi.fn(async () => {
    console.log('[Mock Google Sign-In] Checking Play Services');
    return true;
  }),
  signIn: vi.fn(async () => {
    console.log('[Mock Google Sign-In] Signing in');
    return {
      idToken: 'mock-id-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        name: 'Test User',
        photo: 'https://example.com/photo.jpg',
      },
    };
  }),
  signOut: vi.fn(async () => {
    console.log('[Mock Google Sign-In] Signing out');
  }),
  isSignedIn: vi.fn(async () => {
    console.log('[Mock Google Sign-In] Checking sign-in status');
    return false;
  }),
};

/**
 * Helper: Clear all external service mocks
 * Call this in afterEach to reset mock state between tests
 */
export function clearExternalServiceMocks(): void {
  mockSentry.captureException.mockClear();
  mockSentry.captureMessage.mockClear();
  mockSentry.setUser.mockClear();
  mockSentry.setContext.mockClear();
  mockSentry.addBreadcrumb.mockClear();

  mockMapbox.geocode.forward.mockClear();
  mockMapbox.geocode.reverse.mockClear();

  mockGoogleSignIn.configure.mockClear();
  mockGoogleSignIn.hasPlayServices.mockClear();
  mockGoogleSignIn.signIn.mockClear();
  mockGoogleSignIn.signOut.mockClear();
  mockGoogleSignIn.isSignedIn.mockClear();
}

/**
 * Helper: Assert Sentry exception was captured
 */
export function assertSentryCaptured(errorMessage: string): void {
  const calls = mockSentry.captureException.mock.calls;
  const found = calls.some(([error]) => error.message.includes(errorMessage));
  if (!found) {
    throw new Error(
      `Expected Sentry to capture error containing "${errorMessage}", ` +
      `but found: ${calls.map(([e]) => e.message).join(', ')}`
    );
  }
}

/**
 * Helper: Assert Google Sign-In was called
 */
export function assertGoogleSignInCalled(): void {
  if (mockGoogleSignIn.signIn.mock.calls.length === 0) {
    throw new Error('Expected Google Sign-In to be called, but it was not');
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
      `but found: ${calls.map(([q]) => q).join(', ')}`
    );
  }
}
