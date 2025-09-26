import { HomeLayout } from '@app/core/features/home/layout.web'
import { OrganizationsLandingScreen } from '@app/core/features/organizations'
import { OrganizationsLayout } from '@app/core/features/organizations/layout.web'
import Head from 'next/head'

import type { NextPageWithLayout } from '../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Organizations</title>
      </Head>
      <OrganizationsLandingScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <HomeLayout fullPage>
    <OrganizationsLayout isOrganizationsHome>{page}</OrganizationsLayout>
  </HomeLayout>
)

export default Page
