import { YStack, XStack, Text, Button, Card } from 'tamagui'
import { AlertTriangle, MapPin, X, MessageSquare } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { RouteBuilder } from '@app/core/constants/routes'

export interface SiteOverlapNotificationProps {
  notificationId: string
  siteId: string
  overlappingSiteId: string
  overlapPercent: number
  threshold: number
  onDismiss?: (notificationId: string) => void
}

/**
 * Site Overlap Notification Component
 * 
 * Displays site overlap notification with action buttons:
 * - Request Survey Data: Sends message to project owners
 * - Dismiss: Marks notification as dismissed
 * - Adjust Boundaries: Opens site editor
 */
export function SiteOverlapNotification({
  notificationId,
  siteId,
  overlappingSiteId,
  overlapPercent,
  threshold,
  onDismiss,
}: SiteOverlapNotificationProps) {
  const router = useRouter()

  const handleRequestSurveyData = async () => {
    // TODO: Implement message sending to project owners
    // This would use a messaging/notification system to contact project owners
    console.log('Request survey data for sites:', siteId, overlappingSiteId)
    
    // For now, show a message
    alert(`Requesting survey data verification for overlapping sites.\n\nSite 1: ${siteId.slice(0, 8)}\nSite 2: ${overlappingSiteId.slice(0, 8)}\nOverlap: ${overlapPercent}%`)
  }

  const handleAdjustBoundaries = () => {
    // Navigate to site editor (would need to determine which project/site to edit)
    // For now, navigate to projects list
    router.push(RouteBuilder.projectDetail(siteId)) // Using siteId as placeholder - would need project context
  }

  const handleDismiss = () => {
    onDismiss?.(notificationId)
  }

  return (
    <Card p="$4" bg="$yellow2" borderColor="$yellow8" borderWidth={2}>
      <YStack gap="$4">
        <XStack gap="$3" items="flex-start">
          <AlertTriangle size={24} color="$yellow11" />
          <YStack flex={1} gap="$2">
            <Text fontSize="$5" fontWeight="600" color="$yellow11">
              Site Overlap Detected
            </Text>
            <Text fontSize="$3" color="$gray11">
              Site boundaries overlap by {overlapPercent}% (threshold: {threshold}%)
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              <Card p="$2" bg="$yellow3" rounded="$2">
                <XStack gap="$2" items="center">
                  <MapPin size={14} />
                  <Text fontSize="$2">Site 1: {siteId.slice(0, 8)}...</Text>
                </XStack>
              </Card>
              <Card p="$2" bg="$yellow3" rounded="$2">
                <XStack gap="$2" items="center">
                  <MapPin size={14} />
                  <Text fontSize="$2">Site 2: {overlappingSiteId.slice(0, 8)}...</Text>
                </XStack>
              </Card>
            </XStack>
          </YStack>
        </XStack>

        <XStack gap="$2" flexWrap="wrap" justify="flex-end">
          <Button
            size="$3"
            variant="outlined"
            icon={MessageSquare}
            onPress={handleRequestSurveyData}
          >
            Request Survey Data
          </Button>
          <Button
            size="$3"
            variant="outlined"
            icon={MapPin}
            onPress={handleAdjustBoundaries}
          >
            Adjust Boundaries
          </Button>
          <Button
            size="$3"
            variant="outlined"
            icon={X}
            onPress={handleDismiss}
          >
            Dismiss
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}

