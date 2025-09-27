import { DashboardLayout } from '@app/ui'
import { GeneralSettingsScreen } from '@app/core/features/settings/general-screen'
import { SettingsLayout } from '@app/core/features/settings/layout-refactored.web'
import Head from 'next/head'
import type { NextPageWithLayout } from 'pages/_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Settings - Refactored Example</title>
      </Head>
      <GeneralSettingsScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <DashboardLayout fullPage>
    <SettingsLayout isSettingsHome>{page}</SettingsLayout>
  </DashboardLayout>
)

export default Page
