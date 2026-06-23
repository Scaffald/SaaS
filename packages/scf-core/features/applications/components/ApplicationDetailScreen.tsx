import type { Application } from '@scaffald/sdk/resources/applications'
import { ROUTES } from '@scf/core/constants/routes'
import {
  useApplication,
  useApplicationActivity,
  useApplicationMessages,
  useWithdrawApplicationMutation,
} from '@scf/core/utils/applications-sdk-hooks'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  DollarSign,
  MapPin,
  MessageSquare,
  Wifi,
} from 'lucide-react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ScrollView } from 'react-native'
import {
  Button,
  DashboardWidget,
  Modal,
  ModalContent,
  ModalHeader,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
  useToast,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ActivityTimeline } from './ActivityTimeline'
import { ApplicationStatusBadge } from './ApplicationStatusBadge'

interface ApplicationDetailScreenProps {
  applicationId: string
}

function formatPayRange(
  minCents: number | null | undefined,
  maxCents: number | null | undefined,
  type: string | null | undefined
): string | null {
  if (!minCents && !maxCents) return null
  const suffix = type === 'hourly' ? '/hr' : type === 'salary' ? '/yr' : ''
  const fmt = (cents: number) => {
    const dollars = cents / 100
    return dollars >= 1000 ? `$${Math.round(dollars / 1000)}K` : `$${dollars}`
  }
  if (minCents && maxCents) return `${fmt(minCents)} - ${fmt(maxCents)}${suffix}`
  if (minCents) return `${fmt(minCents)}+${suffix}`
  if (maxCents) return `Up to ${fmt(maxCents)}${suffix}`
  return null
}

const REMOTE_LABELS: Record<string, string> = {
  on_site: 'On-Site',
  hybrid: 'Hybrid',
  remote: 'Remote',
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Full-Time',
  part_time: 'Part-Time',
  contract: 'Contract',
  temp: 'Temporary',
  intern: 'Internship',
}

const SCREENING_LABELS: Record<string, string> = {
  current_location: 'Location',
  willing_to_relocate: 'Willing to Relocate',
  years_experience: 'Years of Experience',
  is_authorized_to_work: 'Authorized to Work in US',
  earliest_start_date: 'Earliest Start Date',
}

const WITHDRAWABLE_STATUSES = ['pending', 'reviewing', 'inquired']

export function ApplicationDetailScreen({ applicationId }: ApplicationDetailScreenProps) {
  const router = useRouter()
  const { theme } = useThemeContext()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false)

  const { data: applicationData, isLoading } = useApplication(applicationId)
  // The SDK retrieve() returns the raw API response { data: Application }
  const application = (applicationData as { data?: Application } | undefined)?.data ?? applicationData ?? null
  const { data: activityResponse } = useApplicationActivity(applicationId)
  const { data: messagesResponse } = useApplicationMessages(applicationId)

  const withdrawMutation = useWithdrawApplicationMutation({
    onSuccess: () => {
      toast.show({ title: 'Application withdrawn', message: 'Your application has been withdrawn.', variant: 'success' })
      setShowWithdrawConfirm(false)
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: (error) => {
      toast.show({
        title: 'Failed to withdraw',
        message: error.message,
        variant: 'error',
      })
    },
  })

  if (isLoading) {
    return (
      <Stack align="center" justify="center" padding="xl" gap={12}>
        <Spinner size="lg" />
        <Text style={{ color: colors.text[theme].secondary }}>Loading application...</Text>
      </Stack>
    )
  }

  if (!application) {
    return (
      <Stack align="center" justify="center" padding="xl" gap={12}>
        <Text style={{ color: colors.text[theme].secondary }}>Application not found.</Text>
        <Button
          size="md"
          variant="outline"
          onPress={() => router.push(ROUTES.JOBS.APPLICATIONS.path as never)}
        >
          Back to Applications
        </Button>
      </Stack>
    )
  }

  const job = application.job
  const payRange = formatPayRange(
    job?.pay_range_min_cents,
    job?.pay_range_max_cents,
    job?.pay_range_type
  )
  const appliedDate = application.created_at ? new Date(application.created_at) : null
  const appliedAgo =
    appliedDate && !Number.isNaN(appliedDate.getTime())
      ? formatDistanceToNow(appliedDate, { addSuffix: true })
      : 'recently'
  const canWithdraw = WITHDRAWABLE_STATUSES.includes(application.status)
  const screening = application.screening_answers ?? {}
  const activity = activityResponse?.data ?? []
  const messages = messagesResponse?.data ?? []

  // Synthesize a minimum timeline from created_at if no activity entries exist
  const timelineEntries =
    activity.length > 0
      ? activity
      : [
          {
            id: 'submitted',
            event_type: 'application_submitted',
            details: null,
            created_at: application.created_at,
          },
        ]

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Stack gap={20} padding="md">
        {/* Back button + Messages */}
        <Row justify="space-between" align="center" gap={8}>
          <Button
            size="sm"
            variant="outline"
            iconStart={ArrowLeft}
            onPress={() => router.push(ROUTES.JOBS.APPLICATIONS.path as never)}
          >
            Back to Applications
          </Button>
          <Button
            size="sm"
            variant="outline"
            iconStart={MessageSquare}
            onPress={() =>
              router.push(`/jobs/applications/${applicationId}/messages` as never)
            }
          >
            Messages
          </Button>
        </Row>

        {/* Header */}
        <DashboardWidget gap={12}>
          <Row justify="space-between" align="flex-start">
            <Stack gap={4} style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text[theme].primary,
                  fontSize: 20,
                  fontWeight: '700',
                }}
              >
                {job?.title ?? 'Job'}
              </Text>
              <Text style={{ color: colors.text[theme].secondary, fontSize: 15 }}>
                {job?.organization?.name ?? 'Company'}
              </Text>
            </Stack>
            <ApplicationStatusBadge status={application.status} />
          </Row>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
            Applied {appliedAgo}
          </Text>
        </DashboardWidget>

        {/* Job Summary */}
        {job && (
          <DashboardWidget gap={12}>
            <Text
              style={{ color: colors.text[theme].primary, fontSize: 15, fontWeight: '600' }}
            >
              Job Details
            </Text>
            <Row gap={16} wrap>
              {job.location && (
                <Row gap={6} align="center">
                  <MapPin size={15} color={colors.text[theme].tertiary} />
                  <Text style={{ color: colors.text[theme].secondary, fontSize: 14 }}>
                    {job.location}
                  </Text>
                </Row>
              )}
              {job.employment_type && (
                <Row gap={6} align="center">
                  <Briefcase size={15} color={colors.text[theme].tertiary} />
                  <Text style={{ color: colors.text[theme].secondary, fontSize: 14 }}>
                    {EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type}
                  </Text>
                </Row>
              )}
              {job.remote_option && (
                <Row gap={6} align="center">
                  <Wifi size={15} color={colors.text[theme].tertiary} />
                  <Text style={{ color: colors.text[theme].secondary, fontSize: 14 }}>
                    {REMOTE_LABELS[job.remote_option] ?? job.remote_option}
                  </Text>
                </Row>
              )}
              {payRange && (
                <Row gap={6} align="center">
                  <DollarSign size={15} color={colors.text[theme].tertiary} />
                  <Text style={{ color: colors.text[theme].secondary, fontSize: 14 }}>
                    {payRange}
                  </Text>
                </Row>
              )}
            </Row>
          </DashboardWidget>
        )}

        {/* Screening Answers */}
        {Object.keys(screening).length > 0 && (
          <DashboardWidget gap={12}>
            <Text
              style={{ color: colors.text[theme].primary, fontSize: 15, fontWeight: '600' }}
            >
              Your Screening Answers
            </Text>
            <Stack gap={8}>
              {Object.entries(screening).map(([key, value]) => {
                const label = SCREENING_LABELS[key] ?? key.replace(/_/g, ' ')
                const display =
                  typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value ?? '—')
                return (
                  <Row key={key} justify="space-between">
                    <Text style={{ color: colors.text[theme].secondary, fontSize: 14 }}>
                      {label}
                    </Text>
                    <Text
                      style={{
                        color: colors.text[theme].primary,
                        fontSize: 14,
                        fontWeight: '500',
                      }}
                    >
                      {display}
                    </Text>
                  </Row>
                )
              })}
            </Stack>
          </DashboardWidget>
        )}

        {/* Activity Timeline */}
        <DashboardWidget gap={12}>
          <Text style={{ color: colors.text[theme].primary, fontSize: 15, fontWeight: '600' }}>
            Activity
          </Text>
          <ActivityTimeline entries={timelineEntries} />
        </DashboardWidget>

        {/* Messages */}
        {messages.length > 0 && (
          <DashboardWidget gap={12}>
            <Text
              style={{ color: colors.text[theme].primary, fontSize: 15, fontWeight: '600' }}
            >
              Messages ({messages.length})
            </Text>
            <Stack gap={12}>
              {messages.map((msg) => (
                <Stack
                  key={msg.id}
                  gap={4}
                  padding="sm"
                  borderRadius={8}
                  style={{
                    backgroundColor: colors.bg[theme].muted,
                    borderColor: colors.border[theme].default,
                    borderWidth: 1,
                  }}
                >
                  <Row justify="space-between">
                    <Text
                      style={{
                        color: colors.text[theme].primary,
                        fontSize: 13,
                        fontWeight: '600',
                      }}
                    >
                      {msg.sender_role === 'applicant'
                        ? 'You'
                        : msg.sender_role === 'recruiter'
                          ? 'Recruiter'
                          : 'System'}
                    </Text>
                    <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </Text>
                  </Row>
                  <Text style={{ color: colors.text[theme].secondary, fontSize: 14 }}>
                    {msg.body}
                  </Text>
                </Stack>
              ))}
            </Stack>
          </DashboardWidget>
        )}

        {/* Withdraw Button */}
        {canWithdraw && (
          <Button
            size="md"
            variant="outline"
            color="error"
            iconStart={AlertTriangle}
            onPress={() => setShowWithdrawConfirm(true)}
          >
            Withdraw Application
          </Button>
        )}

        {/* Withdraw Confirmation Modal */}
        <Modal
          visible={showWithdrawConfirm}
          onClose={() => setShowWithdrawConfirm(false)}
          width="90%"
        >
          <ModalHeader
            title="Withdraw Application?"
            description="This action cannot be undone. You will not be able to reapply for this position."
            onClose={() => setShowWithdrawConfirm(false)}
          />
          <ModalContent>
            <Row gap={12} justify="flex-end">
              <Button
                size="md"
                variant="outline"
                onPress={() => setShowWithdrawConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                size="md"
                color="error"
                disabled={withdrawMutation.isPending}
                onPress={() =>
                  withdrawMutation.mutate({ id: applicationId })
                }
              >
                {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw'}
              </Button>
            </Row>
          </ModalContent>
        </Modal>
      </Stack>
    </ScrollView>
  )
}
