import { YStack } from 'tamagui'
import { ProfileGeneralLeft } from '@app/core/features/profile/profile-general-left'
import { ProfileGeneralRight } from '@app/core/features/profile/profile-general-right'
import { DashboardLayout, Breadcrumb } from '@app/ui'
import { useAuth } from '@app/core/provider/auth/useAuth'

export default function ProfileGeneralPage() {
  const { session } = useAuth()
  const currentUserId = session?.user?.id

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    {
      label: 'My Profile',
      href: currentUserId ? `/dashboard/users/${currentUserId}` : '/dashboard',
    },
    { label: 'General Information', isActive: true },
  ]

  return (
    <YStack gap="$4" flex={1}>
      <Breadcrumb items={breadcrumbItems} />
      <DashboardLayout
        leftContent={<ProfileGeneralLeft />}
        rightContent={<ProfileGeneralRight />}
      />
    </YStack>
  )
}
