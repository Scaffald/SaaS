import { StyleguideLayout, TypographyScreen } from '@app/core/features/styleguide'
import Head from 'next/head'

export default function TypographyPage() {
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
