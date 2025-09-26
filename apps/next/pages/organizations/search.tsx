import { HomeLayout } from '@app/core/features/home/layout.web'
import { OrganizationsLayout } from '@app/core/features/organizations/layout.web'
import { OrganizationsSearchScreen } from '@app/core/features/organizations'
import Head from 'next/head'

import type { NextPageWithLayout } from '../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Search organizations</title>
      </Head>
      <OrganizationsSearchScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <HomeLayout fullPage>
    <OrganizationsLayout>{page}</OrganizationsLayout>
  </HomeLayout>
)

export default Page
