import { AuthLayout } from 'app/features/auth/layout.web'
import { LoginScreen } from 'app/features/auth/login-screen'
import Head from 'next/head'

import { NextPageWithLayout } from './_app'

const Page: NextPageWithLayout = () => (
  <>
    <Head>
      <title>Sign in</title>
    </Head>
    <LoginScreen />
  </>
)

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
