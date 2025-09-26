import { HomeLayout } from '@app/core/features/home/layout.web'
import { ProfileWorkSkillsScreen } from '@app/core/features/profile/work-skills-screen'
import { ProfileLayoutSimple } from '@app/core/features/profile/layout-simple.web'
import Head from 'next/head'
import type { NextPageWithLayout } from 'pages/_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Work & Skills</title>
      </Head>
      <ProfileWorkSkillsScreen />
    </>
  )
}

Page.getLayout = (page) => (
  <HomeLayout fullPage>
    <ProfileLayoutSimple>{page}</ProfileLayoutSimple>
  </HomeLayout>
)

export default Page
