import { CreateOrganizationScreen } from '@app/core/features/organizations'
import { DashboardLayout } from '@app/ui'
import Head from 'next/head'

import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Create Organization</title>
      </Head>
      <CreateOrganizationScreen />
    </>
  )
}

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
