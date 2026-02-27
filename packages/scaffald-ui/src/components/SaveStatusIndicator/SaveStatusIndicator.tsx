/**
 * SaveStatusIndicator – real-time save state with optional timestamp
 * Use for auto-save sections (e.g. forms, editors).
 */

import { useEffect, useState } from 'react'
import { Row } from '../Layout'
import { Stack } from '../Layout'
import { Spinner } from '../Spinner'
import { Caption, Text } from '../Typography'
import { CheckIcon, CancelIcon } from '../Icon'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { formatRelativeTime } from './formatRelativeTime'
import type { SaveStatusIndicatorProps } from './SaveStatusIndicator.types'

export function SaveStatusIndicator({
  status,
  lastSavedAt,
  error,
  autoHideDuration = 3000,
}: SaveStatusIndicatorProps) {
  const [showSavedState, setShowSavedState] = useState(false)
  const [relativeTime, setRelativeTime] = useState('')

  useEffect(() => {
    if (!lastSavedAt) {
      setRelativeTime('')
      return
    }
    const updateTime = () => setRelativeTime(formatRelativeTime(lastSavedAt))
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [lastSavedAt])

  useEffect(() => {
    if (status === 'saved') {
      setShowSavedState(true)
      const timer = setTimeout(() => setShowSavedState(false), autoHideDuration)
      return () => clearTimeout(timer)
    }
    setShowSavedState(false)
  }, [status, autoHideDuration])

  if (status === 'idle' && !lastSavedAt) return null

  return (
    <Stack gap={spacing[1]} align="flex-end">
      {status === 'saving' && (
        <Row gap={spacing[2]} align="center">
          <Spinner size="sm" color="primary" />
          <Caption color="tertiary">Saving...</Caption>
        </Row>
      )}

      {status === 'saved' && showSavedState && (
        <Row gap={spacing[2]} align="center">
          <CheckIcon size={16} color={colors.success[500]} />
          <Text size="sm" weight="semibold" color="success">
            Saved
          </Text>
        </Row>
      )}

      {status === 'error' && (
        <Row gap={spacing[2]} align="center">
          <CancelIcon size={16} color={colors.error[500]} />
          <Caption color="error">{error || 'Failed to save'}</Caption>
        </Row>
      )}

      {lastSavedAt && relativeTime && (
        <Caption color="tertiary">Last saved: {relativeTime}</Caption>
      )}
    </Stack>
  )
}
