import { AuthLayout } from 'app/features/auth/layout.web'
import { SignUpScreen } from 'app/features/auth/sign-up-screen'
import Head from 'next/head'

import type { NextPageWithLayout } from './_app'

const Page: NextPageWithLayout = () => (
  <>
    <Head>
      <title>Sign up</title>
    </Head>
    <SignUpScreen />
  </>
)

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
