/**
 * SettingsFormField component
 * Wrapper around Input component for settings pages
 *
 * @example
 * ```tsx
 * import { SettingsFormField } from '@scaffald/ui'
 *
 * <SettingsFormField
 *   label="Workspace Name"
 *   placeholder="Enter workspace name"
 *   value={workspaceName}
 *   onChangeText={setWorkspaceName}
 * />
 * ```
 */

import { Input } from '../Input'
import type { SettingsFormFieldProps } from './SettingsFormField.types'

export function SettingsFormField(props: SettingsFormFieldProps) {
  return <Input {...props} />
}
