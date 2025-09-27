import { AuthLayout } from '@app/core/features/auth/layout.web'
import { ResetPasswordScreen } from '@app/core/features/auth/reset-password-screen'
import Head from 'next/head'

import { NextPageWithLayout } from '../_app'

const Page: NextPageWithLayout = () => (
  <>
    <Head>
      <title>Confirm Email</title>
    </Head>
    <ResetPasswordScreen />
  </>
)

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
