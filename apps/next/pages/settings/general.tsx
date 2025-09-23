import { HomeLayout } from '@app/core/features/home/layout.web'
import { GeneralSettingsScreen } from '@app/core/features/settings/general-screen'
import { SettingsLayout } from '@app/core/features/settings/layout.web'
import Head from 'next/head'
import type { NextPageWithLayout } from 'pages/_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Settings</title>
      </Head>
      <GeneralSettingsScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <HomeLayout fullPage>
    <SettingsLayout>{page}</SettingsLayout>
  </HomeLayout>
)

export default Page
