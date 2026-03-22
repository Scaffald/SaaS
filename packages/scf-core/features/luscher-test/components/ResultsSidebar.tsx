import { Award, Clock } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Card, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

export interface ResultsSidebarProps {
  xpAwarded?: number
  nextAvailableAt: string | null
}

type TimeUntilAvailable = {
  days: number
  hours: number
  minutes: number
  isAvailable: boolean
}

const calculateTimeUntilAvailable = (nextAvailableAt: string | null): TimeUntilAvailable => {
  if (!nextAvailableAt) {
    return { days: 0, hours: 0, minutes: 0, isAvailable: true }
  }

  const now = Date.now()
  const availableAt = new Date(nextAvailableAt).getTime()
  const diff = availableAt - now

  if (Number.isNaN(availableAt) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isAvailable: true }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { days, hours, minutes, isAvailable: false }
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

const formatCountdown = (time: TimeUntilAvailable): string => {
  if (time.isAvailable) {
    return 'Available now'
  }

  const parts: string[] = []

  if (time.days > 0) {
    parts.push(`${time.days} day${time.days > 1 ? 's' : ''}`)
  }
  if (time.hours > 0) {
    parts.push(`${time.hours} hour${time.hours > 1 ? 's' : ''}`)
  }
  if (time.minutes > 0 && parts.length < 2) {
    parts.push(`${time.minutes} minute${time.minutes > 1 ? 's' : ''}`)
  }

  return parts.length > 0 ? parts.join(', ') : 'Less than a minute'
}

export const ResultsSidebar = ({ xpAwarded = 5, nextAvailableAt }: ResultsSidebarProps) => {
  const { theme } = useThemeContext()
  const [timeUntilAvailable, setTimeUntilAvailable] = useState<TimeUntilAvailable>(() =>
    calculateTimeUntilAvailable(nextAvailableAt)
  )

  useEffect(() => {
    setTimeUntilAvailable(calculateTimeUntilAvailable(nextAvailableAt))

    if (!nextAvailableAt) {
      return
    }

    const interval = setInterval(() => {
      setTimeUntilAvailable(calculateTimeUntilAvailable(nextAvailableAt))
    }, 60_000)

    return () => clearInterval(interval)
  }, [nextAvailableAt])

  const xpIconBg =
    theme === 'dark' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)'

  return (
    <Stack gap={20}>
        {xpAwarded > 0 && (
          <Card variant="glass" padding="lg" radius="xl">
            <Stack gap={12}>
              <Row gap={12} align="center">
                <Stack
                  width={40}
                  height={40}
                  borderRadius={12}
                  align="center"
                  justify="center"
                  style={{ backgroundColor: xpIconBg }}
                >
                  <Award size={22} color={colors.success[500]} />
                </Stack>
                <Stack gap={2}>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: '700',
                      color: colors.success[500],
                    }}
                  >
                    +{xpAwarded}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.text[theme].secondary,
                    }}
                  >
                    Frequency XP earned
                  </Text>
                </Stack>
              </Row>
            </Stack>
          </Card>
        )}

        <Card variant="outlined" padding="lg" radius="xl">
          <Stack gap={12}>
            <Row gap={12} align="center">
              <Clock size={20} color={colors.primary[500]} />
              <Text
                style={{
                  fontWeight: '600',
                  color: colors.text[theme].primary,
                }}
              >
                Test Availability
              </Text>
            </Row>
            <Text
              style={{
                fontSize: 13,
                color: colors.text[theme].secondary,
                lineHeight: 20,
              }}
            >
              This test can be taken once every 7 days.
            </Text>
            {nextAvailableAt && !timeUntilAvailable.isAvailable ? (
              <Stack gap={4}>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.text[theme].tertiary,
                  }}
                >
                  Next available:
                </Text>
                <Text
                  style={{
                    fontWeight: '600',
                    color: colors.primary[500],
                  }}
                >
                  {formatDate(nextAvailableAt)}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.primary[400],
                  }}
                >
                  {formatCountdown(timeUntilAvailable)}
                </Text>
              </Stack>
            ) : (
              <Text
                style={{
                  fontWeight: '600',
                  color: colors.success[500],
                }}
              >
                Available now
              </Text>
            )}
          </Stack>
        </Card>
    </Stack>
  )
}
