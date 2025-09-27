import { StyleguideLayout } from '@app/core/features/styleguide'
import { TypographyScreen } from '@app/core/features/styleguide'
import Head from 'next/head'

export default function StyleguideIndexPage() {
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
