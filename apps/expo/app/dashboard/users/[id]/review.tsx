import { useLocalSearchParams, useRouter } from 'expo-router'
import { YStack, Button, XStack, Text } from 'tamagui'
import { ChevronLeft } from '@tamagui/lucide-icons'
import { OnetReviewWizard } from '@app/core/features/reviews/components/OnetReviewWizard'
import { api } from '@app/core/utils/api'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

/**
 * Dedicated Review Page
 * Full-page O*NET review wizard for a user
 */
export default function UserReviewPage() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: profile } = api.userProfile.getUserProfile.useQuery(
    { userId: id || '' },
    { enabled: !!id }
  )

  if (!id) {
    return null
  }

  const handleCancel = () => {
    router.back()
  }

  const handleComplete = () => {
    // Navigate back to user profile
    router.push(`/dashboard/users/${id}`)
  }

  return (
    <DashboardLayout
      leftContent={
        <YStack gap="$4" flex={1}>
          {/* Back Button */}
          <XStack gap="$2" items="center">
            <Button size="$3" chromeless icon={ChevronLeft} onPress={handleCancel}>
              <Text>Back to Profile</Text>
            </Button>
          </XStack>

          {/* Review Wizard */}
          <OnetReviewWizard
            subjectId={id}
            subjectName={profile?.name || 'this user'}
            onCancel={handleCancel}
            onComplete={handleComplete}
          />
        </YStack>
      }
      rightContent={
        <YStack gap="$4">
          {/* Optional: Add tips or guidelines here */}
          <YStack gap="$2" p="$4" bg="$blue2" style={{ borderRadius: 12 }}>
            <Text fontSize="$5" fontWeight="600" color="$blue11">
              💡 Review Tips
            </Text>
            <YStack gap="$2">
              <Text fontSize="$3" color="$color11">
                • Be honest and constructive
              </Text>
              <Text fontSize="$3" color="$color11">
                • Rate based on actual experience
              </Text>
              <Text fontSize="$3" color="$color11">
                • Mark strengths and improvement areas
              </Text>
              <Text fontSize="$3" color="$color11">
                • Provide specific examples in summary
              </Text>
            </YStack>
          </YStack>

          {/* About O*NET */}
          <YStack gap="$2" p="$4" bg="$color2" style={{ borderRadius: 12 }}>
            <Text fontSize="$5" fontWeight="600">
              About This Review
            </Text>
            <Text fontSize="$3" color="$color11" lineHeight="$3">
              This review uses O*NET elements—research-backed skills, abilities, and work values
              validated across 1,000+ occupations by the U.S. Department of Labor.
            </Text>
          </YStack>
        </YStack>
      }
    />
  )
}
