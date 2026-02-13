import { Award, Clock } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Text, Row, Stack } from '@unicornlove/beyond-ui'

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

  return (
    <Stack gap={20}>
      {xpAwarded > 0 && (
        <Stack
          gap={12}
          padding={16}
          backgroundColor="$green2"
          borderRadius={16}
          borderWidth={1}
          borderColor="$green7"
        >
          <Row gap={12} align="center">
            <Award size={24} color="$green10" />
            <Text color="$green11">
              +{xpAwarded} Frequency XP
            </Text>
          </Row>
          <Text color="$green10">
            You earned Frequency XP for completing this assessment.
          </Text>
        </Stack>
      )}

      <Stack
        gap={16}
        padding={24}
        backgroundColor="$blue2"
        borderRadius={16}
        borderWidth={1}
        borderColor="$blue7"
      >
        <Row gap={12} align="center">
          <Clock size={24} color="$blue10" />
          <Text color="gray">
            Test Availability
          </Text>
        </Row>
        <Stack gap={8}>
          <Text color="gray">
            This test can be taken once every 7 days.
          </Text>
          {nextAvailableAt && !timeUntilAvailable.isAvailable ? (
            <>
              <Text color="gray" marginTop={8}>
                You can take the test again on:
              </Text>
              <Text color="$blue11">
                {formatDate(nextAvailableAt)}
              </Text>
              <Text color="$blue10" marginTop={8}>
                Available in {formatCountdown(timeUntilAvailable)}
              </Text>
            </>
          ) : (
            <Text color="$green11" marginTop={8}>
              The test is available now.
            </Text>
          )}
        </Stack>
      </Stack>
    </Stack>
  )
}
