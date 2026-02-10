import { Award, Clock } from '@tamagui/lucide-icons'
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
    <Stack gap="$5">
      {xpAwarded > 0 && (
        <Stack
          gap="$3"
          padding="$4"
          backgroundColor="$green2"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$green7"
        >
          <Row gap="$3" alignItems="center">
            <Award size={24} color="$green10" />
            <Text fontSize="$5" fontWeight="600" color="$green11">
              +{xpAwarded} Frequency XP
            </Text>
          </Row>
          <Text fontSize="$3" color="$green10">
            You earned Frequency XP for completing this assessment.
          </Text>
        </Stack>
      )}

      <Stack
        gap="$4"
        padding="$6"
        backgroundColor="$blue2"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$blue7"
      >
        <Row gap="$3" alignItems="center">
          <Clock size={24} color="$blue10" />
          <Text fontSize="$5" fontWeight="600" color="$color12">
            Test Availability
          </Text>
        </Row>
        <Stack gap="$2">
          <Text fontSize="$4" color="$color11">
            This test can be taken once every 7 days.
          </Text>
          {nextAvailableAt && !timeUntilAvailable.isAvailable ? (
            <>
              <Text fontSize="$4" color="$color11" marginTop="$2">
                You can take the test again on:
              </Text>
              <Text fontSize="$4" fontWeight="600" color="$blue11">
                {formatDate(nextAvailableAt)}
              </Text>
              <Text fontSize="$3" color="$blue10" marginTop="$2">
                Available in {formatCountdown(timeUntilAvailable)}
              </Text>
            </>
          ) : (
            <Text fontSize="$4" fontWeight="600" color="$green11" marginTop="$2">
              The test is available now.
            </Text>
          )}
        </Stack>
      </Stack>
    </Stack>
  )
}
