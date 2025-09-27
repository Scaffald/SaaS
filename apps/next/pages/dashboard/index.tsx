import { DashboardLayout } from '@app/core/features/dashboard/layout.web'
import { DashboardScreen } from '@app/core/features/dashboard/screen'
import Head from 'next/head'

import type { NextPageWithLayout } from '../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>
      <DashboardScreen />
    </>
  )
}

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
