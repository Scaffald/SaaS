import { DashboardLayout } from '@app/core/features/dashboard/layout.web'
import { ProfileScreen } from '@app/core/features/profile/screen'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <ProfileScreen />
    </>
  )
}

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
