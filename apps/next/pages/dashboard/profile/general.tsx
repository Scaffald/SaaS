import { HomeLayout } from '@app/core/features/home/layout.web'
import { ProfileBasicInfoScreen } from '@app/core/features/profile/basic-info-screen'
import { ProfileLayoutSimple } from '@app/core/features/profile/layout-simple.web'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Basic Information</title>
      </Head>
      <ProfileBasicInfoScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <HomeLayout fullPage>
    <ProfileLayoutSimple>{page}</ProfileLayoutSimple>
  </HomeLayout>
)

export default Page
