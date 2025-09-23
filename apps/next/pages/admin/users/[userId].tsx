import { AdminUserDetailScreen } from '@app/features/admin/users'
import { HomeLayout } from '@app/features/home/layout.web'
import { Spinner, YStack } from '@app/ui'
import Head from 'next/head'
import { useRouter } from 'next/router'

import type { NextPageWithLayout } from '../../_app'

const AdminUserDetailPage: NextPageWithLayout = () => {
  const router = useRouter()
  const userId = typeof router.query.userId === 'string' ? router.query.userId : null
  const organizationId = typeof router.query.organizationId === 'string' ? router.query.organizationId : null

  if (!userId) {
    return (
      <YStack flex={1} ai="center" jc="center" padding="$6">
        <Spinner size="large" />
      </YStack>
    )
  }

  return (
    <>
      <Head>
        <title>Admin · User detail</title>
      </Head>
      <YStack flex={1} padding="$4">
        <AdminUserDetailScreen workerId={userId} organizationId={organizationId} />
      </YStack>
    </>
  )
}

AdminUserDetailPage.getLayout = (page) => <HomeLayout fullPage>{page}</HomeLayout>

export default AdminUserDetailPage
