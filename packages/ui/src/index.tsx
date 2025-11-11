export * from './utils'
export * from './validToken'
export { config } from './tamagui.config'

// Re-export commonly used Tamagui components for convenience
export {
  Button,
  Input,
  Text,
  View,
  XStack,
  YStack,
  Stack,
  Separator,
  SizableText,
  Paragraph,
  H1,
  H2,
  H3,
  H4,
  ScrollView,
  isWeb,
  Theme,
  Form,
  Image,
  Spinner,
  useIsomorphicLayoutEffect,
} from 'tamagui'

export { Button as UIButton } from './components/buttons/Button'

// Re-export Toast components
export { ToastProvider, ToastViewport } from '@tamagui/toast'

// Re-export our custom components
export { FieldError } from './components/FieldError'
export { FileUpload, type FileUploadProps } from './components/FileUpload'
export { ImageUpload, type ImageUploadProps } from './components/ImageUpload'
export { FormWrapper } from './components/FormWrapper'
export { IconSelector } from './components/IconSelector'
export {
  UploadSurface,
  type UploadSurfaceProps,
  type UploadSelection,
} from './components/upload/UploadSurface'
export {
  Breadcrumb,
  type BreadcrumbItem,
  type BreadcrumbProps,
  type BreadcrumbSibling,
} from './components/Breadcrumb'
export { useBreadcrumbs } from './hooks/useBreadcrumbs'
export * from './components/rich-text'

// Individual component exports to avoid circular dependencies
export { CustomToast } from './components/CustomToast'
export * from './components/cookie-consent'
export * from './components/dialog'
export * from './components/date-picker'
export * from './components/cards'
export * from './components/charts'
export * from './components/checklist'
export { FullscreenSpinner } from './components/FullscreenSpinner'
export { LoadingOverlay } from './components/LoadingOverlay'
export * from './components/Onboarding'
export { OnboardingControls } from './components/OnboardingControls'
export { StepContent } from './components/OnboardingStepContent'
export { NotificationDropdown, type NotificationItem } from './components/NotificationDropdown'
export { ResponsiveModal, type ResponsiveModalProps } from './components/ResponsiveModal'

// Layout components
export { DashboardLayout } from './components/layouts/DashboardLayout'

// Other components
export * from './components/address'
export * from './components/certifications'
export * from './components/chips'
export * from './components/image-picker'
export * from './components/inputs'
export * from './components/maps'
export * from './components/notifications'
export * from './components/skills'
export * from './components/university'
export * from './components/user'
export * from './components/states'
export * from './components/typography'

// Hooks
export * from './hooks/useUniversitySearch'

// Configuration
export * from './config/animations'
export * from './config/countries'
export * from './config/elevation'
export * from './config/fonts'
export * from './config/icons'
export * from './config/layers'
export * from './config/media'
export * from './config/opacity'
export * from './config/radii'
export * from './config/shadows'
export * from './config/spacing'
export * from './config/typography'

// Utilities
export * from './utils/phoneValidation'
// CardStack component
export * from './CardStack'

// Table components
export * from './components/table/TableParts'
export * from './components/table/DataTable'
export * from './components/table/TableActionBar'
export * from './components/table/TableAddRecordModal'
export * from './components/table/TableColumnVisibilityModal'

// Kanban components
export * from './components/kanban'

// Styleguide
export * from './styleguide'
