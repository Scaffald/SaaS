/**
 * Settings — public profile, appearance, notifications, privacy, connected
 * apps and the account, one folder tab each.
 *
 * It was six stacked sections in one scroll with sans `Text size="xl"` heads
 * (#1212). Each section is now a tab with a heading-styled head and a line on
 * what it is for, and `?section=` opens a tab directly, so the notification
 * inbox's Settings button lands on Notifications here rather than on a second
 * copy of the same preferences.
 */

import { ROUTES } from '@scf/core/constants/routes'
import { useScreenRhythm } from '@scf/core/constants/layout'
import { ConnectedAccounts } from '@scf/core/features/auth/components/ConnectedAccounts'
import { AppearanceSettingsSection } from '@scf/core/features/appearance/AppearanceSettingsSection'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { PhoneChipStrip } from '@scf/core/features/drawer/SectionTabs'
import { BlockedUsersSection } from '@scf/core/features/moderation'
import { SettingsNotificationsSection } from '@scf/core/features/notifications/SettingsNotificationsSection'
import { AuthorizedAppsList } from '@scf/core/features/oauth/components/AuthorizedAppsList'
import { PrivacyDataScreen } from '@scf/core/features/privacy/PrivacyDataScreen'
import { AccountDeletionPanel } from '@scf/core/features/profile/components/AccountDeletionPanel'
import { VanityUrlSection } from '@scf/core/features/profile/components/VanityUrlSection'
import { H3, Separator, Stack, Tabs, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback } from 'react'
import {
  SETTINGS_SECTIONS,
  getSettingsSection,
  isSettingsSectionKey,
  resolveSettingsSection,
  type SettingsSectionKey,
} from './sections'

function SectionBody({ section }: { section: SettingsSectionKey }) {
  switch (section) {
    case 'profile':
      // SC-40: the public profile slug lives with the other account settings
      // so workers can find it outside the /profile/general accordion.
      return <VanityUrlSection />
    case 'appearance':
      return <AppearanceSettingsSection />
    case 'notifications':
      return <SettingsNotificationsSection />
    case 'privacy':
      return (
        <Stack gap={24}>
          <PrivacyDataScreen />
          <Separator />
          {/* #690 — blocking has to be reversible somewhere findable, or it
              is a one-way door only support can open. */}
          <BlockedUsersSection />
        </Stack>
      )
    case 'apps':
      return <AuthorizedAppsList />
    case 'account':
      return (
        <Stack gap={24}>
          <ConnectedAccounts />
          <Separator />
          <AccountDeletionPanel />
        </Stack>
      )
  }
}

export function SettingsScreen() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const { isDesktop } = useScreenRhythm()
  const params = useLocalSearchParams<{ section?: string; linked?: string }>()
  const active = resolveSettingsSection(params)
  const section = getSettingsSection(active)

  // Replace the param rather than push a route: switching tabs is not a
  // navigation Back should step through one tab at a time.
  const select = useCallback(
    (key: string) => {
      if (isSettingsSectionKey(key) && key !== active) router.setParams({ section: key })
    },
    [router, active]
  )

  const tabs = isDesktop ? (
    <Tabs type="folder" value={active} onValueChange={select}>
      {SETTINGS_SECTIONS.map((item) => (
        <Tabs.Item key={item.key} value={item.key}>
          <Tabs.Trigger>{item.label}</Tabs.Trigger>
        </Tabs.Item>
      ))}
    </Tabs>
  ) : (
    // The page column already carries the gutter.
    <PhoneChipStrip
      tabs={SETTINGS_SECTIONS.map((item) => ({ key: item.key, label: item.label }))}
      activeKey={active}
      gutter={0}
      onSelect={select}
      testID="settings-sections"
    />
  )

  return (
    <DashboardPage
      readingWidth
      screenKicker="Your account"
      screenTip="Your public profile, appearance, notifications, privacy and the apps you have connected."
      breadcrumbs={[{ route: ROUTES.DASHBOARD.SETTINGS }]}
      pageTitle="Settings"
      fullWidth
      headerContent={tabs}
      leftContent={
        <Stack gap={24} paddingBottom="xl" testID={`settings-section-${active}`}>
          <Stack gap={4}>
            <H3 style={{ color: colors.text[theme].primary }}>{section.title}</H3>
            <Text style={{ color: colors.text[theme].secondary }}>{section.tip}</Text>
          </Stack>
          <SectionBody section={active} />
        </Stack>
      }
    />
  )
}
