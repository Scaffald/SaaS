import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useJobDetails } from '@scf/core/utils/jobs-sdk-hooks'
import { ResponsiveModal, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Briefcase, Building2, Clock, DollarSign, ExternalLink, MapPin } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Button, Separator, Spinner, Text, Row, Stack } from '@scaffald/ui'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

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
          <Spinner size="lg" color="primary" />
          <Text style={{ color: colors.text[t].secondary, marginTop: 16 }}>
            Loading job details...
          </Text>
        </Stack>
      ) : !job ? (
        <Stack paddingVertical={32} align="center">
          <Text style={{ color: t === 'dark' ? colors.error[300] : colors.error[600] }}>Job not found</Text>
        </Stack>
      ) : (
        <>
          {/* Job Header */}
          <Stack gap={12} align="center">
            <Stack
              width={80}
              height={80}
              borderRadius={24}
              style={{ backgroundColor: t === 'dark' ? colors.blue[900] : colors.blue[50] }}
              align="center"
              justify="center"
            >
              <Briefcase size={40} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
            </Stack>

            <Stack gap={8} align="center">
              <Text style={{ color: colors.text[t].secondary }}>{job.title}</Text>
              {job.organization?.name && (
                <Row gap={8} align="center">
                  <Building2 size="md" color={colors.text[t].tertiary} />
                  <Text style={{ color: colors.text[t].secondary }}>{job.organization.name}</Text>
                </Row>
              )}
            </Stack>

            {/* Job Type Badge */}
            {(job.employment_type || job.position_level) && (
              <Row gap={8} wrap justify="center">
                {job.employment_type && (
                  <Row
                    style={{
                      backgroundColor: t === 'dark' ? colors.blue[900] : colors.blue[50],
                      borderColor: t === 'dark' ? colors.blue[700] : colors.blue[200],
                    }}
                    paddingHorizontal={12}
                    paddingVertical={6}
                    borderRadius={12}
                    borderWidth={1}
                  >
                    <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[700] }}>
                      {formatEmploymentType(job.employment_type)}
                    </Text>
                  </Row>
                )}
                {job.position_level && (
                  <Row
                    style={{ backgroundColor: colors.bg[t].muted }}
                    paddingHorizontal={12}
                    paddingVertical={6}
                    borderRadius={12}
                  >
                    <Text style={{ color: colors.text[t].secondary }}>{job.position_level}</Text>
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
                <MapPin size={18} color={colors.text[t].tertiary} />
                <Text style={{ color: colors.text[t].secondary }}>{job.location}</Text>
              </Row>
            )}

            {job.remote_option && (
              <Row gap={8} align="center">
                <Clock size={18} color={colors.text[t].tertiary} />
                <Text style={{ color: colors.text[t].secondary }}>{formatRemoteOption(job.remote_option)}</Text>
              </Row>
            )}

            {(job.pay_range_min_cents || job.pay_range_max_cents) && (
              <Row gap={8} align="center">
                <DollarSign size={18} color={colors.text[t].tertiary} />
                <Text style={{ color: colors.text[t].secondary }}>
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
                style={{ backgroundColor: t === 'dark' ? colors.green[900] : colors.green[100] }}
                paddingHorizontal={12}
                paddingVertical={6}
                borderRadius={12}
              >
                <Text style={{ color: t === 'dark' ? colors.green[300] : colors.green[700] }}>Accepting Applications</Text>
              </Row>
            )}
          </Stack>

          {/* Description Preview */}
          {job.description && (
            <>
              <Separator />
              <Stack gap={8}>
                <Text style={{ color: colors.text[t].tertiary }}>Description</Text>
                <Text style={{ color: colors.text[t].secondary, lineHeight: 16 }}>
                  {job.description}
                </Text>
              </Stack>
            </>
          )}

          <Separator />

          {/* CTA Button */}
          <Button
            size="lg"
            color="primary"
            iconEnd={ExternalLink}
            onPress={handleViewFullDetails}
          >
            View Full Details & Apply
          </Button>
        </>
      )}
    </ResponsiveModal>
  )
}
