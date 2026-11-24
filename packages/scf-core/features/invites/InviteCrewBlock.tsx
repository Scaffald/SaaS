/**
 * The worker home's "Invite your crew" block (#1398): a line, the joined
 * count once there is one, and a button to the full screen.
 */
import { Button, Stack, Text } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { ROUTES } from '../../constants/routes'
import { useInvites } from '../../utils/invites-sdk-hooks'

export function InviteCrewBlock() {
  const router = useRouter()
  const { data } = useInvites()
  const joined = data?.counts.joined ?? 0
  return (
    <Stack gap={8} testID="invite-crew-block">
      <Text weight="semibold">Invite your crew</Text>
      <Text size="sm" color="gray">
        {joined > 0
          ? `${joined} ${joined === 1 ? 'person has' : 'people have'} joined from your invites.`
          : 'Know someone looking for work? Bring them to Scaffald.'}
      </Text>
      <Button size="sm" onPress={() => router.push(ROUTES.DASHBOARD.INVITE.path)}>
        Invite people
      </Button>
    </Stack>
  )
}
