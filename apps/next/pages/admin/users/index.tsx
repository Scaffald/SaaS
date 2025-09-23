import { AdminUsersListScreen } from '@app/core/features/admin/users'
import { HomeLayout } from '@app/core/features/home/layout.web'
import { YStack } from '@app/ui'
import Head from 'next/head'
import { useRouter } from 'next/router'

import type { NextPageWithLayout } from '../../_app'

const AdminUsersPage: NextPageWithLayout = () => {
  const router = useRouter()
  const organizationId = typeof router.query.organizationId === 'string' ? router.query.organizationId : null

  return (
    <>
      <Head>
        <title>Admin · Users</title>
      </Head>
      <YStack flex={1} padding="$4">
        <AdminUsersListScreen organizationId={organizationId} />
      </YStack>
    </>
  )
}

AdminUsersPage.getLayout = (page) => <HomeLayout fullPage>{page}</HomeLayout>

export default AdminUsersPage
