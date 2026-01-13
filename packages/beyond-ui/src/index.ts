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

// Export hooks
export { useResponsive } from './hooks'
export type { ResponsiveValue, UseResponsiveReturn } from './hooks'

// Layout components
export { Box, Stack, Row, Spacer, Separator } from './components/Layout'
export type {
  BoxProps,
  StackProps,
  RowProps,
  SpacerProps,
  SeparatorProps,
  SeparatorOrientation,
  SeparatorThickness,
  SpacingValue,
  GapValue,
  PaddingValue,
  AlignItems,
  JustifyContent,
  FlexDirection,
  FlexWrap,
  Position,
} from './components/Layout'

// Typography components (replaces Tamagui H1-H6, Paragraph, SizableText)
export { Heading, H1, H2, H3, H4, H5, H6, Paragraph, Label, Text, Caption } from './components/Typography'
export type {
  HeadingProps,
  HeadingLevel,
  H1Props,
  H2Props,
  H3Props,
  H4Props,
  H5Props,
  H6Props,
  ParagraphProps,
  TextProps,
  CaptionProps,
  TextSize,
  TextWeight,
  TextColor,
  TextAlign,
  BaseTextProps,
} from './components/Typography'
// Note: LabelProps from Typography is exported as FormLabelProps to avoid conflict with shared LabelProps
export type { LabelProps as FormLabelProps } from './components/Typography'

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
export type { HelperTextType } from './components/HelperText'

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

// Crypto Wallet components
export { CryptoWalletLayout } from './components/CryptoWalletLayout'
export type {
  CryptoWalletLayoutProps,
  CryptoWalletLayoutVariant,
} from './components/CryptoWalletLayout'

export { CryptoAssetCard } from './components/CryptoAssetCard'
export type { CryptoAssetCardProps, ChangeType } from './components/CryptoAssetCard'

export { TradeControls } from './components/TradeControls'
export type { TradeControlsProps, TradeMode, TradeAsset } from './components/TradeControls'

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

// DatePicker components
export { DatePickerDay } from './components/DatePickerDay'
export type {
  DatePickerDayProps,
  DatePickerDayState,
} from './components/DatePickerDay'

export { DatePickerHeader } from './components/DatePickerHeader'
export type {
  DatePickerHeaderProps,
  DatePickerHeaderType,
  DatePickerHeaderPosition,
} from './components/DatePickerHeader'

export { DatePickerBase } from './components/DatePickerBase'
export type { DatePickerBaseProps } from './components/DatePickerBase'

export { DatePicker } from './components/DatePicker'
export type {
  DatePickerProps,
  DatePickerType,
  DatePickerSize,
  DatePickerPresetOption,
} from './components/DatePicker'

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

export {
  Modal,
  ModalHeader,
  ModalActions,
  ModalContent,
  ConfirmationModal,
  EcommerceShippingModal,
  EcommerceCartPreviewModal,
  WorkspaceMembersModal,
} from './components/Modal'
export type {
  ModalProps,
  ModalHeaderProps,
  ModalHeaderOrientation,
  ModalActionsProps,
  ModalAction,
  ModalActionsOrientation,
  ModalContentProps,
  ModalContentVariant,
  ConfirmationModalProps,
  EcommerceShippingModalProps,
  ShippingOption,
  EcommerceCartPreviewModalProps,
  CartItem,
  WorkspaceMembersModalProps,
  Member,
} from './components/Modal'

export { List } from './components/List'
export type { ListProps } from './components/List'

export { ListItem } from './components/ListItem'
export type {
  ListItemProps,
  ListItemVariant,
  UserProfile01Props,
  UserProfile02Props,
  ProductProps,
  SearchResult01Props,
  SearchResult02Props,
  SearchResult03Props,
  TaskProps,
  SongTitleProps,
  CloudFileProps,
  PhoneNumberProps,
  IntegrationProps,
} from './components/ListItem'

// Table shared types
export type {
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

// Widget components
export { LegendIndicator } from './components/Widgets/LegendIndicator'
export type { LegendIndicatorProps, LegendItem } from './components/Widgets/LegendIndicator'

export {
  LinearChart as LinearChartWidget,
  CircleChart as CircleChartWidget,
  DonutChart as DonutChartWidget,
  PieChart as PieChartWidget,
} from './components/Widgets/Charts'
export type {
  LinearChartWidgetProps,
  CircleChartWidgetProps,
  DonutChartWidgetProps,
  PieChartWidgetProps,
  WidgetChartDataPoint,
} from './components/Widgets/Charts'

export { MetricWidget } from './components/Widgets/Metrics'
export type { MetricWidgetProps, MetricWidgetType, MetricChangeType } from './components/Widgets/Metrics'

export {
  BalanceWidget,
  SpendingLimitWidget,
  CreditCardWidget,
  VirtualCardsWidget,
  TransactionsWidget,
  EarningsWidget,
  ContactsWidget,
  CurrencyConverterWidget,
  SubscriptionsWidget,
  LargeBalanceWidget,
} from './components/Widgets/Finance'
export type {
  BalanceWidgetProps,
  BalanceWidgetVariant,
  SpendingLimitWidgetProps,
  SpendingLimitWidgetVariant,
  CreditCardWidgetProps,
  CreditCardWidgetVariant,
  VirtualCardsWidgetProps,
  VirtualCard,
  TransactionsWidgetProps,
  Transaction,
  EarningsWidgetProps,
  EarningsDataItem,
  ContactsWidgetProps,
  Contact,
  CurrencyConverterWidgetProps,
  SubscriptionsWidgetProps,
  Subscription,
  LargeBalanceWidgetProps,
  LargeBalanceChartData,
} from './components/Widgets/Finance'

export {
  CryptoStockWidget,
  CryptoBalanceWidget,
  CryptoSinglePriceWidget,
  CryptoConverterWidget,
  MarketTrendingWidget,
  FearGreedIndexWidget,
} from './components/Widgets/Crypto'
export type {
  CryptoStockWidgetProps,
  CryptoStockWidgetVariant,
  CryptoBalanceWidgetProps,
  CryptoSinglePriceWidgetProps,
  CryptoConverterWidgetProps,
  MarketTrendingWidgetProps,
  FearGreedIndexWidgetProps,
} from './components/Widgets/Crypto'

// Command Menu components
export { CommandMenu } from './components/CommandMenu'
export type { CommandMenuProps, CommandMenuTab } from './components/CommandMenu'

export { CommandMenuItem } from './components/CommandMenu'
export type {
  CommandMenuItemProps,
  CommandMenuItemType,
  CommandMenuItemOrientation,
  CommandMenuItemState,
  CommandMenuItemData,
} from './components/CommandMenu'

export { CommandShortcut } from './components/CommandMenu'
export type { CommandShortcutProps, CommandShortcutVariant } from './components/CommandMenu'

export { CommandMenuFooter } from './components/CommandMenu'
export type { CommandMenuFooterProps, ShortcutHint } from './components/CommandMenu'

// Note: Additional components will be exported here as they are implemented
// Phase 1: Layout primitives (Box ✅, Stack ✅, Row ✅, Spacer ✅, Separator ✅)
// Phase 2: Core components (Input ✅, Checkbox ✅, Radio ✅, Toggle ✅) - Button ✅
// Phase 3: Feedback components (Alert ✅, Toast)
// Phase 4+: Complex components (Dialog, Popover, Select, Tooltip ✅, etc.)

// Theme Provider (temporary location in playground - will be moved to proper location)
export { ThemeProvider, ThemeContext, useThemeContext } from './playground/ThemeProvider'
export type { ThemeContextValue } from './playground/ThemeProvider'

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
