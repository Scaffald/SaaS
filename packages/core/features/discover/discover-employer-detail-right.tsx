import { useMemo } from 'react'
import { useToastController } from '@tamagui/toast'
import { BellPlus, Briefcase, CheckCircle2, Loader2, Network, UserPlus } from '@tamagui/lucide-icons'
import { DashboardWidget } from '@app/ui'
import { api } from '@app/core/utils/api'
import { Separator, Text, XStack, YStack, Button } from 'tamagui'

type DiscoverEmployerDetailRightProps = {
  employerId: string
}

/**
 * DiscoverEmployerDetailRight
 * Renders engagement CTAs for an employer, including follow and employment claim actions.
 */
export function DiscoverEmployerDetailRight({ employerId }: DiscoverEmployerDetailRightProps) {
  const toast = useToastController()

  const { data: employer, isLoading } = api.employers.getEmployerById.useQuery(
    { id: employerId },
    { enabled: Boolean(employerId) }
  )

  const { data: openJobs, isLoading: jobsLoading } = api.organizations.getOpenJobsCount.useQuery(
    { organizationId: employerId },
    { enabled: Boolean(employerId) }
  )

  const organizationName = employer?.name ?? 'this organization'
  const createdAt = useMemo(() => {
    if (!employer?.created_at) return null
    return new Date(employer.created_at).toLocaleDateString()
  }, [employer?.created_at])

  const handleFollow = () => {
    toast.show('Follow coming soon', {
      message: 'We are wiring up organization follows with notifications in REQ-92.',
    })
  }

  const handleWorkHere = () => {
    toast.show('Claim in progress', {
      message: 'Worker-to-organization associations will be available once the new flow ships.',
    })
  }

  return (
    <DashboardWidget gap="$4">
      <YStack gap="$2">
        <XStack gap="$2" items="center">
          <Network size={18} color="$blue10" />
          <Text fontSize="$5" fontWeight="700" color="$color12">
            Stay Connected
          </Text>
        </XStack>
        <Text fontSize="$3" color="$color11">
          Follow {organizationName} to get updates or claim your role to link your profile to the
          team.
        </Text>
      </YStack>

      <Separator />

      {isLoading ? (
        <XStack gap="$2" items="center">
          <Loader2 size={16} color="$blue10" />
          <Text fontSize="$3" color="$color11">
            Loading organization context...
          </Text>
        </XStack>
      ) : (
        <OrganizationSnapshot
          name={organizationName}
          createdAt={createdAt}
          openJobs={openJobs?.count}
          jobsLoading={jobsLoading}
        />
      )}

      <Separator />

      <YStack gap="$2">
        <Button size="$4" icon={UserPlus} onPress={handleFollow}>
          Follow Organization
        </Button>
        <Button size="$4" theme="green" icon={Briefcase} onPress={handleWorkHere}>
          I Work Here
        </Button>
      </YStack>

      <Separator />

      <YStack gap="$2">
        <XStack gap="$2" items="center">
          <BellPlus size={16} color="$color10" />
          <Text fontSize="$3" fontWeight="600" color="$color10">
            What happens next?
          </Text>
        </XStack>
        <Text fontSize="$2" color="$color10">
          These actions will soon drive notifications and profile updates. For now, use them to
          preview the upcoming workflow—we&apos;ll promote them in REQ-92.
        </Text>
      </YStack>
    </DashboardWidget>
  )
}

type OrganizationSnapshotProps = {
  name: string
  createdAt: string | null
  openJobs?: number | null
  jobsLoading: boolean
}

function OrganizationSnapshot({ name, createdAt, openJobs, jobsLoading }: OrganizationSnapshotProps) {
  return (
    <YStack gap="$2">
      <XStack gap="$2" items="center">
        <CheckCircle2 size={16} color="$green10" />
        <Text fontSize="$3" fontWeight="600" color="$green10">
          {name}
        </Text>
      </XStack>
      {createdAt && (
        <Text fontSize="$2" color="$color10">
          Onboarded {createdAt}
        </Text>
      )}
      <Text fontSize="$3" color="$color11">
        {jobsLoading
          ? 'Checking open roles...'
          : typeof openJobs === 'number'
            ? `${openJobs} active ${openJobs === 1 ? 'role' : 'roles'}`
            : 'Open roles data unavailable'}
      </Text>
    </YStack>
  )
}

