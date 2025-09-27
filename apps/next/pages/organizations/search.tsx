import { DashboardLayout } from '@app/ui'
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
  <DashboardLayout fullPage>
    <OrganizationsLayout>{page}</OrganizationsLayout>
  </DashboardLayout>
)

export default Page
