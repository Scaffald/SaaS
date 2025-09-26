import { Card, Paragraph, SizableText, XStack, YStack } from '@app/ui'
import { Building2, Plus, Search } from '@tamagui/lucide-icons'
import { useLink } from 'solito/link'

const landingCards = [
  {
    id: 'search',
    title: 'Search the directory',
    description: 'Find organizations by name, industry, or region to start a new collaboration.',
    icon: Search,
    href: '/organizations/search',
  },
  {
    id: 'my-organizations',
    title: 'Review your memberships',
    description: 'See the organizations you belong to and manage invitations.',
    icon: Building2,
    href: '/organizations/my-organizations',
  },
  {
    id: 'create',
    title: 'Create a new organization',
    description: 'Set up a new company profile to invite teammates and partners.',
    icon: Plus,
    href: '/organizations/new',
  },
] as const

export const OrganizationsLandingScreen = () => {
  return (
    <YStack gap="$6" px="$4" py="$6" w="100%" $gtSm={{ maw: 760, als: 'center' }}>
      <YStack gap="$2">
        <SizableText size="$8" fow="700">
          Organizations
        </SizableText>
        <Paragraph size="$3" color="$gray11">
          Discover the organizations you work with, search the network, or create a new profile.
        </Paragraph>
      </YStack>

      <YStack gap="$3">
        {landingCards.map((card) => (
          <LandingCard key={card.id} {...card} />
        ))}
      </YStack>
    </YStack>
  )
}

type LandingCardProps = (typeof landingCards)[number]

const LandingCard = ({ href, title, description, icon: Icon }: LandingCardProps) => {
  const link = useLink({ href })

  return (
    <Card
      {...link}
      pressStyle={{ scale: 0.98 }}
      hoverStyle={{ bg: '$color2' }}
      focusStyle={{ outlineColor: '$color8', outlineWidth: 2 }}
      p="$4"
      br="$5"
      bw="$0.5"
      boc="$color3"
      gap="$3"
    >
      <XStack ai="center" gap="$3">
        <YStack theme="alt1" bg="$color3" p="$2" br="$4" o={0.7}>
          <Icon size={20} />
        </YStack>
        <SizableText size="$5" fow="600">
          {title}
        </SizableText>
      </XStack>
      <Paragraph size="$3" color="$gray11">
        {description}
      </Paragraph>
    </Card>
  )
}
