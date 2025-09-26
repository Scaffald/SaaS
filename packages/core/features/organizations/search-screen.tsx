import { Button, Card, Input, Paragraph, SizableText, XStack, YStack } from '@app/ui'
import { Building2, Filter, Search } from '@tamagui/lucide-icons'

const suggestedOrganizations = [
  {
    id: 'alpha',
    name: 'Alpha Ventures',
    description: 'Early-stage venture fund focused on developer tools.',
  },
  {
    id: 'northwind',
    name: 'Northwind Logistics',
    description: 'Global logistics partner for commerce businesses.',
  },
]

export const OrganizationsSearchScreen = () => {
  return (
    <YStack gap="$5" px="$4" py="$6" w="100%" $gtSm={{ maw: 760, als: 'center' }}>
      <YStack gap="$2">
        <SizableText size="$7" fow="700">
          Search organizations
        </SizableText>
        <Paragraph size="$3" color="$gray11">
          Look up organizations across the network or invite a new company to collaborate.
        </Paragraph>
      </YStack>

      <Card p="$4" gap="$3" br="$6" bw="$0.5" boc="$color4">
        <XStack gap="$3" ai="center" fw="wrap">
          <XStack
            ai="center"
            gap="$2"
            px="$3"
            py="$2"
            br="$6"
            bg="$color2"
            f={1}
            minWidth={220}
          >
            <Search size={18} color="$gray11" />
            <Input
              flex={1}
              size="$3"
              borderWidth={0}
              bg="transparent"
              placeholder="Search by name, domain, or keyword"
              autoFocus={false}
            />
          </XStack>

          <Button size="$3" icon={Filter} theme="alt1" $sm={{ w: '100%' }}>
            Filters
          </Button>
        </XStack>

        <Paragraph size="$2" color="$gray11">
          Advanced search with filtering will be available soon.
        </Paragraph>
      </Card>

      <YStack gap="$3">
        <SizableText size="$4" fow="600">
          Suggested organizations
        </SizableText>
        {suggestedOrganizations.map((organization) => (
          <Card key={organization.id} p="$4" gap="$3" br="$4" bw="$0.5" boc="$color3">
            <XStack ai="center" gap="$3">
              <Building2 size={18} color="$gray11" />
              <SizableText size="$4" fow="600">
                {organization.name}
              </SizableText>
            </XStack>
            <Paragraph size="$3" color="$gray11">
              {organization.description}
            </Paragraph>
          </Card>
        ))}
      </YStack>
    </YStack>
  )
}
