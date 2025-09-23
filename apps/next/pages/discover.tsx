import Head from 'next/head'

import { DiscoverMapScreen } from '@app/core/features/discover-map'
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

Page.getLayout = (page) => page

export default Page
