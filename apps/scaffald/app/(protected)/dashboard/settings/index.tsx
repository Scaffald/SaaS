/**
 * Combined Settings page: Notifications, Privacy & Data, Authorized Apps, Account.
 * Single route /dashboard/settings; drawer footer links here.
 */

import { ROUTES } from '@scf/core/constants/routes'
import { ConnectedAccounts } from '@scf/core/features/auth/components/ConnectedAccounts'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { AccountDeletionPanel } from '@scf/core/features/profile/components/AccountDeletionPanel'
import { VanityUrlSection } from '@scf/core/features/profile/components/VanityUrlSection'
import { AuthorizedAppsList } from '@scf/core/features/oauth/components/AuthorizedAppsList'
import { PrivacyDataScreen } from '@scf/core/features/privacy/PrivacyDataScreen'
import { BlockedUsersSection } from '@scf/core/features/moderation'
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
            {/* SC-40: public profile slug + sharing live alongside other
                account settings so workers can find them outside the
                /profile/general accordion. */}
            <Stack gap={12}>
              <Text size="xl">Public profile</Text>
              <Text color="gray">
                Your public profile is shareable via a unique URL. Claim a name,
                review the change history, and share via the Share button on your
                profile screen.
              </Text>
              <VanityUrlSection />
            </Stack>

            <Separator />

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

            {/* #690 — blocking has to be reversible somewhere findable, or it
                is a one-way door only support can open. */}
            <Stack gap={12}>
              <BlockedUsersSection />
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

            <ConnectedAccounts />

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
