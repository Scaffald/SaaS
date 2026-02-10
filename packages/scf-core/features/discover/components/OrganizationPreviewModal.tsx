import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
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
  const { data: organization, isLoading } = api.organizations.getOrganization.useQuery(
    { id: organizationId || '' },
    { enabled: !!organizationId && open }
  )

  // Fetch open jobs count for this organization
  const jobsCountQuery = api.organizations.getOpenJobsCount.useQuery(
    { organizationId: organizationId || '' },
    { enabled: !!organizationId && open }
  )
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
      size="medium"
    >
      {isLoading ? (
        <Stack paddingVertical="$8" alignItems="center" justifyContent="center">
          <Spinner size="large" color="$blue10" />
          <Text marginTop="$4" color="$color11">
            Loading organization details...
          </Text>
        </Stack>
      ) : !organization ? (
        <Stack paddingVertical="$8" alignItems="center">
          <Text color="$red10" fontSize="$5" fontWeight="600">
            Organization not found
          </Text>
        </Stack>
      ) : (
        <>
          {/* Organization Header */}
          <Stack gap="$3" alignItems="center">
            <Stack
              width={80}
              height={80}
              borderRadius="$6"
              backgroundColor="$blue4"
              alignItems="center"
              justifyContent="center"
            >
              <Building2 size={40} color="$blue10" />
            </Stack>

            <Stack gap="$2" alignItems="center">
              <Text fontSize="$8" fontWeight="700" color="$color12">
                {organization.name}
              </Text>
              {organization.industry_name && (
                <Text fontSize="$5" color="$color11">
                  {organization.industry_name}
                </Text>
              )}
            </Stack>

            {/* Open Jobs Badge */}
            {jobsCount > 0 && (
              <Row
                backgroundColor="$green2"
                paddingHorizontal="$4"
                paddingVertical="$2"
                borderRadius="$10"
                gap="$2"
                alignItems="center"
                borderWidth={1}
                borderColor="$green5"
              >
                <Briefcase size={16} color="$green10" />
                <Text fontSize="$4" fontWeight="700" color="$green11">
                  {jobsCount} Open {jobsCount === 1 ? 'Position' : 'Positions'}
                </Text>
              </Row>
            )}
          </Stack>

          <Separator />

          {/* Quick Info */}
          <Stack gap="$3">
            {formatAddress(organization.address) && (
              <Row gap="$2" alignItems="center">
                <MapPin size={18} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  {formatAddress(organization.address)}
                </Text>
              </Row>
            )}

            {organization.employee_count_range && (
              <Row gap="$2" alignItems="center">
                <Users size={18} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  {organization.employee_count_range} employees
                </Text>
              </Row>
            )}

            {organization.is_verified && (
              <Row
                backgroundColor="$blue3"
                paddingHorizontal="$3"
                paddingVertical="$1.5"
                borderRadius="$3"
              >
                <Text fontSize="$3" fontWeight="600" color="$blue11">
                  ✓ Verified Organization
                </Text>
              </Row>
            )}
          </Stack>

          {/* Description */}
          {organization.description && (
            <>
              <Separator />
              <Stack gap="$2">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  About
                </Text>
                <Text fontSize="$4" color="$color11" lineHeight="$1" numberOfLines={4}>
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
              <Row gap="$2" alignItems="center">
                <ExternalLink size={16} color="$blue10" />
                <Text
                  fontSize="$4"
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
          <Stack gap="$3">
            {typeof window !== 'undefined' && (
              <Button
                size="$5"
                theme="blue"
                variant="outlined"
                iconAfter={<ExternalLink size={18} />}
                onPress={handleOpenInNewTab}
              >
                Open in New Tab
              </Button>
            )}
            {jobsCount > 0 ? (
              <Button
                size="$5"
                theme="info"
                iconAfter={<Briefcase size={18} />}
                onPress={handleViewJobs}
              >
                View Open Positions ({jobsCount})
              </Button>
            ) : (
              <Stack backgroundColor="$color3" padding="$3" borderRadius="$3" alignItems="center">
                <Text fontSize="$4" color="$color11">
                  No open positions at this time
                </Text>
              </Stack>
            )}
          </Stack>
        </>
      )}
    </ResponsiveModal>
  )
}
