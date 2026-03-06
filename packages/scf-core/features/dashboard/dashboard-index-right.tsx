import {
  ProfileActivityWidget,
  TeamInvitationsWidget,
} from '@scf/core/features/dashboard/components'
import { NewsWidget } from '@scf/core/features/news'
import { DashboardWidget } from '@scaffald/ui'
import { H4, Text, Stack } from '@scaffald/ui'
import { useEffect, useState } from 'react'

const profileTipCards = [
  {
    children: (
      <Stack gap={12}>
        <H4 color="$color">Add a Profile Photo</H4>
        <Text color="$gray11" style={{ fontStyle: 'italic', lineHeight: 16 }}>
          Did you know that profiles with a photo are dramatically more visible?
        </Text>
        <Text color="$gray11" style={{ lineHeight: 16 }}>
          Members with a profile picture receive up to 21× more profile views and as many as 36×
          more messages. A simple upload could make the difference between getting passed over or
          getting noticed.
        </Text>
      </Stack>
    ),
  },
  {
    children: (
      <Stack gap={12}>
        <H4 color="$color">First Impressions</H4>
        <Text color="$gray11" style={{ fontStyle: 'italic', lineHeight: 16 }}>
          Make Every Second Count
        </Text>
        <Text color="$gray11" style={{ lineHeight: 16 }}>
          Recruiters skim profiles and resumes quickly — often giving just 6 seconds in an initial
          scan. Having your basic details like name, email, and phone filled out ensures they don't
          miss something important about you in those crucial first moments.
        </Text>
      </Stack>
    ),
  },
  {
    children: (
      <Stack gap={12}>
        <H4 color="$color">Verified Credentials</H4>
        <Text color="$gray11" style={{ fontStyle: 'italic', lineHeight: 16 }}>
          Verified Details Build Trust
        </Text>
        <Text color="$gray11" style={{ lineHeight: 16 }}>
          Sharing verified information builds credibility with employers. In one large-scale study,
          discover who displayed credentials publicly increased their likelihood of gaining new
          employment by about 6 percentage points compared to those who didn't. Trust really does
          make a measurable difference.
        </Text>
      </Stack>
    ),
  },
]

export function DashboardIndexRight() {
  const [index, setIndex] = useState(0)

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
        {card?.children}
      </DashboardWidget>
      <TeamInvitationsWidget />
      <NewsWidget industry="construction" maxItems={10} />
    </Stack>
  )
}
