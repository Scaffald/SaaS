import { Row, Stack, Text } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Pressable } from 'react-native'

const profileTipCards = [
  {
    title: 'Add a Profile Photo',
    body: 'Members with a profile picture receive up to 21× more profile views and as many as 36× more messages. A simple upload could make the difference between getting passed over or getting noticed.',
  },
  {
    title: 'First Impressions',
    body: "Recruiters skim profiles and resumes quickly — often giving just 6 seconds in an initial scan. Having your basic details like name, email, and phone filled out ensures they don't miss something important about you in those crucial first moments.",
  },
  {
    title: 'Verified Credentials',
    body: "Sharing verified information builds credibility with employers. Professionals who display credentials publicly increased their likelihood of gaining new employment by about 6 percentage points compared to those who didn't.",
  },
  {
    title: 'Complete Assessments',
    body: 'Users who complete career assessments receive personalized job matches and career recommendations tailored to their skills and interests.',
  },
]

export function GrowthTipCard() {
  const [index, setIndex] = useState(0)
  const fadeAnim = useRef(new Animated.Value(1)).current

  const goToIndex = useCallback((newIndex: number) => {
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
  }, [fadeAnim])

  useEffect(() => {
    const id = setInterval(() => {
      goToIndex((index + 1) % profileTipCards.length)
    }, 8000)
    return () => clearInterval(id)
  }, [index, goToIndex])

  const card = profileTipCards[index]
  if (!card) return null

  return (
    <Stack
      padding={24}
      borderRadius={20}
      style={{
        backgroundColor: colors.primary[800],
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Background icon */}
      <Stack
        style={{
          position: 'absolute',
          top: -8,
          right: -8,
          opacity: 0.08,
        }}
      >
        <TrendingUp size={120} color="#fff" />
      </Stack>

      {/* Header */}
      <Row justify="space-between" align="center" marginBottom={16}>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '800',
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
          }}
        >
          Weekly Growth Tip
        </Text>
        <Row gap={4} align="center">
          <Pressable
            onPress={() => goToIndex((index - 1 + profileTipCards.length) % profileTipCards.length)}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.7, padding: 2 })}
          >
            <ChevronLeft size={18} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => goToIndex((index + 1) % profileTipCards.length)}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.7, padding: 2 })}
          >
            <ChevronRight size={18} color="#fff" />
          </Pressable>
        </Row>
      </Row>

      {/* Content */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <Stack gap={8}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#fff',
            }}
          >
            {card.title}
          </Text>
          <Text
            style={{
              fontSize: 13,
              lineHeight: 19,
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            {card.body}
          </Text>
        </Stack>
      </Animated.View>

      {/* Footer: dots + counter */}
      <Row justify="space-between" align="center" marginTop={24}>
        <Row gap={8}>
          {profileTipCards.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => goToIndex(i)}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </Row>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          {index + 1} / {profileTipCards.length}
        </Text>
      </Row>
    </Stack>
  )
}
