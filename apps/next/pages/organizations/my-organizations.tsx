import { HomeLayout } from '@app/core/features/home/layout.web'
import { OrganizationsDirectoryScreen } from '@app/core/features/organizations'
import { OrganizationsLayout } from '@app/core/features/organizations/layout.web'
import Head from 'next/head'

import type { NextPageWithLayout } from '../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>My organizations</title>
      </Head>
      <OrganizationsDirectoryScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <HomeLayout fullPage>
    <OrganizationsLayout>{page}</OrganizationsLayout>
  </HomeLayout>
)

export default Page
