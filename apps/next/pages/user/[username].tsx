import { HomeLayout } from '@app/core/features/home/layout.web'
import { PublicProfileScreen } from '@app/core/features/profile/public-profile-screen'
import Head from 'next/head'

import type { NextPageWithLayout } from '../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Public Profile</title>
      </Head>
      <PublicProfileScreen />
    </>
  )
}

Page.getLayout = (page) => <HomeLayout headerTitle="Public profile">{page}</HomeLayout>

export default Page
