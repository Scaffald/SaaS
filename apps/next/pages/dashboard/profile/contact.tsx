import { DashboardLayout } from '@app/ui'
import { ProfileContactAvailabilityScreen } from '@app/core/features/profile/contact-availability-screen'
import { ProfileLayoutSimple } from '@app/core/features/profile/layout-simple.web'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Contact & Availability</title>
      </Head>
      <ProfileContactAvailabilityScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <DashboardLayout fullPage>
    <ProfileLayoutSimple>{page}</ProfileLayoutSimple>
  </DashboardLayout>
)

export default Page
