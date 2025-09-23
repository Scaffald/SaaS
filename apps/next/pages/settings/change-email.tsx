import { HomeLayout } from '@app/core/features/home/layout.web'
import { ChangeEmailScreen } from '@app/core/features/settings/change-email-screen'
import { SettingsLayout } from '@app/core/features/settings/layout.web'
import Head from 'next/head'
import type { NextPageWithLayout } from 'pages/_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Change Email</title>
      </Head>
      <ChangeEmailScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <HomeLayout fullPage>
    <SettingsLayout>{page}</SettingsLayout>
  </HomeLayout>
)

export default Page
