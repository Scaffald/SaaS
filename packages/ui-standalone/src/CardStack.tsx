import { type ComponentType, type ReactNode, useEffect, useState } from 'react'
import { Text, View, XStack } from 'tamagui'

// Platform-agnostic UUID generator
const randomUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

const axises = {
  left: {
    axis: 'x',
    value: -100,
  },
  right: {
    axis: 'x',
    value: 100,
  },
  top: {
    axis: 'y',
    value: -100,
  },
  bottom: { axis: 'y', value: 100 },
}

export interface CardStackProps {
  /** Direction for the slide animation */
  direction?: 'left' | 'right' | 'top' | 'bottom'
  /** Custom width for the card */
  width?: number | string
  /** Whether to disable the slide-in animation */
  disableSlideIn?: boolean
  /** Custom children content */
  children?: ReactNode
}

/**
 * CardStack component with slide animations
 *
 * A reusable card component that can slide in from different directions
 * with customizable content and styling. Perfect for credit card displays,
 * profile cards, or any card-based UI elements.
 *
 * @param props - CardStack component props
 * @returns JSX element
 */
export const CardStack = ({
  direction = 'left',
  width = 312,
  disableSlideIn = false,
  children,
}: CardStackProps) => {
  const axis = axises[direction]

  return (
    <View
      gap="$2"
      tag="article"
      role="banner"
      animation={{
        opacity: {
          type: 'bouncy',
          overshootClamping: true,
        },
      }}
      overflow="hidden"
      enterStyle={disableSlideIn ? { opacity: 1 } : { opacity: 0, [axis.axis]: axis.value }}
    >
      <View {...(typeof width === 'number' ? { width } : { flex: 1 })}>{children}</View>
    </View>
  )
}

/**
 * DirectionSlide component for controlling CardStack animation direction
 *
 * A toggle group component that allows users to select the slide direction
 * for the CardStack component.
 *
 * @param props - DirectionSlide component props
 * @returns JSX element
 */
export interface DirectionSlideProps {
  /** Current selected direction */
  direction: 'left' | 'right' | 'top' | 'bottom'
  /** Callback when direction changes */
  setDirection: (direction: 'left' | 'right' | 'top' | 'bottom') => void
}

export const DirectionSlide = ({ direction, setDirection }: DirectionSlideProps) => {
  const directions = ['left', 'right', 'top', 'bottom'] as const

  return (
    <View gap="$2">
      <XStack gap="$2" flex={1}>
        {directions.map((dir) => {
          const active = dir === direction
          return (
            <View
              key={dir}
              flex={1}
              bg={active ? '$color12' : '$color4'}
              cursor="pointer"
              pressStyle={{ opacity: 0.7 }}
              onPress={() => setDirection(dir)}
              items="center"
              justify="center"
            >
              <Text
                color={active ? '$color1' : '$color10'}
                fontWeight="600"
                textTransform="capitalize"
                fontSize="$2"
              >
                {dir}
              </Text>
            </View>
          )
        })}
      </XStack>
    </View>
  )
}

/**
 * StackedCards component with automatic swipe-up animation
 *
 * A carousel component that displays cards in a stack with automatic
 * swipe-up animations. Cards disappear upward and reveal the next card below.
 * Perfect for showcasing multiple cards in a compact space.
 *
 * @param props - StackedCards component props
 * @returns JSX element
 */
export interface StackedCardsProps {
  /** Array of card data to display */
  cards: CardStackProps[]
  /** Auto-play interval in milliseconds (default: 3000) */
  interval?: number
  /** Whether to auto-play the carousel */
  autoPlay?: boolean
  /** Custom width for the cards (default: '100%' for responsive) */
  width?: number | string
  /** Maximum number of cards to show in stack */
  maxStackSize?: number
  /** Component to wrap each card with */
  wrapperComponent?: ComponentType<{ children: ReactNode }>
}

export const StackedCards = ({
  cards,
  interval = 3000,
  autoPlay = true,
  width = '100%',
  maxStackSize = 3,
  wrapperComponent: WrapperComponent,
}: StackedCardsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!autoPlay || cards.length <= 1) return

    const timer = setInterval(() => {
      setIsAnimating(true)

      // Wait for animation to complete before changing index
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % cards.length)
        setIsAnimating(false)
      }, 600) // Animation duration
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, cards.length, interval])

  if (cards.length === 0) return null

  // Get visible cards (current + next ones in stack)
  const visibleCards: (CardStackProps & { index: number; isTop: boolean })[] = []
  for (let i = 0; i < Math.min(maxStackSize, cards.length); i++) {
    const cardIndex = (currentIndex + i) % cards.length
    visibleCards.push({
      ...cards[cardIndex],
      index: i,
      isTop: i === 0,
    })
  }

  return (
    <View
      position="relative"
      {...(typeof width === 'number' ? { width } : { flex: 1 })}
      height={200}
      mb="$8"
    >
      {visibleCards.map((card, stackIndex) => (
        <View
          key={randomUUID()}
          position="absolute"
          t={stackIndex * 8}
          l={stackIndex * 4}
          z={maxStackSize - stackIndex}
          opacity={stackIndex === 0 && isAnimating ? 0 : 1}
          transform={[
            {
              translateY: stackIndex === 0 && isAnimating ? -100 : 0,
            },
            {
              scale: 1 - stackIndex * 0.05,
            },
          ]}
          animation={{
            opacity: {
              type: 'bouncy',
              damping: 20,
              stiffness: 300,
            },
            transform: {
              type: 'bouncy',
              damping: 20,
              stiffness: 300,
            },
          }}
        >
          {WrapperComponent ? (
            <WrapperComponent>
              <CardStack
                {...card}
                width={typeof width === 'number' ? width - stackIndex * 8 : width}
                direction="top" // Always use top direction to avoid slide-in animation
                disableSlideIn={true} // Disable slide-in animation for stacked cards
              />
            </WrapperComponent>
          ) : (
            <CardStack
              {...card}
              width={typeof width === 'number' ? width - stackIndex * 8 : width}
              direction="top" // Always use top direction to avoid slide-in animation
              disableSlideIn={true} // Disable slide-in animation for stacked cards
            />
          )}
        </View>
      ))}
    </View>
  )
}
