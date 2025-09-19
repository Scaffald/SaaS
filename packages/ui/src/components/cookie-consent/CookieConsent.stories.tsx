import { Meta, StoryObj } from '@storybook/react'
import { useRef } from 'react'
import { Button, Paragraph, YStack } from 'tamagui'

import {
  CookieConsentBanner,
  CookieConsentBannerProps,
  CookieConsentProvider,
  CookiePreferencesDialog,
  useCookieConsent,
} from '.'
import { CookieConsentStorage } from './types'

const createStoryStorage = (): CookieConsentStorage => {
  const store = new Map<string, string | null>()
  return {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => {
      store.set(key, value)
    },
    removeItem: async (key) => {
      store.delete(key)
    },
  }
}

const StoryScaffold = (props: CookieConsentBannerProps) => {
  const storageRef = useRef<CookieConsentStorage | null>(null)

  if (!storageRef.current) {
    storageRef.current = createStoryStorage()
  }

  return (
    <CookieConsentProvider storage={storageRef.current} policyVersion="storybook">
      <StoryContent {...props} />
    </CookieConsentProvider>
  )
}

const StoryContent = (props: CookieConsentBannerProps) => {
  const { openPreferences, resetConsent, hasConsentedTo } = useCookieConsent()

  return (
    <YStack f={1} minHeight={640} bg="$color1" jc="center" ai="center" gap="$4" p="$6">
      <YStack gap="$3" ai="center">
        <Paragraph size="$5" fontWeight="600">
          Playground controls
        </Paragraph>
        <Button onPress={openPreferences}>Open manager</Button>
        <Button variant="outlined" onPress={resetConsent}>
          Reset consent
        </Button>
        <Paragraph size="$3" color="$color10">
          Analytics enabled: {hasConsentedTo('performance') ? 'yes' : 'no'}
        </Paragraph>
      </YStack>
      <CookieConsentBanner {...props} />
      <CookiePreferencesDialog />
    </YStack>
  )
}

const meta: Meta<typeof CookieConsentBanner> = {
  title: 'ui/CookieConsent/Banner',
  component: CookieConsentBanner,
  parameters: {
    layout: 'fullscreen',
  },
  render: (props) => <StoryScaffold {...props} />,
}

type Story = StoryObj<typeof CookieConsentBanner>

export const Default: Story = {
  args: {
    privacyPolicyUrl: 'https://example.com/privacy',
  },
}

export default meta
