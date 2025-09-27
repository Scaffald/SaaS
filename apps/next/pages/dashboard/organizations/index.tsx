import { DashboardLayout } from '@app/ui'
import { OrganizationsDirectoryScreen } from '@app/core/features/organizations'
import Head from 'next/head'

import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Organizations</title>
      </Head>
      <OrganizationsDirectoryScreen />
    </>
  )
}

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
