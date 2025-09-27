import { CommunityReviewsScreen } from '@app/core/features/community'
import { DashboardLayout } from '@app/ui'
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

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
