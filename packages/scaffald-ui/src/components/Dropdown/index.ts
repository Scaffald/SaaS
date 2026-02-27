/**
 * Dropdown component exports
 *
 * Provides both complete Dropdown component and composable sub-components
 * for maximum flexibility matching Figma design system guidelines
 */

// Main Dropdown component
export { Dropdown } from './Dropdown'
export { useDropdown } from './useDropdown'
export type { UseDropdownProps } from './useDropdown'
export type {
  DropdownProps,
  DropdownPosition,
} from './Dropdown.types'

// Composable sub-components
export { DropdownMenu } from './DropdownMenu'
export type { DropdownMenuProps } from './Dropdown.types'

export { DropdownSection } from './DropdownSection'
export type { DropdownSectionProps } from './Dropdown.types'

export { DropdownItem } from './DropdownItem'
export type {
  DropdownItemProps,
  DropdownItemType,
  DropdownItemState,
} from './Dropdown.types'
