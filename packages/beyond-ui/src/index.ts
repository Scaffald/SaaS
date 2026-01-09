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

// Export shared types and conventions
export type {
  ComponentSize,
  ExtendedSize,
  ColorVariant,
  SemanticType,
  InteractiveState,
  StyleVariant,
  IconComponent,
  LabelProps,
  HelperTextProps,
  ThemeMode,
} from './components/types'

// Export icon utilities
export { getIconSize, getIconColor, getIconSizeForComponent } from './utils/icon'
export type { IconSize } from './utils/icon'

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
  InputLabelType,
  InputHelperTextProps,
  InputHelperTextType,
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

export { Stepper, Step } from './components/Stepper'
export { Breadcrumb as BreadcrumbDeprecated } from './components/Stepper'
export type {
  StepperProps,
  StepProps,
  StepData,
  StepStatus,
  StepperColor,
} from './components/Stepper'
export type { BreadcrumbProps as BreadcrumbDeprecatedProps } from './components/Stepper'

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

// Shared components
export { HelperText } from './components/HelperText'
export type { HelperTextProps, HelperTextType } from './components/HelperText'

export { Icon, InfoIcon, CheckIcon, CancelIcon } from './components/Icon'
export type {
  IconProps,
  InfoIconProps,
  CheckIconProps,
  CancelIconProps,
} from './components/Icon'

export { PasswordStrength } from './components/PasswordStrength'
export type {
  PasswordStrengthProps,
  PasswordStrengthLevel,
  PasswordStrengthVariant,
  PasswordRequirement,
} from './components/PasswordStrength'

export { Spinner } from './components/Spinner'
export type { SpinnerProps, SpinnerSize, SpinnerColor } from './components/Spinner'

export { Slider } from './components/Slider'
export type {
  SliderProps,
  SliderColor,
  SliderIndicatorPosition,
  SliderHandleState,
} from './components/Slider'

export { FileUpload } from './components/FileUpload'
export type {
  FileUploadProps,
  FileUploadDropZoneProps,
  FileUploadListProps,
  FileUploadItemProps,
  FileUploadProgressProps,
  UploadedFile,
  FileUploadStatus,
  FileUploadVariant,
} from './components/FileUpload'

// FileUpload composable sub-components
export {
  FileUploadDropZone,
  FileUploadList,
  FileUploadItem,
  FileUploadProgress,
} from './components/FileUpload'

// FileUpload utility functions
export {
  validateFile,
  formatFileSize,
  getFileIcon,
  generateFileId,
  fileToUploadedFile,
} from './components/FileUpload'

export { Breadcrumb } from './components/Breadcrumb'
export type {
  BreadcrumbProps,
  BreadcrumbItemData,
  BreadcrumbItemProps,
  BreadcrumbSeparatorProps,
  BreadcrumbItemState,
} from './components/Breadcrumb'

// Breadcrumb composable sub-components
export {
  BreadcrumbItem,
  BreadcrumbSeparator,
} from './components/Breadcrumb'

export { Tabs } from './components/Tabs'
export type {
  TabsProps,
  TabItemProps,
  TabTriggerProps,
  TabContentProps,
  TabType,
  TabColor,
  TabSize,
  TabOrientation,
  TabState,
  TabContentVariant,
} from './components/Tabs'

export { Tooltip } from './components/Tooltip'
export type {
  TooltipProps,
  TooltipArrowPosition,
  TooltipAction,
  TooltipType,
  TooltipColor,
  TooltipContentProps,
  TooltipArrowProps,
  TriggerLayout,
  TooltipStyleConfig,
} from './components/Tooltip'

export { Sidebar, useSidebarContext } from './components/Sidebar'
export {
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarWidget,
  SidebarItemGroup,
} from './components/Sidebar'
export type {
  SidebarProps,
  SidebarVariant,
  SidebarMenuItemProps,
  SidebarItemType,
  SidebarItemState,
  SidebarHeaderProps,
  SidebarFooterProps,
  SidebarWidgetProps,
  SidebarWidgetType,
  SidebarItemGroupProps,
} from './components/Sidebar'

// Navigation components
export { NavIconButton } from './components/NavIconButton'
export type {
  NavIconButtonProps,
  NavIconButtonBadge,
  NavIconButtonState,
  NavIconButtonVariant,
} from './components/NavIconButton'

export { NotificationListItem } from './components/NotificationListItem'
export type {
  NotificationListItemProps,
  NotificationListItemVariant,
  NotificationState,
  NotificationAction,
  NotificationLink,
  NotificationFile,
} from './components/NotificationListItem'

export { SaaSSectionHeader } from './components/SaaSSectionHeader'
export type {
  SaaSSectionHeaderProps,
  SaaSSectionHeaderVariant,
  SectionHeaderAction,
  TimePeriodOption,
} from './components/SaaSSectionHeader'

export { SaaSNavigation } from './components/SaaSNavigation'
export type {
  SaaSNavigationProps,
  SaaSNavigationVariant,
  NavigationAction,
  NavigationAvatar,
} from './components/SaaSNavigation'

export { Table, TableCell, TableColumnHeader, ExpandedTableRow } from './components/Table'
export type {
  TableProps,
  TableColumn,
  TableRowData,
  TableHeaderAction,
  TableSortConfig,
  TableSelectionConfig,
  TableExpansionConfig,
  TableCellProps,
  TableCellType,
  TableCellState,
  TableCellAlign,
  TableColumnHeaderProps,
  SortDirection,
  TableColumnHeaderState,
  TableColumnHeaderAlign,
  ExpandedTableRowProps,
  ExpandedTableRowVariant,
} from './components/Table'
export type { TableHeaderProps } from './components/Table'

export { TableColumnHeader } from './components/Table'
export type { TableColumnHeaderProps } from './components/Table'

export { TableRow } from './components/Table'
export type { TableRowProps } from './components/Table'

export { TableCell } from './components/Table'
export type { TableCellProps } from './components/Table'

export { ExpandedTableRow } from './components/Table'
export type { ExpandedTableRowProps } from './components/Table'

// Table shared types
export type {
  TableSortDirection,
  TableAlign,
  TableStyleConfig,
} from './components/Table'

export { BarChart } from './components/Chart'
export type { BarChartProps } from './components/Chart'

export { BarChartBase } from './components/Chart'
export type { BarChartBaseProps } from './components/Chart'

export { LinearChart } from './components/Chart'
export type { LinearChartProps } from './components/Chart'

export { DonutChart } from './components/Chart'
export type { DonutChartProps } from './components/Chart'

export { CircleChart } from './components/Chart'
export type { CircleChartProps } from './components/Chart'

export { HalfPieChart } from './components/Chart'
export type { HalfPieChartProps } from './components/Chart'

export { MiniLinearChart } from './components/Chart'
export type { MiniLinearChartProps } from './components/Chart'

export { SmallCircleChart } from './components/Chart'
export type { SmallCircleChartProps } from './components/Chart'

export { Chart } from './components/Chart'
export type { ChartProps } from './components/Chart'

// Chart shared types
export type {
  ChartDataPoint,
  ChartSeries,
  DonutChartData,
  ChartPeriod,
  ChartSize,
  CircleChartSize,
  HalfPieChartSize,
  ChartColorScheme,
  ChartStyleConfig,
} from './components/Chart'

// Note: Additional components will be exported here as they are implemented
// Phase 1: Layout primitives (Box, Stack, Row, Flex)
// Phase 2: Core components (Input ✅, Checkbox ✅, Radio ✅, Toggle ✅) - Button ✅
// Phase 3: Feedback components (Alert ✅, Toast)
// Phase 4+: Complex components (Dialog, Popover, Select, Tooltip ✅, etc.)

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
