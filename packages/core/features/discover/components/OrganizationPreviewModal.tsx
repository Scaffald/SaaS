import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { extractPlainText, ResponsiveModal } from '@app/ui'
import { Briefcase, Building2, ExternalLink, MapPin, Users } from '@tamagui/lucide-icons'
import type { JSONContent } from '@tiptap/core'
import { useRouter } from 'expo-router'
import { Button, Separator, Spinner, Text, XStack, YStack } from 'tamagui'

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
  const { data: jobsCount = 0 } = api.organizations.getOpenJobsCount.useQuery(
    { organizationId: organizationId || '' },
    { enabled: !!organizationId && open }
  )

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
        <YStack py="$8" items="center" justify="center">
          <Spinner size="large" color="$blue10" />
          <Text mt="$4" color="$color11">
            Loading organization details...
          </Text>
        </YStack>
      ) : !organization ? (
        <YStack py="$8" items="center">
          <Text color="$red10" fontSize="$5" fontWeight="600">
            Organization not found
          </Text>
        </YStack>
      ) : (
        <>
          {/* Organization Header */}
          <YStack gap="$3" items="center">
            <YStack width={80} height={80} rounded="$6" bg="$blue4" items="center" justify="center">
              <Building2 size={40} color="$blue10" />
            </YStack>

            <YStack gap="$2" items="center">
              <Text fontSize="$8" fontWeight="700" color="$color12">
                {organization.name}
              </Text>
              {organization.industry_name && (
                <Text fontSize="$5" color="$color11">
                  {organization.industry_name}
                </Text>
              )}
            </YStack>

            {/* Open Jobs Badge */}
            {jobsCount > 0 && (
              <XStack
                bg="$green2"
                px="$4"
                py="$2"
                rounded="$10"
                gap="$2"
                items="center"
                borderWidth={1}
                borderColor="$green5"
              >
                <Briefcase size={16} color="$green10" />
                <Text fontSize="$4" fontWeight="700" color="$green11">
                  {jobsCount} Open {jobsCount === 1 ? 'Position' : 'Positions'}
                </Text>
              </XStack>
            )}
          </YStack>

          <Separator />

          {/* Quick Info */}
          <YStack gap="$3">
            {formatAddress(organization.address) && (
              <XStack gap="$2" items="center">
                <MapPin size={18} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  {formatAddress(organization.address)}
                </Text>
              </XStack>
            )}

            {organization.employee_count_range && (
              <XStack gap="$2" items="center">
                <Users size={18} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  {organization.employee_count_range} employees
                </Text>
              </XStack>
            )}

            {organization.is_verified && (
              <XStack bg="$blue3" px="$3" py="$1.5" rounded="$3">
                <Text fontSize="$3" fontWeight="600" color="$blue11">
                  ✓ Verified Organization
                </Text>
              </XStack>
            )}
          </YStack>

          {/* Description */}
          {organization.description && (
            <>
              <Separator />
              <YStack gap="$2">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  About
                </Text>
                <Text fontSize="$4" color="$color11" lineHeight="$1" numberOfLines={4}>
                  {typeof organization.description === 'string'
                    ? organization.description
                    : extractPlainText(organization.description as JSONContent)}
                </Text>
              </YStack>
            </>
          )}

          {/* Website Link */}
          {organization.website_url && (
            <>
              <Separator />
              <XStack gap="$2" items="center">
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
              </XStack>
            </>
          )}

          <Separator />

          {/* CTA Buttons */}
          <YStack gap="$3">
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
              <YStack bg="$color3" p="$3" rounded="$3" items="center">
                <Text fontSize="$4" color="$color11">
                  No open positions at this time
                </Text>
              </YStack>
            )}
          </YStack>
        </>
      )}
    </ResponsiveModal>
  )
}
