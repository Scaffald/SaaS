import { DashboardLayout } from '@app/ui'
import { DashboardIndexLeft } from '@app/core/features/dashboard/dashboard-index-left'
import { DashboardIndexRight } from '@app/core/features/dashboard/dashboard-index-right'
import Head from 'next/head'

import type { NextPageWithLayout } from '../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>
      <DashboardIndexRight />
    </>
  )
}

Page.getLayout = (page) => (
  <DashboardLayout
    header={{ title: 'Dashboard' }}
    leftContent={<DashboardIndexLeft />}
    rightContent={page}
    leftWidth="61.8%"
    isHomePage={true}
  />
)

export default Page
