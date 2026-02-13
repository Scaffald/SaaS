import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useJobDetails } from '@scf/core/utils/jobs-sdk-hooks'
import { ResponsiveModal } from '@unicornlove/beyond-ui'
import { Briefcase, Building2, Clock, DollarSign, ExternalLink, MapPin } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Button, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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

  // Fetch job data (SDK)
  const query = useJobDetails(jobId ?? '', { enabled: !!jobId && open })
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
      size="md"
    >
      {isLoading ? (
        <Stack paddingVertical={32} align="center" justify="center">
          <Spinner size="lg" color="$blue10" />
          <Text marginTop={16} color="$gray11">
            Loading job details...
          </Text>
        </Stack>
      ) : !job ? (
        <Stack paddingVertical={32} align="center">
          <Text color="$red10">Job not found</Text>
        </Stack>
      ) : (
        <>
          {/* Job Header */}
          <Stack gap={12} align="center">
            <Stack
              width={80}
              height={80}
              borderRadius={24}
              backgroundColor="$blue4"
              align="center"
              justify="center"
            >
              <Briefcase size={40} color="$blue10" />
            </Stack>

            <Stack gap={8} align="center">
              <Text color="$gray11">{job.title}</Text>
              {job.organization?.name && (
                <Row gap={8} align="center">
                  <Building2 size="md" color="$gray11" />
                  <Text color="$gray11">{job.organization.name}</Text>
                </Row>
              )}
            </Stack>

            {/* Job Type Badge */}
            {(job.employment_type || job.position_level) && (
              <Row gap={8} flexWrap="wrap" justify="center">
                {job.employment_type && (
                  <Row
                    backgroundColor="$blue2"
                    paddingHorizontal={12}
                    paddingVertical={6}
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="$blue5"
                  >
                    <Text color="$blue11">{formatEmploymentType(job.employment_type)}</Text>
                  </Row>
                )}
                {job.position_level && (
                  <Row
                    backgroundColor="$color3"
                    paddingHorizontal={12}
                    paddingVertical={6}
                    borderRadius={12}
                  >
                    <Text color="$gray11">{job.position_level}</Text>
                  </Row>
                )}
              </Row>
            )}
          </Stack>

          <Separator />

          {/* Quick Info */}
          <Stack gap={12}>
            {job.location && (
              <Row gap={8} align="center">
                <MapPin size={18} color="$gray11" />
                <Text color="$gray11">{job.location}</Text>
              </Row>
            )}

            {job.remote_option && (
              <Row gap={8} align="center">
                <Clock size={18} color="$gray11" />
                <Text color="$gray11">{formatRemoteOption(job.remote_option)}</Text>
              </Row>
            )}

            {(job.pay_range_min_cents || job.pay_range_max_cents) && (
              <Row gap={8} align="center">
                <DollarSign size={18} color="$gray11" />
                <Text color="$gray11">
                  {formatPayRange(
                    job.pay_range_min_cents ?? null,
                    job.pay_range_max_cents ?? null,
                    job.pay_range_type ?? null
                  )}
                  {job.pay_range_type === 'annual' && ' annually'}
                </Text>
              </Row>
            )}

            {job.status === 'open' && (
              <Row
                backgroundColor="$green3"
                paddingHorizontal={12}
                paddingVertical={6}
                borderRadius={12}
              >
                <Text color="$green11">Accepting Applications</Text>
              </Row>
            )}
          </Stack>

          {/* Description Preview */}
          {job.description && (
            <>
              <Separator />
              <Stack gap={8}>
                <Text color="$gray11">Description</Text>
                <Text color="$gray11" lineHeight={4} numberOfLines={4}>
                  {job.description}
                </Text>
              </Stack>
            </>
          )}

          <Separator />

          {/* CTA Button */}
          <Button
            size="lg"
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
