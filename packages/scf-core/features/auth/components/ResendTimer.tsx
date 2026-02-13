import { useTranslation } from '@scf/core/utils/useTranslation'
import { RefreshCcw } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@scaffald/ui'
interface ResendTimerProps {
  onComplete: () => void
  onResendClick: () => void
}

export function ResendTimer({ onComplete, onResendClick }: ResendTimerProps) {
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [seconds, setSeconds] = useState(30)
  const startTimeRef = useRef<number | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const { t } = useTranslation()

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
  }, [isTimerActive, seconds, onComplete])

  if (!isTimerActive) {
    return (
      <Button
        variant="text"
        onPress={handleResendClick}
        style={{ alignSelf: 'center', width: 200 }}
        iconStart={RefreshCcw}
      >
        {t('auth.verify.resendButtonLabel')}
      </Button>
    )
  }

  return (
    <Button
      variant="text"
      disabled
      style={{ alignSelf: 'center', width: 200 }}
      iconStart={RefreshCcw}
    >
      {seconds === 1 ? t('auth.verify.resendInOne') : t('auth.verify.resendIn', { seconds })}
    </Button>
  )
}
