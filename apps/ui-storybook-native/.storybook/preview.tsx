import type { Preview, ReactNativeFramework } from '@storybook/react-native'
import type { DecoratorFunction } from '@storybook/types'
import { ThemeProvider } from '@scaffald/ui'

// Wrap each story in a ThemeProvider so that beyond-ui components have access to theme context
const withTheme: DecoratorFunction<ReactNativeFramework> = (Story, context) => {
  const theme = (context.globals?.theme as 'light' | 'dark') || 'light'
  return (
    <ThemeProvider initialTheme={theme}>
      <Story />
    </ThemeProvider>
  )
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
  },
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
  },
}

export default preview
