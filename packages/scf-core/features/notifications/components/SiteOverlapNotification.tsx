import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { AlertTriangle, MapPin, MessageSquare, X } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Button, Card, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
    alert(
      `Requesting survey data verification for overlapping sites.\n\nSite 1: ${siteId.slice(0, 8)}\nSite 2: ${overlappingSiteId.slice(0, 8)}\nOverlap: ${overlapPercent}%`
    )
  }

  const handleAdjustBoundaries = () => {
    // Navigate to site editor (would need to determine which project/site to edit)
    // For now, navigate to projects list
    router.push(buildPath(ROUTES.OFFICE.CMS.PROJECTS.DETAIL, { id: siteId })) // Using siteId as placeholder - would need project context
  }

  const handleDismiss = () => {
    onDismiss?.(notificationId)
  }

  return (
    <Card padding="md" backgroundColor="$yellow2" borderColor="$yellow8" borderWidth={2}>
      <Stack gap={16}>
        <Row gap={12} align="flex-start">
          <AlertTriangle size={24} color="$yellow11" />
          <Stack flex={1} gap={8}>
            <Text color="$yellow11">Site Overlap Detected</Text>
            <Text color="$gray11">
              Site boundaries overlap by {overlapPercent}% (threshold: {threshold}%)
            </Text>
            <Row gap={8} flexWrap="wrap">
              <Card padding="xs" backgroundColor="$yellow3" borderRadius={8}>
                <Row gap={8} align="center">
                  <MapPin size={14} />
                  <Text>Site 1: {siteId.slice(0, 8)}...</Text>
                </Row>
              </Card>
              <Card padding="xs" backgroundColor="$yellow3" borderRadius={8}>
                <Row gap={8} align="center">
                  <MapPin size={14} />
                  <Text>Site 2: {overlappingSiteId.slice(0, 8)}...</Text>
                </Row>
              </Card>
            </Row>
          </Stack>
        </Row>

        <Row gap={8} flexWrap="wrap" justify="flex-end">
          <Button
            size="sm"
            variant="outline"
            icon={MessageSquare}
            onPress={handleRequestSurveyData}
          >
            Request Survey Data
          </Button>
          <Button size="sm" variant="outline" icon={MapPin} onPress={handleAdjustBoundaries}>
            Adjust Boundaries
          </Button>
          <Button size="sm" variant="outline" icon={X} onPress={handleDismiss}>
            Dismiss
          </Button>
        </Row>
      </Stack>
    </Card>
  )
}
