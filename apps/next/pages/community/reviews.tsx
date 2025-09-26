import Head from 'next/head'

import { CommunityReviewsScreen } from '@app/core/features/community'
import { HomeLayout } from '@app/core/features/home/layout.web'

import type { NextPageWithLayout } from '../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Peer Reviews | Scaffald</title>
      </Head>
      <CommunityReviewsScreen />
    </>
  )
}

Page.getLayout = (page) => <HomeLayout>{page}</HomeLayout>

export default Page
