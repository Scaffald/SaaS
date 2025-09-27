import { DiscoverMapScreen } from '@app/core/features/discover-map'
import { HomeLayout } from '@app/core/features/home/layout.web'
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

Page.getLayout = (page) => <HomeLayout>{page}</HomeLayout>

export default Page
