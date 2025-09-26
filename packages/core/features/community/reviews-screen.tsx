import { Button, Card, Paragraph, Text, XStack, YStack } from '@app/ui'
import { MessageCircleHeart, Star, Users } from '@tamagui/lucide-icons'
import { useLink } from 'solito/link'

import { ROUTES } from '@app/core/constants/routes'

export const CommunityReviewsScreen = () => {
  const communityLink = useLink({ href: ROUTES.COMMUNITY })

  return (
    <YStack gap="$5" width="100%" paddingBottom="$4">
      <YStack gap="$2">
        <Text fontSize="$9" fontWeight="$8">
          Peer reviews
        </Text>
        <Paragraph size="$4" color="$gray11">
          Invite collaborators to recognise your contributions and build your reputation across the
          network.
        </Paragraph>
      </YStack>
      <Card bordered padding="$5" backgroundColor="$background">
        <YStack gap="$3">
          <Text fontWeight="$7" fontSize="$5">
            We&apos;re polishing this experience
          </Text>
          <Paragraph size="$3" color="$gray11">
            Peer reviews will let you gather trusted testimonials from the teams you work with. Here&apos;s
            a preview of what&apos;s on the way:
          </Paragraph>
          <YStack gap="$2">
            <XStack gap="$3" alignItems="center">
              <Star size={20} color="$yellow10" />
              <Paragraph size="$3" color="$gray11">
                Capture specific wins and milestones so your best work is easy to share.
              </Paragraph>
            </XStack>
            <XStack gap="$3" alignItems="center">
              <MessageCircleHeart size={20} color="$pink10" />
              <Paragraph size="$3" color="$gray11">
                Request constructive feedback from teammates to keep levelling up your craft.
              </Paragraph>
            </XStack>
            <XStack gap="$3" alignItems="center">
              <Users size={20} color="$blue10" />
              <Paragraph size="$3" color="$gray11">
                Publish verified praise that helps hiring managers understand how you collaborate.
              </Paragraph>
            </XStack>
          </YStack>
          <Paragraph size="$3" color="$gray11">
            While we finish building the workflow, start exploring the community to find people you want
            to recognise—or who can recognise you.
          </Paragraph>
          <Button size="$3" {...communityLink} alignSelf="flex-start">
            Browse the community
          </Button>
        </YStack>
      </Card>
    </YStack>
  )
}
