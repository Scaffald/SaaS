/**
 * FieldError – standard field-level error display
 * Uses HelperText with type="error". Single pattern for form error feedback.
 *
 * @example
 * ```tsx
 * <Input error={!!errorMessage} errorMessage={errorMessage} />
 * <FieldError message={errorMessage} />
 * ```
 */

import { Fragment } from 'react'
import { HelperText } from '../HelperText'
import type { FieldErrorProps } from './FieldError.types'

export function FieldError({
  message,
  showIcon = true,
  style,
  textStyle,
}: FieldErrorProps) {
  if (!message) return <Fragment />

  return (
    <HelperText type="error" showIcon={showIcon} style={style} textStyle={textStyle}>
      {message}
    </HelperText>
  )
}
