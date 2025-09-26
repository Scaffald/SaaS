import Head from 'next/head'

import { CommunityDirectoryScreen } from '@app/core/features/community'
import { HomeLayout } from '@app/core/features/home/layout.web'

import type { NextPageWithLayout } from '../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Community | Scaffald</title>
      </Head>
      <CommunityDirectoryScreen />
    </>
  )
}

Page.getLayout = (page) => <HomeLayout>{page}</HomeLayout>

export default Page
