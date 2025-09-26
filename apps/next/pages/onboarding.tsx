import { OnboardingFlowScreen } from '@app/core/features/onboarding'
import Head from 'next/head'
import type { NextPageWithLayout } from './_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Complete your profile</title>
      </Head>
      <OnboardingFlowScreen />
    </>
  )
}

Page.getLayout = (page) => page

export default Page
