import { Button, Paragraph, Text, YStack } from 'tamagui'
import { StyleguidePage, AnchorHeading, useStyleguideContext } from './_components'

export default function ApprovalQueuePage() {
  const { approvalQueue } = useStyleguideContext()

  return (
    <StyleguidePage
      title="Approval Queue"
      description="Outstanding decisions and TODO callouts that need sign-off before launch."
    >
      <YStack gap="$6">
        <AnchorHeading description="Review every pending TODO card.">
          Pending items
        </AnchorHeading>
        <YStack gap="$4">
          {approvalQueue.map((item) => (
            <YStack key={item.id} gap="$3" borderWidth={1} borderColor="$gray5" borderRadius="$6" padding="$4">
              <Text fontWeight="700">{item.title}</Text>
              <Paragraph color="$gray11">{item.context}</Paragraph>
              <Paragraph color="$gray11" fontStyle="italic">
                Suggested default: {item.suggestion}
              </Paragraph>
              <YStack gap="$2">
                {item.links.map((link) => (
                  <Text key={link} fontSize={12} color="$blue10">
                    {link}
                  </Text>
                ))}
              </YStack>
              <YStack gap="$2" $sm={{ flexDirection: 'column' }}>
                <Button size="$2" theme="primary" chromeless>
                  Approve
                </Button>
                <Button size="$2" chromeless>
                  Defer
                </Button>
                <Button size="$2" theme="danger" chromeless>
                  Reject
                </Button>
              </YStack>
            </YStack>
          ))}
        </YStack>
      </YStack>
    </StyleguidePage>
  )
}
