import { ROUTES } from '@scf/core/constants/routes'
import { openExternalLink } from '@scf/core/utils/platform'
import {
  useOrganization,
  useOrganizationOpenJobsCount,
} from '@scf/core/utils/organizations-sdk-hooks'
import { extractPlainText, ResponsiveModal, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Briefcase, Building2, ExternalLink, MapPin, Users } from 'lucide-react-native'
import type { JSONContent } from '@tiptap/core'
import { useRouter } from 'expo-router'
import { Button, Separator, Spinner, Text, Row, Stack } from '@scaffald/ui'

interface OrganizationPreviewModalProps {
  organizationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Organization Preview Modal
 * Shows a quick preview of an organization with option to view their jobs
 */
export function OrganizationPreviewModal({
  organizationId,
  open,
  onOpenChange,
}: OrganizationPreviewModalProps) {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  // Fetch organization data
  const { data: organization, isLoading } = useOrganization(organizationId || undefined, {
    enabled: !!organizationId && open,
  })

  // Fetch open jobs count for this organization
  const jobsCountQuery = useOrganizationOpenJobsCount(organizationId || undefined, {
    enabled: !!organizationId && open,
  })
  const jobsCount: number = (() => {
    const data = jobsCountQuery.data
    if (typeof data === 'number') return data
    if (data && typeof data === 'object' && 'count' in data) {
      return (data as { count: number; organizationId: string }).count
    }
    return 0
  })()

  const handleViewJobs = () => {
    // Navigate to jobs view with organization filter
    router.push(`${ROUTES.JOBS.path}?org=${organizationId}`)
    onOpenChange(false)
  }

  const handleOpenInNewTab = () => {
    if (!organizationId) return
    openExternalLink(`${ROUTES.JOBS.path}?org=${organizationId}`)
  }

  const formatAddress = (address: unknown) => {
    if (!address || typeof address !== 'object') return null

    const addr = address as { city?: string; state?: string; country?: string }
    const parts = [addr.city, addr.state, addr.country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={organization?.name || 'Organization Details'}
      size="md"
    >
      {isLoading ? (
        <Stack paddingVertical={32} align="center" justify="center">
          <Spinner variant="ios" size="lg" color="primary" />
          <Text style={{ color: colors.text[t].secondary, marginTop: 16 }}>
            Loading organization details...
          </Text>
        </Stack>
      ) : !organization ? (
        <Stack paddingVertical={32} align="center">
          <Text style={{ color: t === 'dark' ? colors.error[300] : colors.error[600] }}>Organization not found</Text>
        </Stack>
      ) : (
        <>
          {/* Organization Header */}
          <Stack gap={12} align="center">
            <Stack
              width={80}
              height={80}
              borderRadius={24}
              style={{ backgroundColor: t === 'dark' ? colors.blue[900] : colors.blue[50] }}
              align="center"
              justify="center"
            >
              <Building2 size={40} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
            </Stack>

            <Stack gap={8} align="center">
              <Text style={{ color: colors.text[t].secondary }}>{organization.name}</Text>
              {(organization as { industry_name?: string }).industry_name && (
                <Text style={{ color: colors.text[t].tertiary }}>{(organization as { industry_name?: string }).industry_name}</Text>
              )}
            </Stack>

            {/* Open Jobs Badge */}
            {jobsCount > 0 && (
              <Row
                style={{
                  backgroundColor: t === 'dark' ? colors.green[900] : colors.green[50],
                  borderColor: t === 'dark' ? colors.green[700] : colors.green[200],
                }}
                paddingHorizontal={16}
                paddingVertical={8}
                borderRadius={10}
                gap={8}
                align="center"
                borderWidth={1}
              >
                <Briefcase size={20} color={t === 'dark' ? colors.green[300] : colors.green[600]} />
                <Text style={{ color: t === 'dark' ? colors.green[300] : colors.green[700] }}>
                  {jobsCount} Open {jobsCount === 1 ? 'Position' : 'Positions'}
                </Text>
              </Row>
            )}
          </Stack>

          <Separator />

          {/* Quick Info */}
          <Stack gap={12}>
            {formatAddress(organization.address) && (
              <Row gap={8} align="center">
                <MapPin size={18} color={colors.text[t].tertiary} />
                <Text style={{ color: colors.text[t].secondary }}>{formatAddress(organization.address)}</Text>
              </Row>
            )}

            {(organization as { employee_count_range?: string }).employee_count_range && (
              <Row gap={8} align="center">
                <Users size={18} color={colors.text[t].tertiary} />
                <Text style={{ color: colors.text[t].secondary }}>{(organization as { employee_count_range?: string }).employee_count_range} employees</Text>
              </Row>
            )}

            {(organization as { is_verified?: boolean }).is_verified && (
              <Row
                style={{ backgroundColor: t === 'dark' ? colors.blue[900] : colors.blue[100] }}
                paddingHorizontal={12}
                paddingVertical={6}
                borderRadius={12}
              >
                <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[700] }}>Verified Organization</Text>
              </Row>
            )}
          </Stack>

          {/* Description */}
          {organization.description && (
            <>
              <Separator />
              <Stack gap={8}>
                <Text style={{ color: colors.text[t].tertiary }}>About</Text>
                <Text style={{ color: colors.text[t].secondary, lineHeight: 16 }}>
                  {typeof organization.description === 'string'
                    ? organization.description
                    : extractPlainText(organization.description as JSONContent)}
                </Text>
              </Stack>
            </>
          )}

          {/* Website Link */}
          {(organization as { website_url?: string }).website_url && (
            <>
              <Separator />
              <Row gap={8} align="center">
                <ExternalLink size={20} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
                <Text
                  style={{
                    color: t === 'dark' ? colors.blue[300] : colors.blue[600],
                    textDecorationLine: 'underline',
                  }}
                  onPress={() => {
                    const url = (organization as { website_url?: string }).website_url
                    if (url) openExternalLink(url)
                  }}
                >
                  {(organization as { website_url?: string }).website_url?.replace(/^https?:\/\//, '')}
                </Text>
              </Row>
            </>
          )}

          <Separator />

          {/* CTA Buttons */}
          <Stack gap={12}>
            {typeof window !== 'undefined' && (
              <Button
                size="lg"
                color="primary"
                variant="outline"
                iconEnd={ExternalLink}
                onPress={handleOpenInNewTab}
              >
                Open in New Tab
              </Button>
            )}
            {jobsCount > 0 ? (
              <Button
                size="lg"
                color="primary"
                iconEnd={Briefcase}
                onPress={handleViewJobs}
              >
                View Open Positions ({jobsCount})
              </Button>
            ) : (
              <Stack style={{ backgroundColor: colors.bg[t].muted }} padding="sm" borderRadius={12} align="center">
                <Text style={{ color: colors.text[t].secondary }}>No open positions at this time</Text>
              </Stack>
            )}
          </Stack>
        </>
      )}
    </ResponsiveModal>
  )
}
