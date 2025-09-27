import { AuthLayout } from '@app/core/features/auth/layout.web'
import { WelcomeScreen } from '@app/core/features/auth/welcome-screen'
import Head from 'next/head'

import { NextPageWithLayout } from '../_app'

const Page: NextPageWithLayout = () => (
  <>
    <Head>
      <title>Welcome</title>
    </Head>
    <WelcomeScreen />
  </>
)

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
