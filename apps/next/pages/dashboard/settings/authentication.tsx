import { DashboardLayout } from '@app/core/features/dashboard/layout.web'
import { ChangePasswordScreen } from '@app/core/features/settings/change-password-screen'
import { SettingsLayout } from '@app/core/features/settings/layout.web'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Authentication Settings</title>
      </Head>
      <ChangePasswordScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <DashboardLayout fullPage>
    <SettingsLayout>{page}</SettingsLayout>
  </DashboardLayout>
)

export default Page
