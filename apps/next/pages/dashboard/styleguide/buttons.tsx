import { DashboardLayout } from '@app/ui'
import { StyleguideLayout, ButtonsScreen } from '@app/core/features/styleguide'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Buttons - Component Styleguide - SCF Neue</title>
        <meta
          name="description"
          content="Button components, animations, and interactive states used in the SCF Neue application."
        />
      </Head>
      <StyleguideLayout>
        <ButtonsScreen />
      </StyleguideLayout>
    </>
  )
}

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>

export default Page
