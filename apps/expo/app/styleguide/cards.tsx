import { useState } from 'react'
import { ScrollView, YStack, Text, XStack, Button } from 'tamagui'
import { CardStack, DirectionSlide, StackedCards } from '@app/ui'

export default function CardsPage() {
  const [direction, setDirection] = useState<'left' | 'right' | 'top' | 'bottom'>('left')
  const [cardVariant, setCardVariant] = useState<'default' | 'custom' | 'minimal'>('default')

  // Sample cards for StackedCards demo
  const sampleCards = [
    {
      title: 'Premium Card',
      subtitle: '•••• •••• •••• 0001',
      cardholderName: 'Alice Johnson',
      expiryDate: '12/25',
    },
    {
      title: 'Business Card',
      subtitle: '•••• •••• •••• 0002',
      cardholderName: 'Bob Smith',
      expiryDate: '08/26',
    },
    {
      title: 'Travel Card',
      subtitle: '•••• •••• •••• 0003',
      cardholderName: 'Carol Davis',
      expiryDate: '03/27',
    },
    {
      title: 'Student Card',
      subtitle: '•••• •••• •••• 0004',
      cardholderName: 'David Wilson',
      expiryDate: '11/25',
    },
    {
      title: 'Gold Card',
      subtitle: '•••• •••• •••• 0005',
      cardholderName: 'Eva Brown',
      expiryDate: '06/26',
    },
  ]

  const renderCardVariant = () => {
    switch (cardVariant) {
      case 'custom':
        return (
          <CardStack
            key={`${direction}-custom`}
            direction={direction}
            title="Custom Card"
            subtitle="•••• •••• •••• 1234"
            cardholderName="John Doe"
            expiryDate="12/25"
            avatarSrc="/avatar_pro.png"
            width={280}
          >
            <Text fontSize="$2" color="$color10" textAlign="center">
              Custom content area
            </Text>
          </CardStack>
        )
      case 'minimal':
        return (
          <CardStack
            key={`${direction}-minimal`}
            direction={direction}
            title="Minimal Card"
            subtitle="Simple card"
            showInverseSection={false}
            width={250}
          />
        )
      default:
        return <CardStack key={`${direction}-default`} direction={direction} />
    }
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$6" alignItems="center">
        <Text fontSize="$8" fontWeight="600" color="$color">
          CardStack Component Demo
        </Text>

        <Text fontSize="$4" color="$color10" textAlign="center" maxWidth={300}>
          A reusable card component with slide animations from different directions
        </Text>

        {/* Card Variant Selector */}
        <XStack gap="$2" width="100%" maxWidth={400}>
          <Button
            flex={1}
            variant={cardVariant === 'default' ? 'outlined' : 'outline'}
            onPress={() => setCardVariant('default')}
            size="$3"
          >
            <Text fontSize="$2">Default</Text>
          </Button>
          <Button
            flex={1}
            variant={cardVariant === 'custom' ? 'outlined' : 'outline'}
            onPress={() => setCardVariant('custom')}
            size="$3"
          >
            <Text fontSize="$2">Custom</Text>
          </Button>
          <Button
            flex={1}
            variant={cardVariant === 'minimal' ? 'outlined' : 'outline'}
            onPress={() => setCardVariant('minimal')}
            size="$3"
          >
            <Text fontSize="$2">Minimal</Text>
          </Button>
        </XStack>

        {/* Card Display */}
        <YStack alignItems="center" gap="$4">
          {renderCardVariant()}

          {/* Direction Controls */}
          <YStack gap="$3" width="100%" maxWidth={400}>
            <Text fontSize="$4" fontWeight="500" color="$color" textAlign="center">
              Slide Direction
            </Text>
            <DirectionSlide direction={direction} setDirection={setDirection} />
          </YStack>
        </YStack>

        {/* StackedCards Demo */}
        <YStack gap="$4" width="100%" maxWidth={400} alignItems="center">
          <Text fontSize="$5" fontWeight="600" color="$color">
            Stacked Cards Carousel
          </Text>

          <Text fontSize="$3" color="$color10" textAlign="center">
            Auto-playing carousel with swipe-up animations
          </Text>

          <StackedCards
            cards={sampleCards}
            interval={2500}
            autoPlay={true}
            width={300}
            maxStackSize={3}
          />

          <Text fontSize="$2" color="$color9" textAlign="center" fontStyle="italic">
            Cards automatically cycle every 2.5 seconds
          </Text>
        </YStack>
      </YStack>
    </ScrollView>
  )
}
