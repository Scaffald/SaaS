import { ROUTES, buildPath } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { ResponsiveModal } from '@unicornlove/ui'
import {
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
} from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { Button, Separator, Spinner, Text, XStack, YStack } from 'tamagui'

interface JobData {
  id?: string
  title?: string | null
  organization?: {
    name?: string | null
  } | null
  employment_type?: string | null
  position_level?: string | null
  location?: string | null
  remote_option?: string | null
  pay_range_min_cents?: number | null
  pay_range_max_cents?: number | null
  pay_range_type?: string | null
  status?: string | null
  description?: string | null
}

interface JobPreviewModalProps {
  jobId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Job Preview Modal
 * Shows a quick preview of a job posting with option to view full details
 */
export function JobPreviewModal({ jobId, open, onOpenChange }: JobPreviewModalProps) {
  const router = useRouter()

  // Fetch job data
  const query = api.jobs.getJobDetails.useQuery({ id: jobId || '' }, { enabled: !!jobId && open })
  const job = query.data as JobData | undefined
  const isLoading = query.isLoading

  const formatPayRange = (
    minCents: number | null,
    maxCents: number | null,
    type: string | null
  ) => {
    if (!minCents && !maxCents) return null

    const formatAmount = (cents: number) => {
      const dollars = cents / 100
      if (type === 'hourly') {
        return `$${dollars.toFixed(2)}/hr`
      }
      // For annual, format as K
      if (dollars >= 1000) {
        return `$${(dollars / 1000).toFixed(0)}K`
      }
      return `$${dollars.toFixed(0)}`
    }

    if (minCents && maxCents) {
      return `${formatAmount(minCents)} - ${formatAmount(maxCents)}`
    }
    if (minCents) {
      return `From ${formatAmount(minCents)}`
    }
    if (maxCents) {
      return `Up to ${formatAmount(maxCents)}`
    }
    return null
  }

  const formatEmploymentType = (type: string | null) => {
    if (!type) return null
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
  }

  const formatRemoteOption = (option: string | null) => {
    if (!option) return null
    return option.charAt(0).toUpperCase() + option.slice(1).replace(/_/g, ' ')
  }

  const handleViewFullDetails = () => {
    if (job?.id) {
      router.push(buildPath(ROUTES.DASHBOARD.DISCOVER.JOBS.DETAIL, { id: job.id }))
      onOpenChange(false)
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={job?.title || 'Job Details'}
      size="medium"
    >
      {isLoading ? (
        <YStack py="$8" items="center" justify="center">
          <Spinner size="large" color="$blue10" />
          <Text mt="$4" color="$color11">
            Loading job details...
          </Text>
        </YStack>
      ) : !job ? (
        <YStack py="$8" items="center">
          <Text color="$red10" fontSize="$5" fontWeight="600">
            Job not found
          </Text>
        </YStack>
      ) : (
        <>
          {/* Job Header */}
          <YStack gap="$3" items="center">
            <YStack width={80} height={80} rounded="$6" bg="$blue4" items="center" justify="center">
              <Briefcase size={40} color="$blue10" />
            </YStack>

            <YStack gap="$2" items="center">
              <Text fontSize="$8" fontWeight="700" color="$color12">
                {job.title}
              </Text>
              {job.organization?.name && (
                <XStack gap="$2" items="center">
                  <Building2 size={16} color="$color10" />
                  <Text fontSize="$5" color="$color11">
                    {job.organization.name}
                  </Text>
                </XStack>
              )}
            </YStack>

            {/* Job Type Badge */}
            {(job.employment_type || job.position_level) && (
              <XStack gap="$2" flexWrap="wrap" justify="center">
                {job.employment_type && (
                  <XStack
                    bg="$blue2"
                    px="$3"
                    py="$1.5"
                    rounded="$3"
                    borderWidth={1}
                    borderColor="$blue5"
                  >
                    <Text fontSize="$3" fontWeight="600" color="$blue11">
                      {formatEmploymentType(job.employment_type)}
                    </Text>
                  </XStack>
                )}
                {job.position_level && (
                  <XStack bg="$color3" px="$3" py="$1.5" rounded="$3">
                    <Text fontSize="$3" fontWeight="600" color="$color11">
                      {job.position_level}
                    </Text>
                  </XStack>
                )}
              </XStack>
            )}
          </YStack>

          <Separator />

          {/* Quick Info */}
          <YStack gap="$3">
            {job.location && (
              <XStack gap="$2" items="center">
                <MapPin size={18} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  {job.location}
                </Text>
              </XStack>
            )}

            {job.remote_option && (
              <XStack gap="$2" items="center">
                <Clock size={18} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  {formatRemoteOption(job.remote_option)}
                </Text>
              </XStack>
            )}

            {(job.pay_range_min_cents || job.pay_range_max_cents) && (
              <XStack gap="$2" items="center">
                <DollarSign size={18} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  {formatPayRange(
                    job.pay_range_min_cents ?? null,
                    job.pay_range_max_cents ?? null,
                    job.pay_range_type ?? null
                  )}
                  {job.pay_range_type === 'annual' && ' annually'}
                </Text>
              </XStack>
            )}

            {job.status === 'open' && (
              <XStack bg="$green3" px="$3" py="$1.5" rounded="$3">
                <Text fontSize="$3" fontWeight="600" color="$green11">
                  Accepting Applications
                </Text>
              </XStack>
            )}
          </YStack>

          {/* Description Preview */}
          {job.description && (
            <>
              <Separator />
              <YStack gap="$2">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Description
                </Text>
                <Text fontSize="$4" color="$color11" lineHeight="$1" numberOfLines={4}>
                  {job.description}
                </Text>
              </YStack>
            </>
          )}

          <Separator />

          {/* CTA Button */}
          <Button
            size="$5"
            theme="info"
            iconAfter={<ExternalLink size={18} />}
            onPress={handleViewFullDetails}
          >
            View Full Details & Apply
          </Button>
        </>
      )}
    </ResponsiveModal>
  )
}
