/**
 * Custom test utilities for React Native component testing
 * Provides a customized render function with common providers
 *
 * Note: React Native is aliased to react-native-web in vitest.config.ts
 * for testing in Node.js/jsdom environment
 */

import { render, RenderOptions } from '@testing-library/react-native';
import { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from '@tamagui/core';
import { config } from '@unicornlove/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Create a new QueryClient for each test to ensure isolation
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * All providers that wrap the app in production should be included here
 * This ensures components are tested in the same environment as production
 */
interface AllTheProvidersProps {
  children: ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <SafeAreaProvider>
      <TamaguiProvider config={config} defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          {/* Add other providers here as they are created:
           * - AuthProvider
           * - NavigationContainer (for navigation-dependent components)
           * - etc.
           */}
          {children}
        </QueryClientProvider>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}

/**
 * Provider wrapper without SafeAreaProvider for tests that need custom setup
 * Use this when your test needs to provide its own SafeAreaProvider with custom insets
 */
function ProvidersWithoutSafeArea({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </TamaguiProvider>
  );
}

/**
 * Custom render function that wraps components with all providers
 * Use this instead of @testing-library/react-native's render in tests
 *
 * @example
 * import { render, screen } from '../tests/test-utils';
 *
 * test('renders component', () => {
 *   render(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeTruthy();
 * });
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Custom render function without SafeAreaProvider
 * Use this when your test needs to provide its own SafeAreaProvider setup
 *
 * @example
 * import { renderWithoutSafeArea, screen } from '../tests/test-utils';
 * import { SafeAreaProvider } from 'react-native-safe-area-context';
 *
 * test('renders with custom safe area', () => {
 *   renderWithoutSafeArea(
 *     <SafeAreaProvider initialMetrics={{ insets: { top: 50, bottom: 0, left: 0, right: 0 }, frame: { x: 0, y: 0, width: 390, height: 844 } }}>
 *       <MyComponent />
 *     </SafeAreaProvider>
 *   );
 *   expect(screen.getByText('Content')).toBeTruthy();
 * });
 */
function renderWithoutSafeArea(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: ProvidersWithoutSafeArea, ...options });
}

// Re-export everything from @testing-library/react-native
export * from '@testing-library/react-native';

// Override render with our custom version
export { customRender as render };

// Export render without safe area for tests that need custom setup
export { renderWithoutSafeArea };

// Export test query client creator for advanced use cases
export { createTestQueryClient };
