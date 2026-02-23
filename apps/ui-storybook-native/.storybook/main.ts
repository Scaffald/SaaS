import type { StorybookConfig } from '@storybook/react-native'

const config: StorybookConfig = {
  stories: ['../../../packages/scaffald-ui/src/stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-ondevice-controls',
    '@storybook/addon-ondevice-actions',
    '@storybook/addon-ondevice-backgrounds',
  ],
}

export default config
