import { ROUTES } from '@scf/core/constants/routes'
import { useEmployer } from '@scf/core/utils/employers-sdk-hooks'
import { DashboardWidget, extractPlainText, useThemeContext } from '@scaffald/ui'
import { ArrowLeft, Building2, ExternalLink, MapPin, Users } from 'lucide-react-native'
import type { JSONContent } from '@tiptap/core'
import { useRouter } from 'expo-router'
import { Button, Separator, Skeleton, SkeletonAvatar, SkeletonBox, SkeletonText, Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type DiscoverEmployerDetailLeftProps = {
  employerId: string
}

/**
 * DiscoverEmployerDetailLeft
 * Displays the primary organization information within the dashboard layout.
 */
export function DiscoverEmployerDetailLeft({ employerId }: DiscoverEmployerDetailLeftProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()

  const {
    data: employer,
    isLoading,
    isFetching,
  } = useEmployer({ id: employerId }, { enabled: Boolean(employerId) })

  if (!employerId) {
    return (
      <DashboardWidget>
        <Stack align="center" justify="center" padding={32} gap={12}>
          <Text color="secondary">Employer not specified</Text>
          <Button
            onPress={() => {
              // Try to go back, fallback to employers list if no history
              try {
                router.back()
              } catch {
                router.replace(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path)
              }
            }}
          >
            Go Back
          </Button>
        </Stack>
      </DashboardWidget>
    )
  }

  if (isLoading || isFetching) {
    return (
      <DashboardWidget>
        <Stack gap={16}>
          <Row gap={12} align="center">
            <SkeletonAvatar size={48} />
            <Stack gap={6} style={{ flex: 1 }}>
              <Skeleton width={160} height={18} shape="text" />
              <Skeleton width={100} height={14} shape="text" />
            </Stack>
          </Row>
          <SkeletonText lines={3} lastLineWidth="70%" />
          <Row gap={8} wrap>
            {[0, 1, 2].map((i) => (
              <SkeletonBox key={i} width={90} height={28} borderRadius={99} />
            ))}
          </Row>
        </Stack>
      </DashboardWidget>
    )
  }

  if (!employer) {
    return (
      <DashboardWidget>
        <Stack align="center" justify="center" padding={32} gap={12}>
          <Text style={{ color: colors.text[t].secondary }}>Employer not found</Text>
          <Button
            onPress={() => {
              // Try to go back, fallback to employers list if no history
              try {
                router.back()
              } catch {
                router.replace(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path)
              }
            }}
          >
            Go Back
          </Button>
        </Stack>
      </DashboardWidget>
    )
  }

  const websiteUrl = employer.website
    ? employer.website.startsWith('http')
      ? employer.website
      : `https://${employer.website}`
    : null

  return (
    <DashboardWidget gap={16}>
      {/* Header with Back Button */}
      <Row align="center" gap={12}>
        <Button
          size="sm"
          variant="outline"
          iconStart={ArrowLeft}
          onPress={() => {
            // Try to go back, fallback to employers list if no history
            try {
              router.back()
            } catch {
              router.replace(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path)
            }
          }}
        >
          Back
        </Button>
        <Row align="center" gap={8} flex={1}>
          <Building2 size={24} color={colors.text[t].primary} />
          <Text>{employer.name}</Text>
        </Row>
      </Row>

      <Separator />

      {/* Industry */}
      {employer.industry && (
        <Stack gap={8}>
          <Text>Industry</Text>
          <Row align="center" gap={8}>
            <Users size={20} color={colors.text[t].tertiary} />
            <Text color="secondary">{employer.industry}</Text>
          </Row>
        </Stack>
      )}

      {/* Description */}
      {employer.description && (
        <Stack gap={8}>
          <Text>About</Text>
          <Text style={{ color: colors.text[t].secondary }}>
            {typeof employer.description === 'string'
              ? employer.description
              : extractPlainText(employer.description as JSONContent)}
          </Text>
        </Stack>
      )}

      {/* Location */}
      {employer.location && (
        <Stack gap={8}>
          <Row align="center" gap={8}>
            <MapPin size={18} color={colors.text[t].tertiary} />
            <Text>Location</Text>
          </Row>
          <Text color="secondary">{employer.location}</Text>
        </Stack>
      )}

      {/* Website */}
      {websiteUrl && (
        <Stack gap={8}>
          <Button
            size="md"
            variant="outline"
            iconStart={ExternalLink}
            onPress={() => {
              if (typeof window !== 'undefined') {
                window.open(websiteUrl, '_blank')
              }
            }}
          >
            Visit Website
          </Button>
        </Stack>
      )}

      {/* Additional Info */}
      <Stack gap={8}>
        <Text style={{ color: colors.text[t].secondary }}>Created: {new Date(employer.created_at).toLocaleDateString()}</Text>
      </Stack>
    </DashboardWidget>
  )
}
