import { CompactNewsWidget } from '@scf/core/features/dashboard/components/CompactNewsWidget'
import { RecentActivityWidget } from '@scf/core/features/dashboard/components/RecentActivityWidget'
import { SuggestedContactsWidget } from '@scf/core/features/dashboard/components/SuggestedContactsWidget'
import { Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useEffect, useState } from 'react'

const growthTips = [
  'Profiles with verified skills get 5x more project invitations.',
  'Adding a profile photo increases your visibility by up to 21x.',
  'Completing assessments unlocks personalized career recommendations.',
]

export function DashboardIndexRight() {
  const [tipIndex, setTipIndex] = useState(0)
  const { theme } = useThemeContext()

  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % growthTips.length)
    }, 8000)
    return () => clearInterval(id)
  }, [])

  const tip = growthTips[tipIndex]

  return (
    <Stack gap={20}>
      <CompactNewsWidget />
      <RecentActivityWidget />
      <SuggestedContactsWidget />

      {/* Growth Tip — warm tinted card */}
      <Stack
        padding={20}
        borderRadius={20}
        gap={8}
        style={{
          backgroundColor:
            theme === 'light' ? colors.primary[50] : colors.primary[900],
          borderWidth: 1,
          borderColor:
            theme === 'light' ? colors.primary[200] : colors.primary[800],
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            color:
              theme === 'light' ? colors.primary[700] : colors.primary[300],
          }}
        >
          Growth Tip
        </Text>
        <Text
          style={{
            fontSize: 12,
            lineHeight: 18,
            color: colors.text[theme].primary,
          }}
        >
          {tip}
        </Text>
      </Stack>
    </Stack>
  )
}
