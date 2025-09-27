import { StyleguideLayout, InteractiveScreen } from '@app/core/features/styleguide'
import Head from 'next/head'

export default function InteractivePage() {
  return (
    <>
      <Head>
        <title>Interactive - Component Styleguide - SCF Neue</title>
        <meta
          name="description"
          content="Interactive components, dialogs, overlays, and icon libraries used in the SCF Neue application."
        />
      </Head>
      <StyleguideLayout>
        <InteractiveScreen />
      </StyleguideLayout>
    </>
  )
}
