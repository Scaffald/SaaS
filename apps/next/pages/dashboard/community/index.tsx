import Head from 'next/head'

import { CommunityDirectoryScreen } from '@app/core/features/community'
import { DashboardLayout } from '@app/core/features/dashboard/layout.web'

import type { NextPageWithLayout } from '../../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Community | Scaffald</title>
      </Head>
      <CommunityDirectoryScreen />
    </>
  )
}

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
