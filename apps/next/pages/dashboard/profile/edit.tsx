import { HomeLayout } from '@app/core/features/home/layout.web'
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

Page.getLayout = (page) => <HomeLayout>{page}</HomeLayout>

export default Page
