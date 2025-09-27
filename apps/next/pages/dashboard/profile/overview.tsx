import { DashboardLayout } from '@app/core/features/dashboard/layout.web'
import { ProfileOverviewScreen } from '@app/core/features/profile/overview-screen'
import { ProfileLayoutSimple } from '@app/core/features/profile/layout-simple.web'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Profile Overview</title>
      </Head>
      <ProfileOverviewScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <DashboardLayout fullPage>
    <ProfileLayoutSimple>{page}</ProfileLayoutSimple>
  </DashboardLayout>
)

export default Page
