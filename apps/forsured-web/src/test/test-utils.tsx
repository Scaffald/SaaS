/**
 * Custom test utilities for React component testing
 * Provides a customized render function with common providers
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '@unicornlove/ui';

/**
 * All providers that wrap the app in production should be included here
 * This ensures components are tested in the same environment as production
 */
interface AllTheProvidersProps {
  children: ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <BrowserRouter>
        {/* Add other providers here as they are created:
         * - AuthProvider
         * - ThemeProvider
         * - QueryClientProvider (React Query)
         * - etc.
         */}
        {children}
      </BrowserRouter>
    </TamaguiProvider>
  );
}

/**
 * Provider wrapper without BrowserRouter for tests that need custom routing setup
 * Use this when your test needs to provide its own router (e.g., MemoryRouter with initial entries)
 */
function ProvidersWithoutRouter({ children }: AllTheProvidersProps) {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      {children}
    </TamaguiProvider>
  );
}

/**
 * Custom render function that wraps components with all providers
 * Use this instead of @testing-library/react's render in tests
 *
 * @example
 * import { render, screen } from '@/test/test-utils';
 *
 * test('renders component', () => {
 *   render(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Custom render function without BrowserRouter
 * Use this when your test needs to provide its own router setup
 *
 * @example
 * import { renderWithoutRouter, screen } from '@/test/test-utils';
 * import { MemoryRouter, Routes, Route } from 'react-router-dom';
 *
 * test('renders with custom router', () => {
 *   renderWithoutRouter(
 *     <MemoryRouter initialEntries={['/clients/123']}>
 *       <Routes>
 *         <Route path="/clients/:id" element={<MyComponent />} />
 *       </Routes>
 *     </MemoryRouter>
 *   );
 *   expect(screen.getByText('Client 123')).toBeInTheDocument();
 * });
 */
function renderWithoutRouter(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: ProvidersWithoutRouter, ...options });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Override render with our custom version
export { customRender as render };

// Export render without router for tests that need custom routing
export { renderWithoutRouter };
