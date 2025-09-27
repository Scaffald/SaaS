import { DashboardLayout } from '@app/ui'
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
  <DashboardLayout fullPage>
    <OrganizationsLayout>{page}</OrganizationsLayout>
  </DashboardLayout>
)

export default Page
