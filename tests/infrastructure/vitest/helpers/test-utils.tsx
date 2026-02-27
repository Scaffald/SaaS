import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { FormTestWrapper } from './form-setup';
import { BeyondUIThemeWrapper } from './theme-setup';

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

