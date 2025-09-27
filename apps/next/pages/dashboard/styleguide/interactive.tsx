import { DashboardLayout } from '@app/core/features/dashboard/layout.web'
import { StyleguideLayout, InteractiveScreen } from '@app/core/features/styleguide'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Interactive - Component Styleguide - SCF Neue</title>
        <meta
          name="description"
          content="Interactive components, dialogs, overlays, and icon libraries used in the SCF Neue application."
        />
      </Head>
      <StyleguideLayout>
        <InteractiveScreen />
      </StyleguideLayout>
    </>
  )
}

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
