import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

export function TestQueryWrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
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

