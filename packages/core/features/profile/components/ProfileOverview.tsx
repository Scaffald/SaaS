import {
  KVTable,
  SizableText,
  YStack,
  XStack,
  Avatar,
  H3,
  Paragraph,
  Button,
  Progress,
  Theme,
} from '@app/ui'
import { useProfileOverview } from '../hooks'
import { Link } from 'solito/link'

export const ProfileOverview = () => {
  const { user, data, isPending } = useProfileOverview()

  if (isPending) {
    return (
      <YStack gap="$4" p="$4">
        <H3>Profile Overview</H3>
        <YStack gap="$2" p="$4" br="$6" borderColor="$color4" borderWidth={1}>
          <Paragraph>Loading profile data...</Paragraph>
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack gap="$4" p="$4">
      <H3>Profile Overview</H3>

      {/* Profile Completion */}
      <YStack gap="$2" p="$4" br="$6" borderColor="$color4" borderWidth={1}>
        <SizableText fow="700" size="$4">
          Profile Completion
        </SizableText>
        <YStack gap="$3">
          <XStack ai="center" gap="$3">
            <Progress value={data.completionPercentage} max={100} size="$4" f={1}>
              <Progress.Indicator animation="bouncy" />
            </Progress>
            <SizableText fow="bold" size="$4">
              {data.completionPercentage}%
            </SizableText>
          </XStack>
          <Paragraph size="$3" color="$color11">
            Complete your profile to increase your visibility to employers
          </Paragraph>
        </YStack>
      </YStack>

      {/* Profile Summary */}
      <YStack gap="$2" p="$4" br="$6" borderColor="$color4" borderWidth={1}>
        <SizableText fow="700" size="$4">
          Profile Summary
        </SizableText>
        <XStack gap="$4" ai="flex-start">
          <Avatar circular size="$8">
            <Avatar.Image src={data.avatarUrl || undefined} />
            <Avatar.Fallback backgroundColor="$blue10">
              <SizableText color="white" fow="bold" size="$6">
                {data.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
              </SizableText>
            </Avatar.Fallback>
          </Avatar>

          <YStack f={1} gap="$2">
            <H3>{data.displayName || 'No name set'}</H3>
            {data.headline && (
              <SizableText size="$4" color="$color11">
                {data.headline}
              </SizableText>
            )}
            {data.location && (
              <SizableText size="$3" color="$color10">
                {data.location}
              </SizableText>
            )}
            {data.bio && (
              <Paragraph size="$3" color="$color11" numberOfLines={3}>
                {data.bio}
              </Paragraph>
            )}
          </YStack>
        </XStack>
      </YStack>

      {/* Quick Actions */}
      <YStack gap="$2" p="$4" br="$6" borderColor="$color4" borderWidth={1}>
        <SizableText fow="700" size="$4">
          Quick Actions
        </SizableText>
        <YStack gap="$3">
          <Link href="/profile/general">
            <Button theme="blue" size="$3" w="100%">
              Edit General Information
            </Button>
          </Link>

          <Link href="/profile/skills">
            <Button theme="green" size="$3" w="100%">
              Update Skills
            </Button>
          </Link>

          <Link href="/profile/background">
            <Button theme="purple" size="$3" w="100%">
              Manage Background
            </Button>
          </Link>

          <Link href="/profile/contact-availability">
            <Button theme="pink" size="$3" w="100%">
              Update Contact & Availability
            </Button>
          </Link>
        </YStack>
      </YStack>

      {/* Profile Status */}
      <YStack gap="$2" p="$4" br="$6" borderColor="$color4" borderWidth={1}>
        <SizableText fow="700" size="$4">
          Status
        </SizableText>
        <KVTable.Row>
          <KVTable.Key>
            <SizableText fow="900">Open to Work</SizableText>
          </KVTable.Key>
          <KVTable.Value>
            <Theme inverse={data.openToWork || false}>
              <SizableText color={data.openToWork ? '$green11' : '$color11'} fow="600">
                {data.openToWork ? 'Yes' : 'No'}
              </SizableText>
            </Theme>
          </KVTable.Value>
        </KVTable.Row>

        <KVTable.Row>
          <KVTable.Key>
            <SizableText fow="900">Profile Completion</SizableText>
          </KVTable.Key>
          <KVTable.Value>
            <SizableText>{data.completionPercentage}% complete</SizableText>
          </KVTable.Value>
        </KVTable.Row>
      </YStack>
    </YStack>
  )
}
