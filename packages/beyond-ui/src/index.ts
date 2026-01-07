/**
 * @unicornlove/beyond-ui
 *
 * Next-generation custom UI component library
 * Built with inline styles for React Native and web
 *
 * @example
 * ```typescript
 * import { Button, TextInput } from '@unicornlove/beyond-ui'
 * import { colors, spacing } from '@unicornlove/beyond-ui/tokens'
 * ```
 */

// Export all tokens
export * from './tokens'

// Components
export { Button } from './components/Button'
export type { ButtonProps, ButtonColor, ButtonVariant, ButtonSize } from './components/Button'

export { SocialButton } from './components/SocialButton'
export type { SocialButtonProps, SocialBrand, SocialButtonStyle } from './components/SocialButton'

export { AppStoreButton } from './components/AppStoreButton'
export type { AppStoreButtonProps, AppStore, AppStoreButtonStyle } from './components/AppStoreButton'

export { ButtonGroup } from './components/ButtonGroup'
export type {
  ButtonGroupProps,
  ButtonGroupItem,
  ButtonGroupMode,
  ButtonGroupSize,
  ButtonGroupOrientation,
} from './components/ButtonGroup'

export { Input } from './components/Input'
export type { InputProps, InputState, InputType } from './components/Input'

// Input composable sub-components
export {
  InputLabel,
  InputHelperText,
  InputExternalAddon,
  InputLeftSide,
  InputRightSide,
} from './components/Input'
export type {
  InputLabelProps,
  InputHelperTextProps,
  InputExternalAddonProps,
  InputLeftSideProps,
  InputRightSideProps,
} from './components/Input'

export { Dropdown } from './components/Dropdown'
export type { DropdownProps, DropdownPosition } from './components/Dropdown'

// Dropdown composable sub-components
export {
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from './components/Dropdown'
export type {
  DropdownMenuProps,
  DropdownSectionProps,
  DropdownItemProps,
} from './components/Dropdown'

export { Checkbox } from './components/Checkbox'
export type { CheckboxProps, CheckboxSize, CheckboxColor, CheckboxState } from './components/Checkbox'

// Note: Additional components will be exported here as they are implemented
// Phase 1: Layout primitives (Box, Stack, Row, Flex)
// Phase 2: Core components (Input ✅, Checkbox ✅, Radio, Switch) - Button ✅
// Phase 3: Feedback components (Alert, Toast)
// Phase 4+: Complex components (Dialog, Popover, Select, etc.)

/**
 * Package version
 */
export const VERSION = '0.1.0'

/**
 * Package metadata
 */
export const PACKAGE_NAME = '@unicornlove/beyond-ui'
export const PACKAGE_DESCRIPTION = 'Custom UI component library - Next generation of @unicornlove/ui'
