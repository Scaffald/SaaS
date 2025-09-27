import { DashboardLayout } from '@app/core/features/dashboard/layout.web'
import { ChangeEmailScreen } from '@app/core/features/settings/change-email-screen'
import { SettingsLayout } from '@app/core/features/settings/layout.web'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Security Settings</title>
      </Head>
      <ChangeEmailScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <DashboardLayout fullPage>
    <SettingsLayout>{page}</SettingsLayout>
  </DashboardLayout>
)

export default Page
