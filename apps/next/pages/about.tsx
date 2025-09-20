import { LegalLayout } from 'app/features/legal/layout.web'
import { AboutScreen } from 'app/features/legal/about-screen'
import Head from 'next/head'

import type { NextPageWithLayout } from './_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>About SCF Neue</title>
      </Head>
      <AboutScreen />
    </>
  )
}

Page.getLayout = (page) => <LegalLayout>{page}</LegalLayout>

export default Page
