import { StyleguideLayout, FormsScreen } from '@app/core/features/styleguide'
import Head from 'next/head'

export default function FormsPage() {
  return (
    <>
      <Head>
        <title>Forms - Component Styleguide - SCF Neue</title>
        <meta
          name="description"
          content="Form controls, input fields, and validation components used in the SCF Neue application."
        />
      </Head>
      <StyleguideLayout>
        <FormsScreen />
      </StyleguideLayout>
    </>
  )
}
