import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { AlertTriangle, MapPin, MessageSquare, X } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Button, Card, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

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
    <Card variant="glass" padding="md" style={{ backgroundColor: t === 'dark' ? colors.yellow[900] : colors.yellow[50], borderColor: t === 'dark' ? colors.yellow[600] : colors.yellow[300], borderWidth: 2 }}>
      <Stack gap={16}>
        <Row gap={12} align="flex-start">
          <AlertTriangle size={24} color={t === 'dark' ? colors.yellow[300] : colors.yellow[700]} />
          <Stack flex={1} gap={8}>
            <Text style={{ color: t === 'dark' ? colors.yellow[300] : colors.yellow[700] }}>Site Overlap Detected</Text>
            <Text style={{ color: colors.text[t].secondary }}>
              Site boundaries overlap by {overlapPercent}% (threshold: {threshold}%)
            </Text>
            <Row gap={8} wrap>
              <Card variant="glass" padding="sm" style={{ backgroundColor: t === 'dark' ? colors.yellow[800] : colors.yellow[100], borderRadius: 8 }}>
                <Row gap={8} align="center">
                  <MapPin size={24} />
                  <Text>Site 1: {siteId.slice(0, 8)}...</Text>
                </Row>
              </Card>
              <Card variant="glass" padding="sm" style={{ backgroundColor: t === 'dark' ? colors.yellow[800] : colors.yellow[100], borderRadius: 8 }}>
                <Row gap={8} align="center">
                  <MapPin size={24} />
                  <Text>Site 2: {overlappingSiteId.slice(0, 8)}...</Text>
                </Row>
              </Card>
            </Row>
          </Stack>
        </Row>

        <Row gap={8} wrap justify="flex-end">
          <Button
            size="sm"
            variant="outline"
            iconStart={MessageSquare}
            onPress={handleRequestSurveyData}
          >
            Request Survey Data
          </Button>
          <Button size="sm" variant="outline" iconStart={MapPin} onPress={handleAdjustBoundaries}>
            Adjust Boundaries
          </Button>
          <Button size="sm" variant="outline" iconStart={X} onPress={handleDismiss}>
            Dismiss
          </Button>
        </Row>
      </Stack>
    </Card>
  )
}
