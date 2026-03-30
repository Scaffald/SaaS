import { useTranslation } from '@scf/core/utils/useTranslation'
import { RefreshCcw } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Button } from '@scaffald/ui'
interface ResendTimerProps {
  onComplete: () => void
  onResendClick: () => void
  disabled?: boolean
}

export function ResendTimer({ onComplete, onResendClick, disabled = false }: ResendTimerProps) {
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [seconds, setSeconds] = useState(30)
  const { t } = useTranslation()

  const handleResendClick = () => {
    setIsTimerActive(true)
    onResendClick()
  }

  useEffect(() => {
    if (!isTimerActive) return

    setSeconds(30)
    const intervalId = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId)
          setIsTimerActive(false)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isTimerActive, onComplete])

  if (!isTimerActive) {
    return (
      <Button
        variant="text"
        onPress={handleResendClick}
        disabled={disabled}
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
