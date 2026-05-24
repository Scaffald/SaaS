/**
 * Beyond UI mock for unit tests.
 * Exports named components directly (for alias-based mocking via vitest.config.ts)
 * and also exports createBeyondUIMock() for backward compatibility.
 */
import type { ReactNode } from 'react'
import React, { createElement } from 'react'

const createEl =
  (tag: string) =>
  ({
    children,
    onPress,
    testID,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
    testID?: string
    [key: string]: unknown
  }) =>
    createElement(tag, { ...rest, 'data-testid': testID, onClick: onPress }, children)

// Layout primitives
export const Stack = createEl('div')
export const Row = createEl('div')
export const Box = createEl('div')
export const View = createEl('div')
export const YStack = createEl('div')
export const XStack = createEl('div')

// Typography
export const Text = ({ children, ...rest }: { children?: ReactNode; [key: string]: unknown }) =>
  createElement('span', rest, children)
export const H1 = createEl('h1')
export const H2 = createEl('h2')
export const H3 = createEl('h3')
export const H4 = createEl('h4')
export const H5 = createEl('h5')
export const H6 = createEl('h6')
export const Paragraph = createEl('p')
export const Label = createEl('label')

// Form elements
export const Input = ({
  value,
  onChangeText,
  placeholder,
  ...rest
}: {
  value?: string
  onChangeText?: (text: string) => void
  placeholder?: string
  [key: string]: unknown
}) =>
  createElement('input', {
    value: value ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChangeText?.(e.target.value),
    placeholder,
    ...rest,
  })

export const TextArea = ({
  value,
  onChangeText,
  ...rest
}: {
  value?: string
  onChangeText?: (text: string) => void
  [key: string]: unknown
}) =>
  createElement('textarea', {
    value: value ?? '',
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeText?.(e.target.value),
    ...rest,
  })

export const Button = ({
  children,
  onPress,
  disabled,
  ...rest
}: {
  children?: ReactNode
  onPress?: () => void
  disabled?: boolean
  [key: string]: unknown
}) => createElement('button', { type: 'button', disabled, onClick: onPress, ...rest }, children)

export const Checkbox = ({
  checked,
  onChange,
  ...rest
}: {
  checked?: boolean
  onChange?: (val: boolean) => void
  [key: string]: unknown
}) =>
  createElement('input', {
    type: 'checkbox',
    checked: checked ?? false,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked),
    ...rest,
  })

export const Switch = ({
  checked,
  onChange,
  ...rest
}: {
  checked?: boolean
  onChange?: (val: boolean) => void
  [key: string]: unknown
}) =>
  createElement('input', {
    type: 'checkbox',
    role: 'switch',
    checked: checked ?? false,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked),
    ...rest,
  })

// Also exported as ToggleSwitch for backward compat
export const Toggle = Switch
export const ToggleSwitch = Switch

export const ResponsiveSelect = ({
  value,
  onValueChange,
  options,
  placeholder,
  ...rest
}: {
  value?: string
  onValueChange?: (val: string) => void
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  [key: string]: unknown
}) =>
  createElement(
    'select',
    {
      value: value ?? '',
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onValueChange?.(e.target.value),
      ...rest,
    },
    options?.map((opt) => createElement('option', { key: opt.value, value: opt.value }, opt.label))
  )

export const SearchSelect = ResponsiveSelect

// Display components
export const Image = ({
  source,
  alt,
  ...rest
}: {
  source?: { uri?: string }
  alt?: string
  [key: string]: unknown
}) => createElement('img', { src: (source as { uri?: string })?.uri, alt: alt ?? '', ...rest })

export const ScrollView = ({
  children,
  ...rest
}: {
  children?: ReactNode
  [key: string]: unknown
}) => createElement('div', { 'data-testid': 'scroll-view', ...rest }, children)

export const Card = createEl('div')
export const Badge = createEl('span')
export const Chip = createEl('span')
export const Avatar = createEl('div')
export const Separator = ({
  orientation,
  ...rest
}: {
  orientation?: string
  [key: string]: unknown
}) => createElement('hr', { 'data-orientation': orientation, ...rest })

export const Spacer = createEl('div')
export const Anchor = createEl('a')
export const Group = createEl('div')
export const Circle = createEl('div')

export const VisuallyHidden = ({
  children,
  ...rest
}: {
  children?: ReactNode
  [key: string]: unknown
}) => createElement('span', { style: { position: 'absolute', opacity: 0 }, ...rest }, children)

export const Spinner = () => createElement('div', { 'data-testid': 'spinner' })

// Overlay components
export const Modal = ({
  children,
  visible,
  ...rest
}: {
  children?: ReactNode
  visible?: boolean
  [key: string]: unknown
}) =>
  visible
    ? createElement('div', { role: 'dialog', 'data-testid': 'modal', ...rest }, children)
    : null

export const Tooltip = ({
  children,
  ...rest
}: {
  children?: ReactNode
  [key: string]: unknown
}) => createElement('div', rest, children)

export const Portal = ({
  children,
}: {
  children?: ReactNode
  [key: string]: unknown
}) => createElement(React.Fragment, null, children)

// Misc
export const EmptyState = createEl('div')
export const Fieldset = createEl('fieldset')
export const ModalHeader = createEl('div')
export const ModalActions = createEl('div')
export const AssessmentHeader = createEl('div')

// Navigation / structural primitives (commonly imported by tests)
export const Breadcrumb = createEl('nav')
export const BreadcrumbList = createEl('ol')
export const BreadcrumbItem = createEl('li')
export const BreadcrumbLink = createEl('a')
export const BreadcrumbPage = createEl('span')
export const BreadcrumbSeparator = createEl('span')
export const BreadcrumbEllipsis = createEl('span')
export const TabList = createEl('div')
export const Tab = createEl('div')
export const TabPanel = createEl('div')
export const TooltipTrigger = createEl('span')
export const TooltipContent = createEl('span')
export const Popover = createEl('div')
export const PopoverTrigger = createEl('div')
export const PopoverContent = createEl('div')
export const Dialog = createEl('div')
export const DialogTrigger = createEl('div')
export const DialogContent = createEl('div')
export const DialogTitle = createEl('h2')
export const DialogDescription = createEl('p')
export const DialogClose = createEl('button')
export const Divider = createEl('hr')
export const Grid = createEl('div')
export const Flex = createEl('div')
export const Container = createEl('div')
export const Section = createEl('section')
export const Heading = createEl('h2')
export const Subheading = createEl('h3')
export const Caption = createEl('p')
export const Pill = createEl('span')
export const Tag = createEl('span')
export const ProgressIndicator = createEl('div')
export const Skeleton = createEl('div')
export const Toast = createEl('div')
export const ToastContainer = createEl('div')
export const ResponsiveModal = ({
  children,
  open,
  visible,
  ...rest
}: {
  children?: ReactNode
  open?: boolean
  visible?: boolean
  [key: string]: unknown
}) =>
  (open || visible)
    ? createElement('div', { role: 'dialog', 'data-testid': 'responsive-modal', ...rest }, children)
    : null
export const Slider = ({
  value,
  onValueChange,
  min,
  max,
  disabled,
  ...rest
}: {
  value?: number
  onValueChange?: (val: number) => void
  min?: number
  max?: number
  disabled?: boolean
  [key: string]: unknown
}) =>
  createElement('input', {
    type: 'range',
    role: 'slider',
    value: value ?? 0,
    min: min ?? 0,
    max: max ?? 100,
    disabled,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onValueChange?.(Number(e.target.value)),
    ...rest,
  })
export const RadioGroup = createEl('div')
export const DashboardWidget = createEl('div')
export const AddressAutocomplete = createEl('div')
export const AssessmentProgressBar = ({
  value,
  max,
  ...rest
}: {
  value?: number
  max?: number
  [key: string]: unknown
}) => createElement('div', { role: 'progressbar', 'aria-valuenow': value, 'aria-valuemax': max, ...rest })
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? require('react').useLayoutEffect : require('react').useEffect
export const Tabs = createEl('div')
export const Form = createEl('form')
export const Progress = ({
  value,
  max,
  ...rest
}: {
  value?: number
  max?: number
  [key: string]: unknown
}) => createElement('div', { role: 'progressbar', 'aria-valuenow': value, 'aria-valuemax': max, ...rest })

export const ProgressBarBase = ({
  value,
  max,
  ...rest
}: {
  value?: number
  max?: number
  [key: string]: unknown
}) => createElement('div', { role: 'progressbar', 'aria-valuenow': value, 'aria-valuemax': max, ...rest })

export const ProgressBar = ProgressBarBase

// Theme
export const ThemeProvider = ({ children }: { children?: ReactNode }) =>
  createElement(React.Fragment, null, children)

export function useThemeContext() {
  return { theme: 'light' as const }
}

export function useTheme() {
  return { theme: 'light' as const }
}

export function useToast() {
  return { show: () => {}, dismiss: () => {}, success: () => {}, error: () => {} }
}

export function useResponsive() {
  return { isMobile: false, isTablet: false, isDesktop: true, breakpoint: 'lg' as const }
}

export function useMedia() {
  return { sm: false, md: false, lg: true }
}

export function useWindowDimensions() {
  return { width: 1024, height: 768 }
}

export function styled(Component: React.ComponentType<Record<string, unknown>>) {
  return Component
}

export function createTheme() {
  return {}
}

// Backward compatibility: factory function used by some tests
export function createBeyondUIMock() {
  return {
    Stack,
    Row,
    Box,
    View,
    Text,
    Input,
    TextArea,
    Button,
    Image,
    ScrollView,
    Card,
    ThemeProvider,
    useThemeContext,
    VisuallyHidden,
    Spinner,
    useToast,
    H1,
    H2,
    H3,
    H4,
    H5,
    H6,
    Paragraph,
    styled,
    useWindowDimensions,
    Toggle,
    ToggleSwitch,
    ResponsiveSelect,
  }
}
