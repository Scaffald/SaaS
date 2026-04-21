import { Button, DashboardWidget, Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Pressable, View } from 'react-native'
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
  const chevronColor = isEngagement ? '#fff' : colors.icon[theme].default
  const dotOn = isEngagement ? '#fff' : colors.primary[500]
  const dotOff = isEngagement ? 'rgba(255,255,255,0.3)' : colors.border[theme].default
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
          <Row gap={4} align="center">
            <Pressable
              onPress={() => goToIndex((safeIndex - 1 + cards.length) % cards.length)}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.4 : 0.7, padding: 2 })}
            >
              <ChevronLeft size={18} color={chevronColor} />
            </Pressable>
            <Pressable
              onPress={() => goToIndex((safeIndex + 1) % cards.length)}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.4 : 0.7, padding: 2 })}
            >
              <ChevronRight size={18} color={chevronColor} />
            </Pressable>
          </Row>
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
          <Row gap={6}>
            {cards.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => goToIndex(i)}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === safeIndex ? dotOn : dotOff,
                }}
              />
            ))}
          </Row>
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
