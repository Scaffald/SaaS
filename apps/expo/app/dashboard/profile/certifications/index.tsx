import { YStack } from 'tamagui'
import { ProfileCertificationsLeft } from '@app/core/features/profile/profile-certifications-left'
import { ProfileCertificationsRight } from '@app/core/features/profile/profile-certifications-right'
import { DashboardLayout, Breadcrumb } from '@app/ui'
import { useAuth } from '@app/core/provider/auth/useAuth'

export default function ProfileCertificationsPage() {
  const { session } = useAuth()
  const currentUserId = session?.user?.id

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    {
      label: 'My Profile',
      href: currentUserId ? `/dashboard/users/${currentUserId}` : '/dashboard',
    },
    { label: 'Certifications', isActive: true },
  ]

  return (
    <YStack gap="$4" flex={1}>
      <Breadcrumb items={breadcrumbItems} />
      <DashboardLayout
        leftContent={<ProfileCertificationsLeft />}
        rightContent={<ProfileCertificationsRight />}
      />
    </YStack>
  )
}
