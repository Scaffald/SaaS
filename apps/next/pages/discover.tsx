import Head from 'next/head'

import { DiscoverMapScreen } from '@app/features/discover-map'
import { HomeLayout } from '@app/features/home/layout.web'
import type { NextPageWithLayout } from './_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Discover | Scaffald</title>
      </Head>
      <DiscoverMapScreen />
    </>
  )
}

Page.getLayout = (page) => <HomeLayout fullPage>{page}</HomeLayout>

export default Page
