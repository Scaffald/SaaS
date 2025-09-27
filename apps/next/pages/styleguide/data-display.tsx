import { StyleguideLayout, DataDisplayScreen } from '@app/core/features/styleguide'
import Head from 'next/head'

export default function DataDisplayPage() {
  return (
    <>
      <Head>
        <title>Data Display - Component Styleguide - SCF Neue</title>
        <meta
          name="description"
          content="Data display components, avatars, badges, and visualization elements used in the SCF Neue application."
        />
      </Head>
      <StyleguideLayout>
        <DataDisplayScreen />
      </StyleguideLayout>
    </>
  )
}
