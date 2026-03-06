import {
  ProfileActivityWidget,
  TeamInvitationsWidget,
} from '@scf/core/features/dashboard/components'
import { NewsWidget } from '@scf/core/features/news'
import { DashboardWidget } from '@scaffald/ui'
import { Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useEffect, useState } from 'react'

const profileTipCards: Array<{
  title: string
  subtitle: string
  body: string
}> = [
  {
    title: 'Add a Profile Photo',
    subtitle: 'Did you know that profiles with a photo are dramatically more visible?',
    body:
      'Members with a profile picture receive up to 21× more profile views and as many as 36× more messages. A simple upload could make the difference between getting passed over or getting noticed.',
  },
  {
    title: 'First Impressions',
    subtitle: 'Make Every Second Count',
    body:
      'Recruiters skim profiles and resumes quickly — often giving just 6 seconds in an initial scan. Having your basic details like name, email, and phone filled out ensures they don\'t miss something important about you in those crucial first moments.',
  },
  {
    title: 'Verified Credentials',
    subtitle: 'Verified Details Build Trust',
    body:
      'Sharing verified information builds credibility with employers. In one large-scale study, discover who displayed credentials publicly increased their likelihood of gaining new employment by about 6 percentage points compared to those who didn\'t. Trust really does make a measurable difference.',
  },
]

export function DashboardIndexRight() {
  const [index, setIndex] = useState(0)
  const { theme } = useThemeContext()

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % profileTipCards.length)
    }, 8000)
    return () => clearInterval(id)
  }, [])

  const card = profileTipCards[index]

  return (
    <Stack gap={16}>
      <ProfileActivityWidget />
      <DashboardWidget gap={12} elevated>
        {card ? (
          <Stack gap={12}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.text[theme].primary,
              }}
            >
              {card.title}
            </Text>
            <Text
              style={{
                fontStyle: 'italic',
                lineHeight: 16,
                color: colors.text[theme].secondary,
              }}
            >
              {card.subtitle}
            </Text>
            <Text
              style={{
                lineHeight: 16,
                color: colors.text[theme].secondary,
              }}
            >
              {card.body}
            </Text>
          </Stack>
        ) : null}
      </DashboardWidget>
      <TeamInvitationsWidget />
      <NewsWidget industry="construction" maxItems={10} />
    </Stack>
  )
}
