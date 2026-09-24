import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { InquiryHistoryTimeline } from '@scf/core/features/inquiries/components/InquiryHistoryTimeline'
import { InquiryViewOrganization } from '@scf/core/features/inquiries/components/InquiryViewOrganization'
import { useInquiryByApplication } from '@scf/core/utils/inquiries-sdk-hooks'
import { Spinner, Stack, Text } from '@scaffald/ui'
import { useLocalSearchParams } from 'expo-router'
import { ScrollView } from 'react-native'

/**
 * The employer's view of an inquiry.
 *
 * This route rendered its content in a bare `ScrollView`, so unlike candidate
 * detail and hire beside it, it had no breadcrumb and no place in the Office
 * shell — you could not tell which candidate you were looking at from the
 * chrome (#837).
 */
export default function OfficeApplicationInquiryRoute() {
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>()
  const applicationParam = typeof applicationId === 'string' ? applicationId : ''
  const enabled = applicationParam.length > 0

  const { data, isLoading, error } = useInquiryByApplication(applicationParam, { enabled })

  const candidateName = data?.candidate?.displayName || data?.candidate?.username || 'Candidate'
  const jobTitle = data?.job?.title || 'Job'

  const body = () => {
    if (!enabled) return <Text color="gray">Missing application ID</Text>

    if (isLoading) {
      return (
        <Stack align="center" gap={8}>
          <Spinner size="lg" />
          <Text>Loading inquiry…</Text>
        </Stack>
      )
    }

    if (error) {
      return (
        <Stack align="center" gap={8}>
          <Text color="red">Unable to load inquiry</Text>
          <Text color="secondary">{error.message}</Text>
        </Stack>
      )
    }

    // No inquiry raised against this application yet. This used to share the red
    // error branch above, so the ordinary case was reported as a failure.
    if (!data || !data.inquiry) {
      return (
        <Stack align="center" gap={8}>
          <Text>No inquiry yet</Text>
          <Text color="secondary">No inquiry has been sent to this candidate.</Text>
        </Stack>
      )
    }

    return (
      <Stack gap={16}>
        <InquiryViewOrganization
          applicationId={applicationParam}
          inquiryId={data.inquiry.id as string}
          candidateName={candidateName}
          jobTitle={jobTitle}
        />
        <InquiryHistoryTimeline inquiryId={data.inquiry.id as string} />
      </Stack>
    )
  }

  return (
    <OfficeLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Office', href: ROUTES.OFFICE.path },
        { label: 'Applications', href: ROUTES.OFFICE.APPLICATIONS.path },
        {
          label: candidateName,
          href: enabled
            ? buildPath(ROUTES.OFFICE.APPLICATIONS.DETAIL, { applicationId: applicationParam })
            : '',
        },
        { label: 'Inquiry', href: '' },
      ]}
      leftContent={
        <ScrollView>
          <Stack gap={16} padding={16}>
            {body()}
          </Stack>
        </ScrollView>
      }
      leftContainerProps={{ minWidth: '100%' }}
    />
  )
}
