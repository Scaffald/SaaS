import { DashboardLayout } from '@app/ui'
import { DashboardIndexScreen } from '@app/core/features/dashboard/dashboard-index-screen'
import Head from 'next/head'

import type { NextPageWithLayout } from '../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>
      <DashboardIndexScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <DashboardLayout header={{ title: 'Dashboard' }} rightContent={page} isHomePage={true} />
)

export default Page
