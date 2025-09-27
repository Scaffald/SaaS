import { HomeLayout } from '@app/core/features/home/layout.web'
import { StyleguideLayout, TypographyScreen } from '@app/core/features/styleguide'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Typography - Component Styleguide - SCF Neue</title>
        <meta
          name="description"
          content="Typography components, text styles, and color themes used in the SCF Neue application."
        />
      </Head>
      <StyleguideLayout>
        <TypographyScreen />
      </StyleguideLayout>
    </>
  )
}

Page.getLayout = (page) => <HomeLayout>{page}</HomeLayout>

export default Page
