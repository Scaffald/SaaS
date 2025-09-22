import { CreateOrganizationScreen } from '@app/features/organizations'
import { HomeLayout } from '@app/features/home/layout.web'
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
