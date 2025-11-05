import { YStack } from 'tamagui'
import { ProfileEducationLeft } from '@app/core/features/profile/profile-education-left'
import { ProfileEducationRight } from '@app/core/features/profile/profile-education-right'
import { DashboardLayout, Breadcrumb } from '@app/ui'
import { useAuth } from '@app/core/provider/auth/useAuth'

export default function ProfileEducationPage() {
  const { session } = useAuth()
  const currentUserId = session?.user?.id

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    {
      label: 'My Profile',
      href: currentUserId ? `/dashboard/users/${currentUserId}` : '/dashboard',
    },
    { label: 'Education', isActive: true },
  ]

  return (
    <YStack gap="$4" flex={1}>
      <Breadcrumb items={breadcrumbItems} />
      <DashboardLayout
        leftContent={<ProfileEducationLeft />}
        rightContent={<ProfileEducationRight />}
      />
    </YStack>
  )
}
