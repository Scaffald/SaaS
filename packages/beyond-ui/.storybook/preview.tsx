import type { Preview } from '@storybook/react'
import { ThemeProvider } from '../src/theme'
import { colors } from '../src/tokens/colors'

// Load Roboto font
if (typeof document !== 'undefined') {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;600&family=Roboto+Serif:wght@400;500;600&display=swap'
  document.head.appendChild(link)
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: colors.bg.light.default,
        },
        {
          name: 'dark',
          value: colors.bg.dark.default,
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1280px',
            height: '800px',
          },
        },
      },
    },
  },
  decorators: [
    (Story, context) => {
      // Get theme from globalTypes or default to light
      const theme = (context.globals?.theme as 'light' | 'dark') || 'light'

      return (
        <ThemeProvider initialTheme={theme}>
          <Story />
        </ThemeProvider>
      )
    },
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'circlehollow' },
          { value: 'dark', title: 'Dark', icon: 'circle' },
        ],
        dynamicTitle: true,
      },
    },
  },
}

export default preview

