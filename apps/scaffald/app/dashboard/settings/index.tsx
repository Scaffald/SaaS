/**
 * Combined Settings page: Notifications, Privacy & Data, Authorized Apps, Account.
 * Single route /dashboard/settings; drawer footer links here.
 */

import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { AccountDeletionPanel } from '@scf/core/features/profile/components/AccountDeletionPanel'
import { AuthorizedAppsList } from '@scf/core/features/oauth/components/AuthorizedAppsList'
import { PrivacyDataScreen } from '@scf/core/features/privacy/PrivacyDataScreen'
import { Separator, Stack, Text } from '@scaffald/ui'
import { ScrollView } from 'react-native'

import { SettingsNotificationsSection } from '@scf/core/features/notifications/SettingsNotificationsSection'

const sectionGap = 40

export default function SettingsPage() {
  return (
    <DashboardPage
      breadcrumbs={[{ route: ROUTES.DASHBOARD.SETTINGS }]}
      pageTitle="Settings"
      fullWidth
      leftContent={
        <ScrollView>
          <Stack gap={sectionGap} paddingBottom="xl">
            <SettingsNotificationsSection />

            <Separator />

            <Stack gap={12}>
              <Text size="xl">Privacy & Data</Text>
              <Text color="gray">
                View and manage your data, export requests, and privacy preferences.
              </Text>
              <PrivacyDataScreen />
            </Stack>

            <Separator />

            <Stack gap={12}>
              <Text size="xl">Authorized Applications</Text>
              <Text color="gray">
                Apps that have access to your account. Revoke access at any time.
              </Text>
              <AuthorizedAppsList />
            </Stack>

            <Separator />

            <Stack gap={12}>
              <Text size="xl">Account</Text>
              <AccountDeletionPanel />
            </Stack>
          </Stack>
        </ScrollView>
      }
    />
  )
}
