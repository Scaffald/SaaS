/**
 * @scaffald/ui
 *
 * Next-generation custom UI component library
 * Built with inline styles for React Native and web
 *
 * @example
 * ```typescript
 * import { Button, TextInput } from '@scaffald/ui'
 * import { colors, spacing } from '@scaffald/ui/tokens'
 * ```
 */

// Export all tokens
export * from "./tokens";

// Export shared types and conventions
export type {
  ColorVariant,
  ComponentSize,
  ExtendedSize,
  HelperTextProps,
  IconComponent,
  InteractiveState,
  LabelProps,
  SemanticType,
  StyleVariant,
  ThemeMode,
} from "./components/types";

// Export icon utilities
export {
  getIconColor,
  getIconSize,
  getIconSizeForComponent,
} from "./utils/icon";
export type { IconSize } from "./utils/icon";

// Export error handling utilities
export { deprecated, invariant, warning } from "./utils/invariant";

// Export hooks
export { useResponsive, useSidebarState, useWindowDimensions } from "./hooks";
export type {
  ResponsiveValue,
  UseResponsiveReturn,
  UseSidebarStateOptions,
} from "./hooks";

// Export animation utilities
export {
  AnimatedPressable,
  // Core animated components
  AnimatedView,
  animationPresets,
  bezierCurves,
  // Transition components
  FadeTransition,
  isAnimatedPressAvailable,
  isReanimatedAvailable,
  ScaleTransition,
  SlideTransition,
  // Animation presets and configs
  springConfigs,
  timingConfigs,
  useAnimatedSpring,
  useAnimatedTiming,
  // Animation hooks
  useReducedMotion,
} from "./animation";
export type {
  AnimatedPressableProps,
  AnimatedViewProps,
  BezierCurveKey,
  EasingType,
  FadeTransitionProps,
  ScaleTransitionProps,
  SlideAnimationType,
  SlideDirection,
  SlideTransitionProps,
  SpringConfigKey,
  TimingConfigKey,
  UseAnimatedSpringOptions,
  UseAnimatedSpringReturn,
  UseAnimatedTimingOptions,
  UseAnimatedTimingReturn,
} from "./animation";

// Re-export ScrollView from react-native for convenience (RN-compatible)
export { ScrollView } from "react-native";

// Export platform utilities
export {
  isFocusVisibleActive,
  // Core platform utilities
  Platform,
  // Native-specific hooks
  useAccessibilityInfo,
  // Web-specific hooks
  useFocusVisible,
  // Haptic feedback
  useHaptics,
  useHoverState,
  // Platform detection hook
  usePlatform,
} from "./platform";
export type {
  FocusVisibleProps,
  HapticImpactStyle,
  HapticNotificationType,
  HoverProps,
  PlatformOS,
  PlatformSelectOptions,
  UseAccessibilityInfoReturn,
  UseFocusVisibleReturn,
  UseHapticsReturn,
  UseHoverStateOptions,
  UseHoverStateReturn,
  UsePlatformReturn,
} from "./platform";

// Export accessibility utilities
export {
  AnnouncerProvider,
  FocusGuard,
  getFocusRingStyles,
  LiveRegion,
  SkipLink,
  // Announcements
  useAnnouncer,
  useFocusRing,
  // Focus management
  useFocusTrap,
  // ID generation
  useId,
  useIds,
  useRovingTabIndex,
  // Components
  VisuallyHidden,
} from "./accessibility";
export type {
  AccessibilityProps,
  AccessibilityRole,
  AccessibilityState,
  Announcement,
  AnnouncerContextValue,
  AnnouncerProviderProps,
  AriaAtomic,
  // Types
  AriaLive,
  AriaRelevant,
  FocusableElement,
  FocusGuardProps,
  FocusProps as A11yFocusProps,
  FocusRingSize,
  FocusRingVariant,
  FocusTrapConfig,
  LiveRegionProps,
  NavigationKey,
  RovingItemProps,
  RovingTabIndexConfig,
  SkipLinkProps,
  UseFocusRingOptions,
  UseFocusRingReturn,
  // Hook returns
  UseFocusTrapReturn,
  UseRovingTabIndexOptions,
  UseRovingTabIndexReturn,
  // Component props
  VisuallyHiddenProps,
} from "./accessibility";

// Layout components
export { Box, Row, Separator, Spacer, Stack } from "./components/Layout";
export type {
  AlignItems,
  BoxProps,
  FlexDirection,
  FlexWrap,
  GapValue,
  JustifyContent,
  PaddingValue,
  Position,
  RowProps,
  SeparatorOrientation,
  SeparatorProps,
  SeparatorThickness,
  SpacerProps,
  SpacingValue,
  StackProps,
} from "./components/Layout";

// Grid component
export { Grid, GridItem } from "./components/Grid";
export type {
  GridAutoFlow,
  GridItemProps,
  GridProps,
  GridTemplateColumns,
  GridTemplateRows,
} from "./components/Grid";

// Responsive utility components
export { Hide, Responsive, Show } from "./components/Responsive";
export type {
  HideProps,
  ResponsiveProps,
  ShowProps,
} from "./components/Responsive";

// Typography components
export {
  Caption,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Heading,
  Label,
  Paragraph,
  Text,
} from "./components/Typography";
export type {
  BaseTextProps,
  CaptionProps,
  H1Props,
  H2Props,
  H3Props,
  H4Props,
  H5Props,
  H6Props,
  HeadingLevel,
  HeadingProps,
  ParagraphProps,
  TextAlign,
  TextColor,
  TextProps,
  TextSize,
  TextWeight,
} from "./components/Typography";
// Note: LabelProps from Typography is exported as FormLabelProps to avoid conflict with shared LabelProps
export type { LabelProps as FormLabelProps } from "./components/Typography";

// Card components
export {
  Card,
  CardActions,
  CardBadges,
  CardContent,
  CardFooter,
  CardHeader,
  CardMedia,
  CardMetadata,
  SelectableCard,
} from "./components/Card";
export type {
  BadgeConfig,
  CardAction,
  CardActionsProps,
  CardBadgesProps,
  CardContentProps,
  CardElevation,
  CardFooterProps,
  CardHeaderProps,
  CardMediaProps,
  CardMetadataProps,
  CardPadding,
  CardProps,
  CardRadius,
  CardVariant,
  MetadataItem,
  SelectableCardProps,
} from "./components/Card";

// Toast components
export {
  Toast,
  ToastContainer,
  ToastContext,
  ToastProvider,
  useToast,
} from "./components/Toast";
export type {
  ShowToastOptions,
  ToastAction,
  ToastContainerProps,
  ToastContextValue,
  ToastData,
  ToastPosition,
  ToastProps,
  ToastProviderProps,
  ToastVariant,
} from "./components/Toast";

// Skeleton components
export {
  Skeleton,
  SkeletonAvatar,
  SkeletonBox,
  SkeletonCard,
  SkeletonForm,
  SkeletonGroup,
  SkeletonList,
  SkeletonText,
} from "./components/Skeleton";
export type {
  SkeletonAnimation,
  SkeletonAvatarProps,
  SkeletonBoxProps,
  SkeletonCardProps,
  SkeletonFormProps,
  SkeletonGroupProps,
  SkeletonListProps,
  SkeletonProps,
  SkeletonShape,
  SkeletonTextProps,
} from "./components/Skeleton";

export { EmptyState, ErrorState, LoadingState } from "./components/States";
export type {
  EmptyStateProps,
  ErrorStateProps,
  LoadingStateProps,
} from "./components/States";

export {
  Checklist,
  ChecklistHeader,
  ChecklistItem,
  ChecklistList,
  ChecklistProgress,
} from "./components/Checklist";
export type {
  ChecklistHeaderProps,
  ChecklistItemData,
  ChecklistItemProps,
  ChecklistListProps,
  ChecklistProgressProps,
  ChecklistProps,
} from "./components/Checklist";

export {
  COOKIE_CONSENT_DEFAULTS,
  CookieConsentBanner,
  CookieConsentProvider,
  CookiePreferencesDialog,
  useCookieConsent,
} from "./components/CookieConsent";
export type {
  CookieConsentBannerProps,
  CookieConsentCategory,
  CookieConsentCategoryId,
  CookieConsentProviderProps,
  CookieConsentSelections,
  CookieConsentState,
  CookieConsentStorage,
} from "./components/CookieConsent";

export {
  AvatarCropModal,
  AvatarImagePicker,
  useFilePicker,
} from "./components/ImagePicker";
export type {
  AvatarCropModalProps,
  AvatarImagePickerProps,
  OnPickImage,
  UseFilePickerImageProps,
  UseFilePickerImageResult,
} from "./components/ImagePicker";

export { KanbanBoard, KanbanCard, KanbanColumn } from "./components/Kanban";
export type {
  KanbanBoardProps,
  KanbanCardData,
  KanbanCardProps,
  KanbanColumnConfig,
  KanbanColumnProps,
} from "./components/Kanban";

export { DEFAULT_ICON_NAMES, IconSelector } from "./components/IconSelector";
export type {
  DefaultIconName,
  IconSelectorProps,
} from "./components/IconSelector";

export { NotificationTag } from "./components/NotificationTag";
export type {
  NotificationTagProps,
  NotificationTagSize,
} from "./components/NotificationTag";

export {
  MapContainer,
  MapFallback,
  MapPin,
  MapTooltip,
} from "./components/Maps";
export type {
  MapContainerProps,
  MapContainerRef,
  MapCoordinate,
  MapFallbackProps,
  MapPinProps,
  MapTooltipData,
  MapTooltipProps,
  ViewportBounds,
} from "./components/Maps";

export {
  AddressAutocomplete,
  AddressForm,
  LocationListInput,
  useAddressAutocomplete,
} from "./components/Address";
export type {
  AddressAutocompleteProps,
  AddressFormProps,
  AddressResult,
  AddressSearchOptions,
  GeocodingProvider,
  LocationListInputProps,
} from "./components/Address";
export type {
  UseAddressAutocompleteConfig,
  UseAddressAutocompleteReturn,
} from "./components/Address";

export { RichTextEditor } from "./components/RichTextEditor";
export type { RichTextEditorProps } from "./components/RichTextEditor";

// Components
export { Button } from "./components/Button";
export type {
  ButtonColor,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
} from "./components/Button";

export { SocialButton } from "./components/SocialButton";
export type {
  SocialBrand,
  SocialButtonProps,
  SocialButtonStyle,
} from "./components/SocialButton";

export { SocialLoginGroup } from "./components/SocialLoginGroup";
export type { SocialLoginGroupProps } from "./components/SocialLoginGroup";

export { IconApple, IconGoogle } from "./components/Icons";
export type { IconAppleProps, IconGoogleProps } from "./components/Icons";

export { AppStoreButton } from "./components/AppStoreButton";
export type {
  AppStore,
  AppStoreButtonProps,
  AppStoreButtonStyle,
} from "./components/AppStoreButton";

export { ButtonGroup } from "./components/ButtonGroup";
export type {
  ButtonGroupItem,
  ButtonGroupMode,
  ButtonGroupOrientation,
  ButtonGroupProps,
  ButtonGroupSize,
} from "./components/ButtonGroup";

export { Input, PasswordInput, TextArea } from "./components/Input";
export { UploadSurface } from "./components/UploadSurface";
export type { UploadSelection, UploadSurfaceProps } from "./components/UploadSurface";
export type {
  InputProps,
  InputState,
  InputType,
  PasswordInputProps,
  TextAreaProps,
} from "./components/Input";

// Input composable sub-components
export {
  InputExternalAddon,
  InputHelperText,
  InputLabel,
  InputLeftSide,
  InputRightSide,
} from "./components/Input";
export type {
  InputExternalAddonProps,
  InputHelperTextProps,
  InputHelperTextType,
  InputLabelProps,
  InputLabelType,
  InputLeftSideProps,
  InputRightSideProps,
} from "./components/Input";

export { PhoneNumberInput } from "./components/PhoneNumberInput";
export type { PhoneNumberInputProps } from "./components/PhoneNumberInput";
export type { Country } from "./config/countries";

export { Dropdown } from "./components/Dropdown";
export type {
  DropdownItemState,
  DropdownItemType,
  DropdownPosition,
  DropdownProps,
} from "./components/Dropdown";

// Dropdown composable sub-components
export {
  DropdownItem,
  DropdownMenu,
  DropdownSection,
} from "./components/Dropdown";
export type {
  DropdownItemProps,
  DropdownMenuProps,
  DropdownSectionProps,
} from "./components/Dropdown";

export { Checkbox } from "./components/Checkbox";
export type {
  CheckboxColor,
  CheckboxProps,
  CheckboxSize,
  CheckboxState,
} from "./components/Checkbox";

export { CheckboxTree } from "./components/Checkbox/CheckboxTree";
export type {
  CheckboxTreeNode,
  CheckboxTreeProps,
} from "./components/Checkbox/CheckboxTree";

// Checkbox Tree utilities
export {
  findNode,
  getAllNodeIds,
  getCheckedNodeIds,
  getLeafNodeIds,
  updateNodeChecked,
} from "./components/Checkbox/CheckboxTree.utils";

export { Radio } from "./components/Radio";
export type {
  RadioColor,
  RadioProps,
  RadioSize,
  RadioState,
} from "./components/Radio";

export { RadioGroup } from "./components/Radio";
export type {
  RadioGroupOption,
  RadioGroupOrientation,
  RadioGroupProps,
} from "./components/Radio";

export { Toggle } from "./components/Toggle";
export { Toggle as Switch } from "./components/Toggle";
export { Toggle as ToggleSwitch } from "./components/Toggle";
export type {
  ToggleColor,
  ToggleProps,
  ToggleSize,
  ToggleState,
} from "./components/Toggle";

export { SelectionCard } from "./components/SelectionCard";
export type {
  SelectionCardLeadingType,
  SelectionCardProps,
  SelectionCardType,
} from "./components/SelectionCard";

export { Chip } from "./components/Chip";
export type { ChipProps, ChipSize, ChipType } from "./components/Chip";

export { Accordion } from "./components/Accordion";
export type {
  AccordionContentProps,
  AccordionItemProps,
  AccordionMode,
  AccordionProps,
  AccordionTriggerProps,
  AccordionValue,
  AccordionWidth,
} from "./components/Accordion";

export { AddAvatar, Avatar, AvatarGroup } from "./components/Avatar";
export type {
  AddAvatarProps,
  AvatarColor,
  AvatarGroupProps,
  AvatarProps,
  AvatarSize,
  AvatarStatus,
} from "./components/Avatar";

export { Alert } from "./components/Alert";
export type {
  AlertAction,
  AlertActionsPosition,
  AlertProps,
  AlertType,
  AlertVariant,
} from "./components/Alert";

export { StatusIndicator } from "./components/StatusIndicator";
export type {
  StatusIndicatorIconType,
  StatusIndicatorProps,
  StatusIndicatorStyle,
  StatusIndicatorType,
} from "./components/StatusIndicator";

export { Pagination } from "./components/Pagination";
export type {
  PaginationPosition,
  PaginationProps,
  PaginationRadius,
  PaginationType,
} from "./components/Pagination";

export { Step, Stepper } from "./components/Stepper";
export { Breadcrumb as BreadcrumbDeprecated } from "./components/Stepper";
export type {
  StepData,
  StepperColor,
  StepperProps,
  StepProps,
  StepStatus,
} from "./components/Stepper";
export type { BreadcrumbProps as BreadcrumbDeprecatedProps } from "./components/Stepper";

export {
  HintMessage,
  ProgressBar,
  ProgressBarBase,
  ProgressIndicator,
} from "./components/ProgressBar";
export type {
  HintMessageProps,
  HintMessageType,
  ProgressBarBaseProps,
  ProgressBarColor,
  ProgressBarOrientation,
  ProgressBarProps,
  ProgressIndicatorIconType,
  ProgressIndicatorProps,
} from "./components/ProgressBar";

export {
  formatRelativeTime,
  SaveStatusIndicator,
  SavingModal,
} from "./components/SaveStatusIndicator";
export type {
  SaveStatus,
  SaveStatusIndicatorProps,
  SavingModalProps,
} from "./components/SaveStatusIndicator";

// Shared components
export { HelperText } from "./components/HelperText";
export type { HelperTextType } from "./components/HelperText";

export { FieldError } from "./components/FieldError";
export type { FieldErrorProps } from "./components/FieldError";

export { CancelIcon, CheckIcon, Icon, InfoIcon } from "./components/Icon";
export type {
  CancelIconProps,
  CheckIconProps,
  IconProps,
  InfoIconProps,
} from "./components/Icon";

export { PasswordStrength } from "./components/PasswordStrength";
export type {
  PasswordRequirement,
  PasswordStrengthLevel,
  PasswordStrengthProps,
  PasswordStrengthVariant,
} from "./components/PasswordStrength";

export { Spinner } from "./components/Spinner";
export type {
  SpinnerColor,
  SpinnerProps,
  SpinnerSize,
} from "./components/Spinner";

export { FullscreenSpinner, LoadingOverlay } from "./components/LoadingOverlay";
export type {
  FullscreenSpinnerProps,
  LoadingOverlayProps,
} from "./components/LoadingOverlay";

export {
  Onboarding,
  OnboardingControls,
  OnboardingStepContent,
} from "./components/Onboarding";
export type {
  OnboardingControlsProps,
  OnboardingProps,
  OnboardingStepContentProps,
  OnboardingStepInfo,
} from "./components/Onboarding";

export { RangeSlider, Slider } from "./components/Slider";
export type {
  RangeSliderProps,
  RangeSliderSize,
  SliderColor,
  SliderHandleState,
  SliderIndicatorPosition,
  SliderProps,
} from "./components/Slider";

export { FileUpload } from "./components/FileUpload";
export type {
  FileUploadDropZoneProps,
  FileUploadItemProps,
  FileUploadListProps,
  FileUploadProgressProps,
  FileUploadProps,
  FileUploadStatus,
  FileUploadVariant,
  UploadedFile,
} from "./components/FileUpload";

// FileUpload composable sub-components
export {
  FileUploadDropZone,
  FileUploadItem,
  FileUploadList,
  FileUploadProgress,
} from "./components/FileUpload";

// FileUpload utility functions
export {
  fileToUploadedFile,
  formatFileSize,
  generateFileId,
  getFileIcon,
  validateFile,
} from "./components/FileUpload";

export { Breadcrumb } from "./components/Breadcrumb";
export type {
  BreadcrumbItemData,
  BreadcrumbItemProps,
  BreadcrumbItemState,
  BreadcrumbProps,
  BreadcrumbSeparatorProps,
} from "./components/Breadcrumb";

// Breadcrumb composable sub-components
export { BreadcrumbItem, BreadcrumbSeparator } from "./components/Breadcrumb";

export { Tabs } from "./components/Tabs";
export type {
  TabColor,
  TabContentProps,
  TabContentVariant,
  TabItemProps,
  TabOrientation,
  TabSize,
  TabsProps,
  TabState,
  TabTriggerProps,
  TabType,
} from "./components/Tabs";

export { Tooltip } from "./components/Tooltip";
export type {
  TooltipAction,
  TooltipArrowPosition,
  TooltipArrowProps,
  TooltipColor,
  TooltipContentProps,
  TooltipProps,
  TooltipStyleConfig,
  TooltipType,
  TriggerLayout,
} from "./components/Tooltip";

export { Sidebar, useSidebarContext } from "./components/Sidebar";
export {
  SidebarFooter,
  SidebarHeader,
  SidebarItemGroup,
  SidebarMenuItem,
  SidebarWidget,
} from "./components/Sidebar";
export type {
  SidebarFooterProps,
  SidebarHeaderProps,
  SidebarItemGroupProps,
  SidebarItemState,
  SidebarItemType,
  SidebarMenuItemProps,
  SidebarProps,
  SidebarVariant,
  SidebarWidgetProps,
  SidebarWidgetType,
} from "./components/Sidebar";

// Crypto Wallet components
export { CryptoWalletLayout } from "./components/CryptoWalletLayout";
export type {
  CryptoWalletLayoutProps,
  CryptoWalletLayoutVariant,
} from "./components/CryptoWalletLayout";

export { CryptoAssetCard } from "./components/CryptoAssetCard";
export type {
  ChangeType,
  CryptoAssetCardProps,
} from "./components/CryptoAssetCard";

export { TradeControls } from "./components/TradeControls";
export type {
  TradeAsset,
  TradeControlsProps,
  TradeMode,
} from "./components/TradeControls";

// Navigation components
export { NavIconButton } from "./components/NavIconButton";
export type {
  NavIconButtonBadge,
  NavIconButtonProps,
  NavIconButtonState,
  NavIconButtonVariant,
} from "./components/NavIconButton";

export { NotificationListItem } from "./components/NotificationListItem";
export type {
  NotificationAction,
  NotificationFile,
  NotificationLink,
  NotificationListItemProps,
  NotificationListItemVariant,
  NotificationState,
} from "./components/NotificationListItem";

export { SaaSSectionHeader } from "./components/SaaSSectionHeader";
export type {
  SaaSSectionHeaderProps,
  SaaSSectionHeaderVariant,
  SectionHeaderAction,
  TimePeriodOption,
} from "./components/SaaSSectionHeader";

export { SaaSNavigation } from "./components/SaaSNavigation";
export type {
  NavigationAction,
  NavigationAvatar,
  SaaSNavigationProps,
  SaaSNavigationVariant,
} from "./components/SaaSNavigation";

// DatePicker components
export { DatePickerDay } from "./components/DatePickerDay";
export type {
  DatePickerDayProps,
  DatePickerDayState,
} from "./components/DatePickerDay";

export { DatePickerHeader } from "./components/DatePickerHeader";
export type {
  DatePickerHeaderPosition,
  DatePickerHeaderProps,
  DatePickerHeaderType,
} from "./components/DatePickerHeader";

export { DatePickerBase } from "./components/DatePickerBase";
export type { DatePickerBaseProps } from "./components/DatePickerBase";

export { DatePicker } from "./components/DatePicker";
export type {
  DatePickerPresetOption,
  DatePickerProps,
  DatePickerSize,
  DatePickerType,
} from "./components/DatePicker";

export {
  ExpandedTableRow,
  Table,
  TableActionBar,
  TableAddRecordModal,
  TableCell,
  TableColumnHeader,
  TableColumnVisibilityModal,
} from "./components/Table";
export type {
  ExpandedTableRowProps,
  ExpandedTableRowVariant,
  SortDirection,
  TableActionBarProps,
  TableAddRecordModalProps,
  TableCellAlign,
  TableCellProps,
  TableCellState,
  TableCellType,
  TableColumn,
  TableColumnHeaderAlign,
  TableColumnHeaderProps,
  TableColumnHeaderState,
  TableColumnVisibilityModalProps,
  TableColumnVisibilityOption,
  TableExpansionConfig,
  TableHeaderAction,
  TableProps,
  TableRowData,
  TableSelectionConfig,
  TableSortConfig,
} from "./components/Table";

export {
  ConfirmationModal,
  EcommerceCartPreviewModal,
  EcommerceShippingModal,
  Modal,
  Modal as Dialog,
  ModalActions,
  ModalContent,
  ModalHeader,
  WorkspaceMembersModal,
} from "./components/Modal";
export type {
  CartItem,
  ConfirmationModalProps,
  EcommerceCartPreviewModalProps,
  EcommerceShippingModalProps,
  Member,
  ModalAction,
  ModalActionsOrientation,
  ModalActionsProps,
  ModalContentProps,
  ModalContentVariant,
  ModalHeaderOrientation,
  ModalHeaderProps,
  ModalProps,
  ShippingOption,
  WorkspaceMembersModalProps,
} from "./components/Modal";

// Sheet components (bottom sheet/drawer)
export {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
} from "./components/Sheet";
export type {
  SheetAnimation,
  SheetContentProps,
  SheetFooterProps,
  SheetHeaderProps,
  SheetHeight,
  SheetProps,
} from "./components/Sheet";

// Popover components
export {
  Popover,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
} from "./components/Popover";
export type {
  PopoverContentProps,
  PopoverFooterProps,
  PopoverHeaderProps,
  PopoverPlacement,
  PopoverProps,
  PopoverTrigger,
} from "./components/Popover";

// Form layout components
export {
  Fieldset,
  Form,
  FormActions,
  FormField,
  FormRow,
} from "./components/Form";
export type {
  FieldsetProps,
  FormActionsProps,
  FormFieldProps,
  FormProps,
  FormRowProps,
} from "./components/Form";

// SearchSelect component
export { SearchSelect } from "./components/SearchSelect";
export type {
  SearchSelectOption,
  SearchSelectProps,
} from "./components/SearchSelect";

// ResponsiveSelect and AdaptiveSelectSheet
export {
  AdaptiveSelectSheet,
  ResponsiveSelect,
} from "./components/ResponsiveSelect";
export type {
  AdaptiveSelectSheetProps,
  ResponsiveSelectOption,
  ResponsiveSelectProps,
  ResponsiveSelectSize,
} from "./components/ResponsiveSelect";

// ScrollArea component
export { ScrollArea, scrollTo, scrollToEnd } from "./components/ScrollArea";
export type { ScrollAreaProps } from "./components/ScrollArea";

export { List } from "./components/List";
export type { ListProps } from "./components/List";

export {
  CloudFileListItem,
  IntegrationListItem,
  ListItem,
  PhoneNumberListItem,
  ProductListItem,
  SearchResult01ListItem,
  SearchResult02ListItem,
  SearchResult03ListItem,
  SongTitleListItem,
  TaskListItem,
  // ListItem variant components
  UserProfile01ListItem,
  UserProfile02ListItem,
} from "./components/ListItem";
export type {
  CloudFileProps,
  IntegrationProps,
  ListItemProps,
  ListItemVariant,
  PhoneNumberProps,
  ProductProps,
  SearchResult01Props,
  SearchResult02Props,
  SearchResult03Props,
  SongTitleProps,
  TaskProps,
  UserProfile01Props,
  UserProfile02Props,
} from "./components/ListItem";

// Table shared types
export type { TableStyleConfig } from "./components/Table";

export { BarChart } from "./components/Chart";
export type { BarChartProps } from "./components/Chart";

export { BarChartBase } from "./components/Chart";
export type { BarChartBaseProps } from "./components/Chart";

export { LinearChart } from "./components/Chart";
export type { LinearChartProps } from "./components/Chart";

export { DonutChart } from "./components/Chart";
export type { DonutChartProps } from "./components/Chart";

export { CircleChart } from "./components/Chart";
export type { CircleChartProps } from "./components/Chart";

export { HalfPieChart } from "./components/Chart";
export type { HalfPieChartProps } from "./components/Chart";

export { MiniLinearChart } from "./components/Chart";
export type { MiniLinearChartProps } from "./components/Chart";

export { SmallCircleChart } from "./components/Chart";
export type { SmallCircleChartProps } from "./components/Chart";

export { StackedBarChart } from "./components/Chart";
export type {
  StackedBarChartData,
  StackedBarChartProps,
  StackedBarChartStack,
} from "./components/Chart";

export { PopulationPyramid } from "./components/Chart";
export type {
  PopulationPyramidData,
  PopulationPyramidProps,
} from "./components/Chart";

export { Chart } from "./components/Chart";
export type { ChartProps } from "./components/Chart";

// Chart shared types
export type {
  ChartColorScheme,
  ChartDataPoint,
  ChartPeriod,
  ChartSeries,
  ChartSize,
  ChartStyleConfig,
  CircleChartSize,
  DonutChartData,
  HalfPieChartSize,
} from "./components/Chart";

// Widget components
export { DashboardWidget } from "./components/Widgets/DashboardWidget";
export type { DashboardWidgetProps } from "./components/Widgets/DashboardWidget";
export { LegendIndicator } from "./components/Widgets/LegendIndicator";
export type {
  LegendIndicatorProps,
  LegendItem,
} from "./components/Widgets/LegendIndicator";

export {
  CircleChart as CircleChartWidget,
  DonutChart as DonutChartWidget,
  LinearChart as LinearChartWidget,
  PieChart as PieChartWidget,
} from "./components/Widgets/Charts";
export type {
  CircleChartWidgetProps,
  DonutChartWidgetProps,
  LinearChartWidgetProps,
  PieChartWidgetProps,
  WidgetChartDataPoint,
} from "./components/Widgets/Charts";

export { MetricWidget } from "./components/Widgets/Metrics";
export type {
  MetricChangeType,
  MetricWidgetProps,
  MetricWidgetType,
} from "./components/Widgets/Metrics";

export {
  BalanceWidget,
  ContactsWidget,
  CreditCardWidget,
  CurrencyConverterWidget,
  EarningsWidget,
  LargeBalanceWidget,
  SpendingLimitWidget,
  SubscriptionsWidget,
  TransactionsWidget,
  VirtualCardsWidget,
} from "./components/Widgets/Finance";
export type {
  BalanceWidgetProps,
  BalanceWidgetVariant,
  Contact,
  ContactsWidgetProps,
  CreditCardWidgetProps,
  CreditCardWidgetVariant,
  CurrencyConverterWidgetProps,
  EarningsDataItem,
  EarningsWidgetProps,
  LargeBalanceChartData,
  LargeBalanceWidgetProps,
  SpendingLimitWidgetProps,
  SpendingLimitWidgetVariant,
  Subscription,
  SubscriptionsWidgetProps,
  Transaction,
  TransactionsWidgetProps,
  VirtualCard,
  VirtualCardsWidgetProps,
} from "./components/Widgets/Finance";

export {
  CryptoBalanceWidget,
  CryptoConverterWidget,
  CryptoSinglePriceWidget,
  CryptoStockWidget,
  FearGreedIndexWidget,
  MarketTrendingWidget,
} from "./components/Widgets/Crypto";
export type {
  CryptoBalanceWidgetProps,
  CryptoConverterWidgetProps,
  CryptoSinglePriceWidgetProps,
  CryptoStockWidgetProps,
  CryptoStockWidgetVariant,
  FearGreedIndexWidgetProps,
  MarketTrendingWidgetProps,
} from "./components/Widgets/Crypto";

// Command Menu components
export { CommandMenu } from "./components/CommandMenu";
export type {
  CommandMenuProps,
  CommandMenuTab,
} from "./components/CommandMenu";

export { CommandMenuItem } from "./components/CommandMenu";
export type {
  CommandMenuItemData,
  CommandMenuItemOrientation,
  CommandMenuItemProps,
  CommandMenuItemState,
  CommandMenuItemType,
} from "./components/CommandMenu";

export { CommandShortcut } from "./components/CommandMenu";
export type {
  CommandShortcutProps,
  CommandShortcutVariant,
} from "./components/CommandMenu";

export { CommandMenuFooter } from "./components/CommandMenu";
export type {
  CommandMenuFooterProps,
  ShortcutHint,
} from "./components/CommandMenu";

// Settings components
export { AppearanceThemeCard } from "./components/AppearanceThemeCard";
export type {
  AppearanceThemeCardProps,
  AppearanceThemeCardStyleConfig,
  AppearanceThemeCardVariant,
} from "./components/AppearanceThemeCard";

export { SettingsSectionHeader } from "./components/SettingsSectionHeader";
export type {
  SettingsSectionHeaderProps,
  SettingsSectionHeaderStyleConfig,
} from "./components/SettingsSectionHeader";

export { SettingsFormField } from "./components/SettingsFormField";
export type { SettingsFormFieldProps } from "./components/SettingsFormField";

export { SettingsToggleCard } from "./components/SettingsToggleCard";
export type {
  SettingsToggleCardProps,
  SettingsToggleCardStyleConfig,
} from "./components/SettingsToggleCard";

export { SettingsNotificationTable } from "./components/SettingsNotificationTable";
export type {
  NotificationPreference,
  SettingsNotificationTableProps,
} from "./components/SettingsNotificationTable";

export { SettingsTeamTable } from "./components/SettingsTeamTable";
export type {
  SettingsTeamTableProps,
  TeamMember,
} from "./components/SettingsTeamTable";

export { SettingsIntegrationsGrid } from "./components/SettingsIntegrationsGrid";
export type {
  Integration,
  SettingsIntegrationsGridProps,
} from "./components/SettingsIntegrationsGrid";

export { SettingsPageLayout } from "./components/SettingsPageLayout";
export type {
  SettingsPageLayoutProps,
  SettingsTab,
} from "./components/SettingsPageLayout";

// Note: Additional components will be exported here as they are implemented
// Phase 1: Layout primitives (Box ✅, Stack ✅, Row ✅, Spacer ✅, Separator ✅)
// Phase 2: Core components (Input ✅, Checkbox ✅, Radio ✅, Toggle ✅) - Button ✅
// Phase 3: Feedback components (Alert ✅, Toast)
// Phase 4+: Complex components (Dialog, Popover, Select, Tooltip ✅, etc.)

// Theme system
export { ThemeContext, ThemeProvider, useThemeContext } from "./theme";
export type { ThemeContextValue } from "./theme";

/**
 * Package version
 */
export const VERSION = "0.1.0";

/**
 * Package metadata
 */
export const PACKAGE_NAME = "@scaffald/ui";
export const PACKAGE_DESCRIPTION =
  "Custom UI component library - Next generation of @unicornlove/ui";
