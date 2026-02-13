import { ROUTES } from '@scf/core/constants/routes'
import {
  useOrganization,
  useOrganizationOpenJobsCount,
} from '@scf/core/utils/organizations-sdk-hooks'
import { extractPlainText, ResponsiveModal } from '@unicornlove/beyond-ui'
import { Briefcase, Building2, ExternalLink, MapPin, Users } from 'lucide-react-native'
import type { JSONContent } from '@tiptap/core'
import { useRouter } from 'expo-router'
import { Button, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
    router.push(`${ROUTES.DASHBOARD.DISCOVER.JOBS.path}?org=${organizationId}`)
    onOpenChange(false)
  }

  const handleOpenInNewTab = () => {
    if (!organizationId) return
    if (typeof window !== 'undefined') {
      window.open(`${ROUTES.DASHBOARD.DISCOVER.JOBS.path}?org=${organizationId}`, '_blank')
    }
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
          <Spinner size="lg" color="$blue10" />
          <Text marginTop={16} color="$gray11">
            Loading organization details...
          </Text>
        </Stack>
      ) : !organization ? (
        <Stack paddingVertical={32} align="center">
          <Text color="$red10">Organization not found</Text>
        </Stack>
      ) : (
        <>
          {/* Organization Header */}
          <Stack gap={12} align="center">
            <Stack
              width={80}
              height={80}
              borderRadius={24}
              backgroundColor="$blue4"
              align="center"
              justify="center"
            >
              <Building2 size={40} color="$blue10" />
            </Stack>

            <Stack gap={8} align="center">
              <Text color="$gray11">{organization.name}</Text>
              {organization.industry_name && <Text color="$gray11">{organization.industry_name}</Text>}
            </Stack>

            {/* Open Jobs Badge */}
            {jobsCount > 0 && (
              <Row
                backgroundColor="$green2"
                paddingHorizontal={16}
                paddingVertical={8}
                borderRadius="$10"
                gap={8}
                align="center"
                borderWidth={1}
                borderColor="$green5"
              >
                <Briefcase size="md" color="$green10" />
                <Text color="$green11">
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
                <MapPin size={18} color="$gray11" />
                <Text color="$gray11">{formatAddress(organization.address)}</Text>
              </Row>
            )}

            {organization.employee_count_range && (
              <Row gap={8} align="center">
                <Users size={18} color="$gray11" />
                <Text color="$gray11">{organization.employee_count_range} employees</Text>
              </Row>
            )}

            {organization.is_verified && (
              <Row
                backgroundColor="$blue3"
                paddingHorizontal={12}
                paddingVertical={6}
                borderRadius={12}
              >
                <Text color="$blue11">✓ Verified Organization</Text>
              </Row>
            )}
          </Stack>

          {/* Description */}
          {organization.description && (
            <>
              <Separator />
              <Stack gap={8}>
                <Text color="$gray11">About</Text>
                <Text color="$gray11" lineHeight={4} >
                  {typeof organization.description === 'string'
                    ? organization.description
                    : extractPlainText(organization.description as JSONContent)}
                </Text>
              </Stack>
            </>
          )}

          {/* Website Link */}
          {organization.website_url && (
            <>
              <Separator />
              <Row gap={8} align="center">
                <ExternalLink size="md" color="$blue10" />
                <Text
                  color="$blue10"
                  textDecorationLine="underline"
                  onPress={() => {
                    if (organization.website_url) {
                      // Open in new window/tab
                      if (typeof window !== 'undefined') {
                        window.open(organization.website_url, '_blank')
                      }
                    }
                  }}
                  cursor="pointer"
                >
                  {organization.website_url.replace(/^https?:\/\//, '')}
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
                iconAfter={<ExternalLink size={18} />}
                onPress={handleOpenInNewTab}
              >
                Open in New Tab
              </Button>
            )}
            {jobsCount > 0 ? (
              <Button
                size="lg"
                theme="info"
                iconAfter={<Briefcase size={18} />}
                onPress={handleViewJobs}
              >
                View Open Positions ({jobsCount})
              </Button>
            ) : (
              <Stack backgroundColor="$color3" padding="sm" borderRadius={12} align="center">
                <Text color="$gray11">No open positions at this time</Text>
              </Stack>
            )}
          </Stack>
        </>
      )}
    </ResponsiveModal>
  )
}
