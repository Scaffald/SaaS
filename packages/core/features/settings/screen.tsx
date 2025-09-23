import {
  Paragraph,
  ScrollView,
  Separator,
  Settings,
  YStack,
  isWeb,
  useCookieConsent,
  useMedia,
} from '@app/ui'
import { Cog, Cookie, Lock, LogOut, Mail, Moon } from '@tamagui/lucide-icons'
import { useThemeSetting } from '@app/core/provider/theme'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { usePathname } from '@app/core/utils/usePathname'
import { useLink } from 'solito/link'

import rootPackageJson from '../../../../package.json'
import packageJson from '../../package.json'

export const SettingsScreen = () => {
  const media = useMedia()
  const pathname = usePathname()
  const { openPreferences, consentState, isReady } = useCookieConsent()

  return (
    <YStack f={1}>
      <ScrollView>
        <Settings>
          <Settings.Items>
            <Settings.Group $gtSm={{ space: '$1' }}>
              <Settings.Item
                icon={Cog}
                isActive={pathname === 'settings/general'}
                {...useLink({ href: media.sm ? '/settings/general' : '/settings' })}
                accentTheme="green"
              >
                General
              </Settings.Item>
              <Settings.Item
                icon={Lock}
                isActive={pathname === '/settings/change-password'}
                {...useLink({ href: '/settings/change-password' })}
                accentTheme="green"
              >
                Change Password
              </Settings.Item>
              <Settings.Item
                icon={Mail}
                isActive={pathname === '/settings/change-email'}
                {...useLink({ href: '/settings/change-email' })}
                accentTheme="green"
              >
                Change Email
              </Settings.Item>
            </Settings.Group>
            {isWeb && <Separator boc="$color3" mx="$-4" bw="$0.25" />}
            <Settings.Group>
              <Settings.Item
                icon={Cookie}
                accentTheme="purple"
                onPress={isReady ? openPreferences : undefined}
                rightLabel={consentState ? 'Updated' : 'Review'}
              >
                Manage Cookies
              </Settings.Item>
            </Settings.Group>
            {isWeb && <Separator boc="$color3" mx="$-4" bw="$0.25" />}
            <Settings.Group>
              <SettingsThemeAction />
              <SettingsItemLogoutAction />
            </Settings.Group>
          </Settings.Items>
        </Settings>
      </ScrollView>
      {/*
      NOTE: you should probably get the actual native version here using https://www.npmjs.com/package/react-native-version-info
      we just did a simple package.json read since we want to keep things simple for the starter
       */}
      <Paragraph py="$2" ta="center" theme="alt2">
        {rootPackageJson.name} {packageJson.version}
      </Paragraph>
    </YStack>
  )
}

const SettingsThemeAction = () => {
  const { toggle, current } = useThemeSetting()

  return (
    <Settings.Item icon={Moon} accentTheme="blue" onPress={toggle} rightLabel={current}>
      Theme
    </Settings.Item>
  )
}

const SettingsItemLogoutAction = () => {
  const supabase = useSupabase()

  return (
    <Settings.Item icon={LogOut} accentTheme="red" onPress={() => supabase.auth.signOut()}>
      Log Out
    </Settings.Item>
  )
}
