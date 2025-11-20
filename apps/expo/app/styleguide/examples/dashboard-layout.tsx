import { Button, DashboardLayout, Paragraph, Text, XStack, YStack } from '@app/ui'

export default function DashboardLayoutExamplePage() {
  return (
    <DashboardLayout
      breadcrumbItems={[
        { label: 'Styleguide', href: '/styleguide' },
        { label: 'Examples', href: '/styleguide/examples' },
        { label: 'Dashboard layout', href: '/styleguide/examples/dashboard-layout' },
      ]}
      leftContent={
        <YStack gap="$4">
          <YStack
            bg="$color1"
            p="$4"
            borderWidth={1}
            borderColor="$color6"
            gap="$3"
            style={{ borderRadius: 16 }}
          >
            <Text fontSize={18} fontWeight="600" color="$color11">
              Team insights
            </Text>
            <Paragraph color="$color10">
              Monitor team participation and quickly surface areas where action is needed. This card
              stretches to fill available space on larger displays.
            </Paragraph>
            <XStack gap="$3" flexWrap="wrap">
              <Button size="$4">Invite teammates</Button>
              <Button size="$4" bg="$color3" color="$color11">
                View analytics
              </Button>
            </XStack>
          </YStack>

          <YStack
            bg="$color1"
            p="$4"
            borderWidth={1}
            borderColor="$color6"
            gap="$2"
            style={{ borderRadius: 16 }}
          >
            <Text fontSize={16} fontWeight="600" color="$color11">
              Recent activity
            </Text>
            <Paragraph color="$color10">• Compliance policy acknowledged by 18 teammates</Paragraph>
            <Paragraph color="$color10">• 4 new certifications pending review</Paragraph>
            <Paragraph color="$color10">• Quarterly training completion is at 92%</Paragraph>
          </YStack>
        </YStack>
      }
      rightContent={
        <YStack gap="$4">
          <YStack
            bg="$color1"
            p="$4"
            borderWidth={1}
            borderColor="$color6"
            gap="$2"
            style={{ borderRadius: 16 }}
          >
            <Text fontSize={16} fontWeight="600" color="$color11">
              Next steps
            </Text>
            <Paragraph color="$color10">Schedule quarterly review</Paragraph>
            <Paragraph color="$color10">Audit policy acknowledgements</Paragraph>
            <Paragraph color="$color10">Send reminder to new hires</Paragraph>
          </YStack>

          <YStack
            bg="$color1"
            p="$4"
            borderWidth={1}
            borderColor="$color6"
            gap="$2"
            style={{ borderRadius: 16 }}
          >
            <Text fontSize={16} fontWeight="600" color="$color11">
              Contact
            </Text>
            <Paragraph color="$color10">Jordan Carter</Paragraph>
            <Paragraph color="$color10">Director of Compliance</Paragraph>
            <Paragraph color="$color10">jordan.carter@example.com</Paragraph>
          </YStack>
        </YStack>
      }
    />
  )
}
