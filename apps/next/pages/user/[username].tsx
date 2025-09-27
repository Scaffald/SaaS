import { DashboardLayout } from '@app/ui'
import { PublicProfileScreen } from '@app/core/features/profile/public-profile-screen'
import type { GetServerSideProps } from 'next'
import Head from 'next/head'

import type { NextPageWithLayout } from '../_app'

type PageProps = {
  username: string
}

const Page: NextPageWithLayout<PageProps> = ({ username }) => {
  return (
    <>
      <Head>
        <title>Public Profile</title>
      </Head>
      <PublicProfileScreen username={username} />
    </>
  )
}

Page.getLayout = (page) => <DashboardLayout headerTitle="Public profile">{page}</DashboardLayout>

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ params }) => {
  const username = params?.username

  if (typeof username !== 'string' || username.length === 0) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      username,
    },
  }
}

export default Page
