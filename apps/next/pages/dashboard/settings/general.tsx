import { DashboardLayout } from '@app/ui'
import { GeneralSettingsScreen } from '@app/core/features/settings/general-screen'
import { SettingsLayout } from '@app/core/features/settings/layout.web'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>General Settings</title>
      </Head>
      <GeneralSettingsScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <DashboardLayout fullPage>
    <SettingsLayout>{page}</SettingsLayout>
  </DashboardLayout>
)

export default Page
