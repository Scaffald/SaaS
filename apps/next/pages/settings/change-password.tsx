import { HomeLayout } from '@app/core/features/home/layout.web'
import { ChangePasswordScreen } from '@app/core/features/settings/change-password-screen'
import { SettingsLayout } from '@app/core/features/settings/layout.web'
import Head from 'next/head'
import type { NextPageWithLayout } from 'pages/_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Change Password</title>
      </Head>
      <ChangePasswordScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <HomeLayout fullPage>
    <SettingsLayout>{page}</SettingsLayout>
  </HomeLayout>
)

export default Page
