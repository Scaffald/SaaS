import { CreateOrganizationScreen } from '@app/core/features/organizations'
import { HomeLayout } from '@app/core/features/home/layout.web'
import Head from 'next/head'

import type { NextPageWithLayout } from '../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Create organization</title>
      </Head>
      <CreateOrganizationScreen />
    </>
  )
}

Page.getLayout = (page) => <HomeLayout padded>{page}</HomeLayout>

export default Page
