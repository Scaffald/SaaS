import { StyleguideLayout, LayoutScreen } from '@app/core/features/styleguide'
import Head from 'next/head'

export default function LayoutPage() {
  return (
    <>
      <Head>
        <title>Layout - Component Styleguide - SCF Neue</title>
        <meta
          name="description"
          content="Layout components, spacing utilities, and structural elements used in the SCF Neue application."
        />
      </Head>
      <StyleguideLayout>
        <LayoutScreen />
      </StyleguideLayout>
    </>
  )
}
