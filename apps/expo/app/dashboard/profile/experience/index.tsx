import { YStack } from 'tamagui'
import { ProfileExperienceLeft } from '@app/core/features/profile/profile-experience-left'
import { ProfileExperienceRight } from '@app/core/features/profile/profile-experience-right'
import { DashboardLayout, Breadcrumb } from '@app/ui'
import { useAuth } from '@app/core/provider/auth/useAuth'

export default function ProfileExperiencePage() {
  const { session } = useAuth()
  const currentUserId = session?.user?.id

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    {
      label: 'My Profile',
      href: currentUserId ? `/dashboard/users/${currentUserId}` : '/dashboard',
    },
    { label: 'Experience', isActive: true },
  ]

  return (
    <YStack gap="$4" flex={1}>
      <Breadcrumb items={breadcrumbItems} />
      <DashboardLayout
        leftContent={<ProfileExperienceLeft />}
        rightContent={<ProfileExperienceRight />}
      />
    </YStack>
  )
}
