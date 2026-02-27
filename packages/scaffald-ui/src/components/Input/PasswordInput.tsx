/**
 * PasswordInput - Convenience component for password fields
 * Composes Input with lock icon, eye/eye-off visibility toggle, and secureTextEntry
 */

import { useState, forwardRef } from 'react'
import type { TextInput as TextInputType } from 'react-native'
import { Lock, Eye, EyeOff } from 'lucide-react-native'
import { Input } from './Input'
import type { InputProps } from './Input.types'

export interface PasswordInputProps
  extends Omit<
    InputProps,
    'secureTextEntry' | 'iconStart' | 'iconEnd' | 'iconEndOnPress' | 'iconEndAccessibilityLabel'
  > {
  /** Custom label for the visibility toggle (default: "Show password" / "Hide password") */
  showPasswordLabel?: string
  hidePasswordLabel?: string
}

/**
 * Password input with lock icon and visibility toggle
 *
 * @example
 * <PasswordInput
 *   label="Password"
 *   placeholder="Enter your password"
 *   value={password}
 *   onChangeText={setPassword}
 * />
 */
export const PasswordInput = forwardRef<TextInputType, PasswordInputProps>(function PasswordInput(
  { showPasswordLabel = 'Show password', hidePasswordLabel = 'Hide password', ...props },
  ref
) {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      ref={ref}
      {...props}
      secureTextEntry={!visible}
      iconStart={Lock}
      iconEnd={visible ? EyeOff : Eye}
      iconEndOnPress={() => setVisible((v) => !v)}
      iconEndAccessibilityLabel={visible ? hidePasswordLabel : showPasswordLabel}
    />
  )
})

PasswordInput.displayName = 'PasswordInput'
