import { HomeLayout } from '@app/core/features/home/layout.web'
import { ProfileContactAvailabilityScreen } from '@app/core/features/profile/contact-availability-screen'
import { ProfileLayoutSimple } from '@app/core/features/profile/layout-simple.web'
import Head from 'next/head'
import type { NextPageWithLayout } from 'pages/_app'

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
  <HomeLayout fullPage>
    <ProfileLayoutSimple>{page}</ProfileLayoutSimple>
  </HomeLayout>
)

export default Page
