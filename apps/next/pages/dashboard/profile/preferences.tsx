import { HomeLayout } from '@app/core/features/home/layout.web'
import { ProfileTravelComplianceScreen } from '@app/core/features/profile/travel-compliance-screen'
import { ProfileLayoutSimple } from '@app/core/features/profile/layout-simple.web'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Travel & Compliance</title>
      </Head>
      <ProfileTravelComplianceScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <HomeLayout fullPage>
    <ProfileLayoutSimple>{page}</ProfileLayoutSimple>
  </HomeLayout>
)

export default Page
