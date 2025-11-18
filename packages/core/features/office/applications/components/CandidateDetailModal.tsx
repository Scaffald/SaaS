import { useMemo, useState } from 'react'
import { XStack, YStack, Text, Button, Avatar, Tabs, Spinner } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { ResponsiveModal } from '@app/ui'
import type { MockApplication } from '../../mock-data/ats-mock-data'
import { CandidateProfileTab } from './CandidateProfileTab'
import { ApplicationDetailsTab } from './ApplicationDetailsTab'
import { NotesTab } from './NotesTab'
import { MessagesTab } from './MessagesTab'
import { InquiryTab } from './InquiryTab'
import { api } from '@app/core/utils/api'
import { useUser } from '@app/core/utils/useUser'
import type { AppRouter } from '@app/supabase/client-types'
import type { inferRouterOutputs } from '@trpc/server'

type MembersListOutput = inferRouterOutputs<AppRouter>['teams']['members']['list']
type MemberRecord = NonNullable<MembersListOutput['members']>[number]

interface CandidateDetailModalProps {
  application: MockApplication | null
  open: boolean
  onClose: () => void
}

export const CandidateDetailModal = ({ application, open, onClose }: CandidateDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'application' | 'notes' | 'messages' | 'inquiry'>(
    'profile'
  )

  // Check if there's an inquiry for this application
  const { data: inquiryData } = api.inquiries.getByApplication.useQuery(
    { applicationId: application?.id || '' },
    { enabled: !!application?.id && open }
  )
  const hasInquiry = !!inquiryData?.inquiry

  if (!application) return null

  const teamId = application.team?.id ?? null
  const teamIdForQuery = teamId ?? '00000000-0000-0000-0000-000000000000'
  const { user: currentUser } = useUser()
  const toast = useToastController()
  const utils = api.useUtils()

  const membersQuery = api.teams.members.list.useQuery(
    { teamId: teamIdForQuery },
    { enabled: Boolean(teamId) },
  )

  const mentionOptions = useMemo((): Array<{ id: string; label: string }> => {
    if (!membersQuery.data?.members) return []
    return (membersQuery.data.members as MemberRecord[])
      .filter((member: MemberRecord) => Boolean(member.user?.id))
      .map((member: MemberRecord) => ({
        id: member.user?.id as string,
        label:
          member.user?.displayName ??
          member.user?.username ??
          `User ${member.user?.id?.slice(0, 6) ?? ''}`,
      }))
  }, [membersQuery.data?.members])

  const assignMutation = api.teams.applications.assign.useMutation({
    onSuccess: async () => {
      toast.show('Application assigned', {
        message: 'You are now responsible for follow-up.',
      })
      if (teamId) {
        await utils.teams.analytics.activity.invalidate({ teamId, pageSize: 20 })
        await utils.teams.analytics.comments.invalidate({
          teamId,
          applicationId: application.id,
          limit: 50,
        })
      }
    },
    onError: (error: Error) => {
      toast.show('Unable to assign application', { message: error.message })
    },
  })

  const scoreColor =
    application.score >= 80 ? '$green10' : application.score >= 60 ? '$blue10' : '$red10'
  const scoreBg = application.score >= 80 ? '$green3' : application.score >= 60 ? '$blue3' : '$red3'

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
      title={application.candidate.name}
      size="large"
    >
      {/* Candidate Header */}
      <XStack gap="$3" items="center">
        <Avatar circular size="$6">
          <Avatar.Image src={application.candidate.photo} />
          <Avatar.Fallback bg="$blue9">
            <Text color="white" fontWeight="600" fontSize="$6">
              {application.candidate.name.charAt(0)}
            </Text>
          </Avatar.Fallback>
        </Avatar>

        <YStack flex={1}>
          <Text fontSize="$4" opacity={0.7}>
            {application.candidate.title}
          </Text>
          <Text fontSize="$2" opacity={0.6} mt="$1">
            {application.candidate.location}
          </Text>
        </YStack>
      </XStack>

      {/* Score Badge */}
      <YStack bg={scoreBg} px="$4" py="$3" rounded="$4" items="center">
        <Text fontSize="$8" fontWeight="700" color={scoreColor}>
          {application.score}
        </Text>
        <Text fontSize="$3" fontWeight="600" opacity={0.8}>
          Application Score
        </Text>
      </YStack>

      {/* Quick Actions */}
      <XStack gap="$2">
        <Button theme="success" flex={1} size="$4">
          Advance to Interview
        </Button>
        <Button theme="error" flex={1} size="$4">
          Reject
        </Button>
      </XStack>
      <Button flex={1} size="$4">
        Send Message
      </Button>
      {teamId && currentUser?.id ? (
        <Button
          flex={1}
          size="$4"
          variant="outlined"
          onPress={() =>
            assignMutation.mutate({
              teamId,
              applicationId: application.id,
              assigneeUserId: currentUser.id,
            })
          }
          disabled={assignMutation.isPending}
        >
          {assignMutation.isPending ? <Spinner size="small" /> : 'Assign to me'}
        </Button>
      ) : null}
      {teamId ? (
        <YStack gap="$1">
          <Text fontSize="$3" opacity={0.6}>
            Current assignee
          </Text>
          <Text fontSize="$4" fontWeight="600">
            {application.team?.assignedUserId
              ? mentionOptions.find((option) => option.id === application.team?.assignedUserId)?.label ??
                `User ${application.team?.assignedUserId.slice(0, 6)}`
              : 'Unassigned'}
          </Text>
        </YStack>
      ) : null}

      {/* Application Meta */}
      <XStack gap="$4" flexWrap="wrap">
        <YStack flex={1} width={150}>
          <Text fontSize="$2" opacity={0.6}>
            Applied
          </Text>
          <Text fontSize="$3" fontWeight="600">
            {new Date(application.appliedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </YStack>
        <YStack flex={1} width={150}>
          <Text fontSize="$2" opacity={0.6}>
            Job
          </Text>
          <Text fontSize="$3" fontWeight="600">
            {application.job.title}
          </Text>
        </YStack>
        <YStack flex={1} width={150}>
          <Text fontSize="$2" opacity={0.6}>
            Experience
          </Text>
          <Text fontSize="$3" fontWeight="600">
            {application.candidate.yearsExperience} years
          </Text>
        </YStack>
      </XStack>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        orientation="horizontal"
        flexDirection="column"
        flex={1}
      >
        <Tabs.List gap="$2" bg="$color2" p="$1" rounded="$3">
          <Tabs.Tab value="profile" flex={1}>
            <Text fontSize="$3" fontWeight="600">
              Profile
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="application" flex={1}>
            <Text fontSize="$3" fontWeight="600">
              Application
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="notes" flex={1}>
            <Text fontSize="$3" fontWeight="600">
              Notes ({application.notes.length})
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="messages" flex={1}>
            <Text fontSize="$3" fontWeight="600">
              Messages ({application.messages.length})
            </Text>
          </Tabs.Tab>
          {hasInquiry && (
            <Tabs.Tab value="inquiry" flex={1}>
              <Text fontSize="$3" fontWeight="600">
                Inquiry
              </Text>
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Content value="profile" pt="$4">
          <CandidateProfileTab candidate={application.candidate} />
        </Tabs.Content>

        <Tabs.Content value="application" pt="$4">
          <ApplicationDetailsTab application={application} />
        </Tabs.Content>

        <Tabs.Content value="notes" pt="$4">
          <NotesTab
            applicationId={application.id}
            teamId={teamId}
            mentionOptions={mentionOptions}
          />
        </Tabs.Content>

        <Tabs.Content value="messages" pt="$4">
          <MessagesTab messages={application.messages} applicationId={application.id} />
        </Tabs.Content>

        {hasInquiry && inquiryData && (
          <Tabs.Content value="inquiry" pt="$4">
            <InquiryTab
              applicationId={application.id}
              inquiryId={inquiryData.inquiry.id}
              candidateName={application.candidate.name}
              jobTitle={application.job.title}
            />
          </Tabs.Content>
        )}
      </Tabs>
    </ResponsiveModal>
  )
}
