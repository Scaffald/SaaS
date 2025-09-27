import { StyleguideLayout, ButtonsScreen } from '@app/core/features/styleguide'
import Head from 'next/head'

export default function ButtonsPage() {
  return (
    <>
      <Head>
        <title>Buttons - Component Styleguide - SCF Neue</title>
        <meta
          name="description"
          content="Button components, animations, and interactive states used in the SCF Neue application."
        />
      </Head>
      <StyleguideLayout>
        <ButtonsScreen />
      </StyleguideLayout>
    </>
  )
}
