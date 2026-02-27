/**
 * TextArea component
 * Multiline text input for longer content
 */

import { forwardRef } from 'react'
import type { TextInput as TextInputType } from 'react-native'
import type { InputProps } from './Input.types'
import { Input } from './Input'

export interface TextAreaProps extends Omit<InputProps, 'multiline'> {
  /** Number of visible rows */
  rows?: number
}

export const TextArea = forwardRef<TextInputType, TextAreaProps>(function TextArea(
  { rows = 4, ...props },
  ref
) {
  return (
    <Input
      ref={ref}
      multiline
      numberOfLines={rows}
      {...props}
    />
  )
})
