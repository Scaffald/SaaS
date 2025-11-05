import { YStack } from 'tamagui'
import { ProfileSkillsLeft } from '@app/core/features/profile/profile-skills-left'
import { ProfileSkillsRight } from '@app/core/features/profile/profile-skills-right'
import { DashboardLayout, Breadcrumb } from '@app/ui'
import { useAuth } from '@app/core/provider/auth/useAuth'

export default function ProfileSkillsPage() {
  const { session } = useAuth()
  const currentUserId = session?.user?.id

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    {
      label: 'My Profile',
      href: currentUserId ? `/dashboard/users/${currentUserId}` : '/dashboard',
    },
    { label: 'Skills', isActive: true },
  ]

  return (
    <YStack gap="$4" flex={1}>
      <Breadcrumb items={breadcrumbItems} />
      <DashboardLayout leftContent={<ProfileSkillsLeft />} rightContent={<ProfileSkillsRight />} />
    </YStack>
  )
}
