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
export type {
  AppStoreButtonProps,
  AppStore,
  AppStoreButtonStyle,
} from './components/AppStoreButton'

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
export type {
  DropdownProps,
  DropdownPosition,
  DropdownItemType,
  DropdownItemState,
} from './components/Dropdown'

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
export type {
  CheckboxProps,
  CheckboxSize,
  CheckboxColor,
  CheckboxState,
} from './components/Checkbox'

export { CheckboxTree } from './components/Checkbox/CheckboxTree'
export type { CheckboxTreeProps, CheckboxTreeNode } from './components/Checkbox/CheckboxTree'

// Checkbox Tree utilities
export {
  updateNodeChecked,
  findNode,
  getAllNodeIds,
  getCheckedNodeIds,
  getLeafNodeIds,
} from './components/Checkbox/CheckboxTree.utils'

export { Radio } from './components/Radio'
export type { RadioProps, RadioSize, RadioColor, RadioState } from './components/Radio'

export { RadioGroup } from './components/Radio'
export type {
  RadioGroupProps,
  RadioGroupOption,
  RadioGroupOrientation,
} from './components/Radio'

export { Toggle } from './components/Toggle'
export type {
  ToggleProps,
  ToggleSize,
  ToggleColor,
  ToggleState,
} from './components/Toggle'

export { SelectionCard } from './components/SelectionCard'
export type {
  SelectionCardProps,
  SelectionCardType,
  SelectionCardLeadingType,
} from './components/SelectionCard'

export { Chip } from './components/Chip'
export type { ChipProps, ChipType, ChipSize } from './components/Chip'

export { Accordion } from './components/Accordion'
export type {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps,
  AccordionMode,
  AccordionWidth,
  AccordionValue,
} from './components/Accordion'

export { Avatar, AvatarGroup, AddAvatar } from './components/Avatar'
export type {
  AvatarProps,
  AvatarGroupProps,
  AddAvatarProps,
  AvatarSize,
  AvatarColor,
  AvatarType,
  AvatarStatus,
  AvatarBadge,
} from './components/Avatar'

export { Alert } from './components/Alert'
export type {
  AlertProps,
  AlertAction,
  AlertType,
  AlertVariant,
  AlertActionsPosition,
} from './components/Alert'

export { StatusIndicator } from './components/StatusIndicator'
export type {
  StatusIndicatorProps,
  StatusIndicatorType,
  StatusIndicatorStyle,
  StatusIndicatorIconType,
} from './components/StatusIndicator'

export { Pagination } from './components/Pagination'
export type {
  PaginationProps,
  PaginationType,
  PaginationPosition,
  PaginationRadius,
} from './components/Pagination'

export { Stepper, Step, Breadcrumb } from './components/Stepper'
export type {
  StepperProps,
  StepProps,
  StepData,
  StepStatus,
  StepperColor,
  BreadcrumbProps,
} from './components/Stepper'

export { ProgressBar, ProgressBarBase, ProgressIndicator, HintMessage } from './components/ProgressBar'
export type {
  ProgressBarProps,
  ProgressBarBaseProps,
  ProgressIndicatorProps,
  ProgressBarColor,
  ProgressBarOrientation,
  ProgressIndicatorIconType,
  HintMessageType,
  HintMessageProps,
} from './components/ProgressBar'

// Note: Additional components will be exported here as they are implemented
// Phase 1: Layout primitives (Box, Stack, Row, Flex)
// Phase 2: Core components (Input ✅, Checkbox ✅, Radio ✅, Toggle ✅) - Button ✅
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
export const PACKAGE_DESCRIPTION =
  'Custom UI component library - Next generation of @unicornlove/ui'
