import { CommunityReviewsScreen } from '@app/core/features/community'
import { HomeLayout } from '@app/core/features/home/layout.web'
import Head from 'next/head'

import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Community Reviews</title>
      </Head>
      <CommunityReviewsScreen />
    </>
  )
}

Page.getLayout = (page) => <HomeLayout>{page}</HomeLayout>

export default Page
