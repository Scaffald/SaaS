import { HomeLayout } from '@app/core/features/home/layout.web'
import { StyleguideLayout } from '@app/core/features/styleguide'
import { TypographyScreen } from '@app/core/features/styleguide'
import Head from 'next/head'
import type { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Component Styleguide - SCF Neue</title>
        <meta
          name="description"
          content="A comprehensive showcase of all UI components used throughout the SCF Neue application."
        />
      </Head>
      <StyleguideLayout isStyleguideHome>
        <TypographyScreen />
      </StyleguideLayout>
    </>
  )
}

Page.getLayout = (page) => <HomeLayout>{page}</HomeLayout>

export default Page
