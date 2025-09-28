import React from 'react'
import { ProfileEmploymentLeft } from '@app/core/features/profile/profile-employment-left'
import { ProfileEmploymentRight } from '@app/core/features/profile/profile-employment-right'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'
import { NextPageWithLayout } from '../../_app'

const Page: NextPageWithLayout = () => {
  return (
    <DashboardLayout
      leftContent={<ProfileEmploymentLeft />}
      rightContent={<ProfileEmploymentRight />}
    />
  )
}

export default Page
