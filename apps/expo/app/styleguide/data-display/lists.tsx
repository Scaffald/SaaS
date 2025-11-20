// @ts-nocheck

import { AnchorHeading, ExampleCard, StyleguidePage } from '@app/styleguide'
import { Paragraph, Text, XStack, YStack } from '@app/ui'

const items = [
  { id: 1, name: 'Morgan Diaz', role: 'Site Supervisor', status: 'Online' },
  { id: 2, name: 'Kai Patel', role: 'Compliance Analyst', status: 'Reviewing' },
  { id: 3, name: 'Reese Chen', role: 'People Ops', status: 'Out of office' },
]

export default function ListsPage() {
  return (
    <StyleguidePage
      title="Lists"
      description="Media and definition lists to mirror Bootstrap’s list group component."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="lists-media"
          title="Media list"
          description="Avatar plus text layout using XStack."
        />
        <ExampleCard
          title="Team list"
          description="Rounded cards with subtle borders."
          code={`<YStack gap="$3">
  {items.map((item) => (
    <XStack key={item.id} gap="$3" alignItems="center">
      <AvatarImagePicker size={48} />
      <YStack>
        <Text>{item.name}</Text>
        <Text>{item.role}</Text>
      </YStack>
    </XStack>
  ))}
</YStack>`}
        >
          <YStack gap="$3">
            {items.map((item) => (
              <XStack
                key={item.id}
                gap="$3"
                alignItems="center"
                borderWidth={1}
                borderColor="$color6"
                borderRadius="$4"
                padding="$3"
              >
                <YStack
                  width={48}
                  height={48}
                  borderRadius={999}
                  bg="$color4"
                  alignItems="center"
                  justify="center"
                >
                  <Text fontSize={18} fontWeight="600" color="$color11">
                    {item.name[0]}
                  </Text>
                </YStack>
                <YStack flex={1}>
                  <Text fontSize={14} fontWeight="600" color="$color11">
                    {item.name}
                  </Text>
                  <Paragraph fontSize={12} color="$color10">
                    {item.role}
                  </Paragraph>
                </YStack>
                <Text fontSize={12} color="$color9">
                  {item.status}
                </Text>
              </XStack>
            ))}
          </YStack>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}
