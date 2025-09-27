import { DashboardLayout } from '@app/ui'
import { ProfileWorkSkillsScreen } from '@app/core/features/profile/work-skills-screen'
import { ProfileLayoutSimple } from '@app/core/features/profile/layout-simple.web'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

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
  <DashboardLayout fullPage>
    <ProfileLayoutSimple>{page}</ProfileLayoutSimple>
  </DashboardLayout>
)

export default Page
