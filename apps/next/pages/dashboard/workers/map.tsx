import { DiscoverMapScreen } from '@app/core/features/discover-map'
import { DashboardLayout } from '@app/core/features/dashboard/layout.web'
import Head from 'next/head'

import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Workers Map</title>
      </Head>
      <DiscoverMapScreen />
    </>
  )
}

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
