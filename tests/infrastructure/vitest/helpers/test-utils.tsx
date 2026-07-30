import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FormTestWrapper } from './form-setup';
import { BeyondUIThemeWrapper } from './theme-setup';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/**
 * Safe-area metrics for jsdom.
 *
 * `useSafeAreaInsets()` throws "No safe area value available" unless a provider
 * is above it, and in jsdom the provider never measures a frame — so it has to
 * be seeded. These are the library's own documented test/SSR values: a 390x844
 * viewport with zero insets. No test asserts on inset values, so zeros keep
 * layout assertions independent of device chrome.
 */
const TEST_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export function TestQueryWrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
        {children}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

/**
 * Options for custom render function
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Whether to wrap with theme provider (Beyond-UI)
   */
  withTheme?: boolean;
  /**
   * Whether to wrap with React Hook Form provider
   */
  withForm?: boolean;
  /**
   * Form options if withForm is true
   */
  formOptions?: Parameters<typeof FormTestWrapper>[0]['formOptions'];
}

/**
 * Custom render function that includes common providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {},
) {
  const {
    withTheme = true,
    withForm = false,
    formOptions,
    ...renderOptions
  } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    let content = children;

    if (withForm) {
      content = (
        <FormTestWrapper formOptions={formOptions}>
          {content}
        </FormTestWrapper>
      );
    }

    if (withTheme) {
      content = <BeyondUIThemeWrapper>{content}</BeyondUIThemeWrapper>;
    }

    // Always wrap with QueryClientProvider
    content = <TestQueryWrapper>{content}</TestQueryWrapper>;

    return <>{content}</>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Re-export everything from @testing-library/react
 */
export * from '@testing-library/react';

/**
 * Override render to use our custom render by default
 */
export { renderWithProviders as render };

