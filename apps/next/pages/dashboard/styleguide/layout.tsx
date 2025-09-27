import { DashboardLayout } from '@app/core/features/dashboard/layout.web'
import { StyleguideLayout, LayoutScreen } from '@app/core/features/styleguide'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Layout - Component Styleguide - SCF Neue</title>
        <meta
          name="description"
          content="Layout components, spacing utilities, and structural elements used in the SCF Neue application."
        />
      </Head>
      <StyleguideLayout>
        <LayoutScreen />
      </StyleguideLayout>
    </>
  )
}

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
