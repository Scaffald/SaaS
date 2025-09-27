import { AuthLayout } from '@app/core/features/auth/layout.web'
import { ConfirmScreen } from '@app/core/features/auth/confirm-screen'
import Head from 'next/head'

import { NextPageWithLayout } from '../_app'

const Page: NextPageWithLayout = () => (
  <>
    <Head>
      <title>Confirm Email</title>
    </Head>
    <ConfirmScreen />
  </>
)

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
