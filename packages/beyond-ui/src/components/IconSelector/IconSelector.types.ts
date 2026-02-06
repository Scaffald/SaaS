export interface IconSelectorProps {
  /** Currently selected icon name (e.g. 'User', 'Home') */
  value: string
  /** Callback when user selects an icon */
  onChange: (iconName: string) => void
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Label above the trigger */
  label?: string
  /** Placeholder when no icon selected */
  placeholder?: string
  /** Optional list of icon names to show; defaults to built-in list */
  iconNames?: readonly string[]
}
