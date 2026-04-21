import {
  Button,
  CarouselArrows,
  CarouselDots,
  DashboardWidget,
  Row,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { TrendingUp } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, View } from 'react-native'
import { useGrowthCards } from '../completion/useGrowthCards'

export function GrowthCard() {
  const { theme } = useThemeContext()
  const router = useRouter()
  const { cards, isLoading } = useGrowthCards()
  const [index, setIndex] = useState(0)
  const fadeAnim = useRef(new Animated.Value(1)).current

  const goToIndex = useCallback(
    (newIndex: number) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIndex(newIndex)
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start()
      })
    },
    [fadeAnim]
  )

  useEffect(() => {
    if (cards.length <= 1) return
    const id = setInterval(() => {
      goToIndex((index + 1) % cards.length)
    }, 8000)
    return () => clearInterval(id)
  }, [index, cards.length, goToIndex])

  if (isLoading || cards.length === 0) return null

  const safeIndex = index % cards.length
  const card = cards[safeIndex]
  if (!card) return null

  const isEngagement = card.kind === 'engagement'
  const showArrows = cards.length > 1

  const handleCTA = () => {
    if (card.ctaRoute) router.push(card.ctaRoute)
  }

  const titleColor = isEngagement ? '#fff' : colors.text[theme].primary
  const bodyColor = isEngagement
    ? 'rgba(255,255,255,0.9)'
    : colors.text[theme].secondary
  const eyebrowColor = isEngagement
    ? 'rgba(255,255,255,0.75)'
    : colors.text[theme].tertiary
  const chevronColor = isEngagement ? '#fff' : undefined
  const dotOn = isEngagement ? '#fff' : undefined
  const dotOff = isEngagement ? 'rgba(255,255,255,0.3)' : undefined
  const counterColor = isEngagement
    ? 'rgba(255,255,255,0.6)'
    : colors.text[theme].tertiary

  const widgetStyle = isEngagement
    ? { backgroundColor: colors.success[600], borderColor: 'transparent', overflow: 'hidden' as const, position: 'relative' as const }
    : undefined

  return (
    <DashboardWidget style={widgetStyle}>
      {isEngagement ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            opacity: 0.08,
          }}
        >
          <TrendingUp size={120} color="#fff" />
        </View>
      ) : null}

      <Row justify="space-between" align="center">
        <Text
          style={{
            fontSize: 10,
            fontWeight: '800',
            color: eyebrowColor,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
          }}
        >
          {card.eyebrow}
        </Text>
        {showArrows ? (
          <CarouselArrows
            color={chevronColor}
            onPrev={() => goToIndex((safeIndex - 1 + cards.length) % cards.length)}
            onNext={() => goToIndex((safeIndex + 1) % cards.length)}
          />
        ) : null}
      </Row>

      <Animated.View style={{ opacity: fadeAnim }}>
        <Stack gap={8}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: titleColor,
            }}
          >
            {card.title}
          </Text>
          <Text
            style={{
              fontSize: 13,
              lineHeight: 20,
              color: bodyColor,
            }}
          >
            {card.body}
          </Text>
        </Stack>
      </Animated.View>

      <Button
        variant="filled"
        color="primary"
        fullWidth
        onPress={handleCTA}
      >
        {card.ctaLabel}
      </Button>

      {showArrows ? (
        <Row justify="space-between" align="center">
          <CarouselDots
            count={cards.length}
            activeIndex={safeIndex}
            onDotPress={goToIndex}
            activeColor={dotOn}
            inactiveColor={dotOff}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: counterColor,
            }}
          >
            {safeIndex + 1} / {cards.length}
          </Text>
        </Row>
      ) : null}
    </DashboardWidget>
  )
}
