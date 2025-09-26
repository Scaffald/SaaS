import { HomeLayout } from '@app/core/features/home/layout.web'
import { YStack } from '@app/ui'
import { ProfileScreen } from '@app/core/features/profile/screen'
import Head from 'next/head'

import type { NextPageWithLayout } from '../_app'

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <YStack f={1} px="$0" py="$0" $gtSm={{ px: '$6', py: '$6' }} $gtMd={{ px: '$8' }}>
        <ProfileScreen />
      </YStack>
    </>
  )
}

Page.getLayout = (page) => <HomeLayout fullPage>{page}</HomeLayout>

export default Page
