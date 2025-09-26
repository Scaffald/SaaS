import {
  ContentWrapper,
  ContentSection,
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
import { useProfileOverview } from './hooks'
import { Link } from 'solito/link'

export const ProfileOverviewScreen = () => {
  const { user, data, isPending } = useProfileOverview()

  if (isPending) {
    return (
      <ContentWrapper title="Profile Overview">
        <ContentSection title="Loading">
          <Paragraph>Loading profile data...</Paragraph>
        </ContentSection>
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper title="Profile Overview">
      {/* Profile Completion */}
      <ContentSection title="Profile Completion">
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
      </ContentSection>

      {/* Profile Summary */}
      <ContentSection title="Profile Summary">
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
      </ContentSection>

      {/* Quick Actions */}
      <ContentSection title="Quick Actions">
        <YStack gap="$3">
          <Link href="/profile/basic-info">
            <Button theme="blue" size="$3" w="100%">
              Edit Basic Information
            </Button>
          </Link>

          <Link href="/profile/work-skills">
            <Button theme="green" size="$3" w="100%">
              Update Work & Skills
            </Button>
          </Link>

          <Link href="/profile/travel-compliance">
            <Button theme="purple" size="$3" w="100%">
              Manage Travel & Compliance
            </Button>
          </Link>

          <Link href="/profile/contact-availability">
            <Button theme="pink" size="$3" w="100%">
              Update Contact & Availability
            </Button>
          </Link>
        </YStack>
      </ContentSection>

      {/* Profile Status */}
      <ContentSection title="Status">
        <KVTable.Row>
          <KVTable.Key>
            <SizableText fow="900">Open to Work</SizableText>
          </KVTable.Key>
          <KVTable.Value>
            <Theme inverse={data.openToWork}>
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
      </ContentSection>
    </ContentWrapper>
  )
}
