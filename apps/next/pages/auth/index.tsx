import { AuthLayout } from '@app/core/features/auth/layout.web'
import { LoginScreen } from '@app/core/features/auth/login-screen'
import Head from 'next/head'

import { NextPageWithLayout } from '../_app'

const Page: NextPageWithLayout = () => (
  <>
    <Head>
      <title>Sign In</title>
    </Head>
    <LoginScreen />
  </>
)

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
