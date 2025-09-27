import { StyleguideScreen } from '@app/core/features/styleguide/screen'
import Head from 'next/head'

export default function StyleguidePage() {
  return (
    <>
      <Head>
        <title>Component Styleguide - SCF Neue</title>
        <meta
          name="description"
          content="A comprehensive showcase of all UI components used throughout the SCF Neue application."
        />
      </Head>
      <StyleguideScreen />
    </>
  )
}
