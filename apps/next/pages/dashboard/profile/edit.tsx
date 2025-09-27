import { DashboardLayout } from '@app/core/features/dashboard/layout.web'
import { EditProfileScreen } from '@app/core/features/profile/edit-screen'
import Head from 'next/head'

import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Edit Profile</title>
      </Head>
      <EditProfileScreen />
    </>
  )
}

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
