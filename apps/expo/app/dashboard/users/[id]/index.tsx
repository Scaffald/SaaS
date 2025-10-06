import { useLocalSearchParams } from 'expo-router'
import { UserProfileLeft } from '@app/core/features/user-profile/user-profile-left'
import { UserProfileRight } from '@app/core/features/user-profile/user-profile-right'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

/**
 * Dynamic User Profile Route
 * Shows comprehensive profile view for any user
 */
export default function UserProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return null
  }

  return (
    <DashboardLayout
      leftContent={<UserProfileLeft userId={id} />}
      rightContent={<UserProfileRight userId={id} />}
    />
  )
}
