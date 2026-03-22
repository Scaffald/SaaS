import { Stack, Text, Row, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Lightbulb } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { View } from 'react-native'

const TIPS = [
  {
    title: 'Add a Profile Photo',
    body: 'Members with a profile picture receive up to 21x more profile views and 36x more messages.',
  },
  {
    title: 'First Impressions',
    body: 'Recruiters skim profiles in just 6 seconds. Having your basic details filled out ensures they notice you.',
  },
  {
    title: 'Verified Credentials',
    body: 'Displaying verified credentials increases your likelihood of gaining new employment by about 6 percentage points.',
  },
]

export function MobileGrowthTip() {
  const { isMobile } = useResponsive()
  const { theme } = useThemeContext()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % TIPS.length)
    }, 8000)
    return () => clearInterval(id)
  }, [])

  if (!isMobile) return null

  const tip = TIPS[index]
  if (!tip) return null

  return (
    <View
      style={{
        backgroundColor: colors.primary[50],
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.primary[100],
      }}
    >
      <Row gap={12} style={{ alignItems: 'flex-start' }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primary[500],
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Lightbulb size={18} color="#ffffff" />
        </View>
        <Stack gap={4} style={{ flex: 1 }}>
          <Text size="sm" weight="bold" style={{ color: colors.text[theme].primary }}>
            {tip.title}
          </Text>
          <Text
            size="xs"
            style={{ color: colors.text[theme].secondary, lineHeight: 18 }}
          >
            {tip.body}
          </Text>
        </Stack>
      </Row>
    </View>
  )
}
