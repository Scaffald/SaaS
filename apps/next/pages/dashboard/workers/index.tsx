import Head from 'next/head'

import { WorkersIndexScreen } from '@app/core/features/workers/workers-index-screen'
import type { NextPageWithLayout } from '../../_app'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Workers Map</title>
      </Head>
      <WorkersIndexScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <DashboardLayout
    header={{ title: 'Dashboard' }}
    leftContent={null}
    rightContent={page}
    leftWidth="61.8%"
    isHomePage={true}
  />
)

export default Page
