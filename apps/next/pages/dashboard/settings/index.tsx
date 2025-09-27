import { DashboardLayout } from '@app/core/features/dashboard/layout.web'
import { SettingsScreen } from '@app/core/features/settings/screen'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Settings</title>
      </Head>
      <SettingsScreen />
    </>
  )
}

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
