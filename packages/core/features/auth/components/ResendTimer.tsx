import { useEffect, useRef, useState } from 'react'
import { Button, Paragraph } from 'tamagui'
import { RefreshCcw } from '@tamagui/lucide-icons'

interface ResendTimerProps {
  onComplete: () => void
  onResendClick: () => void
}

export function ResendTimer({ onComplete, onResendClick }: ResendTimerProps) {
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [seconds, setSeconds] = useState(30)
  const startTimeRef = useRef<number>(null)
  const rafIdRef = useRef<number>(null)

  const handleResendClick = () => {
    setIsTimerActive(true)
    onResendClick()
  }

  useEffect(() => {
    if (!isTimerActive || seconds === 0) return

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const newSeconds = 30 - Math.floor(elapsed / 1000)

      if (newSeconds <= 0) {
        setSeconds(0)
        setIsTimerActive(false)
        onComplete()
        return
      }

      if (newSeconds !== seconds) {
        setSeconds(newSeconds)
      }

      rafIdRef.current = requestAnimationFrame(animate)
    }

    rafIdRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      startTimeRef.current = null
    }
  }, [isTimerActive, seconds === 0, onComplete])

  if (!isTimerActive) {
    return (
      <Button
        items="center"
        self="center"
        gap="$2"
        cursor="pointer"
        onPress={handleResendClick}
        chromeless
        width={200}
      >
        <RefreshCcw size={12} color="$blue10" />
        <Paragraph color="$blue10">Resend Code</Paragraph>
      </Button>
    )
  }

  return (
    <Button items="center" self="center" gap="$2" cursor="pointer" chromeless width={200}>
      <RefreshCcw size={12} color="$color10" />
      <Paragraph color="$color10" text="right" fontSize="$1">
        Resend in {seconds} {seconds > 1 ? 'seconds' : 'second'}
      </Paragraph>
    </Button>
  )
}
