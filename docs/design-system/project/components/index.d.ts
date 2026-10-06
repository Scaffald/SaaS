// Types as documentation — props of the ten documented @scaffald/ui components (packages/ui/src/components/*/*.types.ts).
import type * as React from 'react'

export type ButtonColor = 'gray' | 'primary' | 'success' | 'error'
export type ButtonVariant = 'filled' | 'outline' | 'light' | 'text' | 'glass' | 'bordered-prominent' | 'bordered' | 'borderless'
export type ButtonSize = 'sm' | 'md' | 'lg'
export interface ButtonProps {
  /** Label — verb first, sentence case. */
  children?: React.ReactNode
  /** @default 'gray' */
  color?: ButtonColor
  /** @default 'filled' */
  variant?: ButtonVariant
  /** sm 36px, md/lg 44px. @default 'md' */
  size?: ButtonSize
  disabled?: boolean
  fullWidth?: boolean
  /** A Lucide icon component. */
  iconStart?: React.ComponentType<{ size?: number; color?: string }>
  iconEnd?: React.ComponentType<{ size?: number; color?: string }>
  iconOnly?: boolean
  loading?: boolean
  /** iOS 26 variants: red accent. */
  destructive?: boolean
  onPress?: () => void
}
export declare function Button(props: ButtonProps): React.ReactElement

export type InputState = 'default' | 'hover' | 'focused' | 'error' | 'filled'
export type InputType = 'classic' | 'line'
export interface InputProps {
  label?: string
  required?: boolean
  helperText?: string
  error?: boolean
  errorMessage?: string
  showError?: boolean
  validateOnBlur?: boolean
  state?: InputState
  /** classic: radius-l + shadow-button; line: square, no shadow. @default 'classic' */
  type?: InputType
  /** A prefix cell such as "https://". */
  externalAddon?: string
  iconStart?: React.ComponentType<{ size?: number; color?: string }>
  iconEnd?: React.ComponentType<{ size?: number; color?: string }>
  iconEndOnPress?: () => void
  iconEndAccessibilityLabel?: string
  disabled?: boolean
  fullWidth?: boolean
  value?: string
  placeholder?: string
  onChangeText?: (text: string) => void
  showPasswordStrength?: boolean
  passwordStrength?: 'too-weak' | 'weak' | 'good' | 'strong'
  passwordRequirements?: Array<{ label: string; met: boolean }>
}
export declare function Input(props: InputProps): React.ReactElement

export type CardVariant = 'elevated' | 'surface' | 'outlined' | 'filled' | 'glass'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type CardRadius = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
export type CardElevation = 'sm' | 'md' | 'lg' | 'soft' | 'glass'
export interface CardProps {
  children: React.ReactNode
  /** @default 'elevated' */
  variant?: CardVariant
  bordered?: boolean
  elevate?: boolean
  /** none 0 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32. @default 'md' */
  padding?: CardPadding
  /** sm…2xl resolve to radius-l (7); xl 20 and 3xl 32 are literals. */
  radius?: CardRadius
  /** sm shadow-xs · md shadow-s · lg shadow-m · soft shadow-soft · glass shadow-glass */
  elevation?: CardElevation
  glassMaterial?: 'ultrathin' | 'thin' | 'regular' | 'thick' | 'chrome'
  pressable?: boolean
  onPress?: () => void
  disabled?: boolean
  accessibilityLabel?: string
}
export interface CardHeaderProps { title?: string; subtitle?: string; action?: React.ReactNode; children?: React.ReactNode }
export interface CardFooterProps { children: React.ReactNode; align?: 'left' | 'center' | 'right' | 'space-between' }
export interface CardMediaProps { source: { uri: string } | number; alt?: string; height?: number; position?: 'top' | 'bottom' }
export declare function Card(props: CardProps): React.ReactElement

export type ChipType = 'default' | 'icon' | 'avatar' | 'flag' | 'brand-icon' | 'crypto'
export type ChipSize = 'sm' | 'md' | 'lg'
export interface ChipProps {
  children: string | React.ReactNode
  /** @default 'default' */
  type?: ChipType
  /** sm 24 · md 28 · lg 32. @default 'md' */
  size?: ChipSize
  disabled?: boolean
  /** Inverts to a text-primary fill. */
  selected?: boolean
  onPress?: () => void
  closeIcon?: boolean
  onClose?: () => void
  icon?: React.ComponentType<{ size?: number; color?: string }>
  avatar?: React.ReactNode
  flag?: React.ReactNode
  brandIcon?: React.ReactNode
  crypto?: React.ReactNode
}
export declare function Chip(props: ChipProps): React.ReactElement

export type MetricTone = 'neutral' | 'positive' | 'attention'
export interface MetricBlockProps {
  /** The h6 kicker above the figure. */
  label: string
  /** h2 semibold, tabular numerals. */
  value: React.ReactNode
  delta?: React.ReactNode
  /** Colours the delta: fg-success, text-attention, or text-tertiary. @default 'neutral' */
  tone?: MetricTone
  /** Figure in text-attention. */
  emphasis?: boolean
}
export interface MetricRowProps { children: React.ReactNode; /** @default 140 */ minColumnWidth?: number; /** Hairline rules above and below. */ bordered?: boolean }
export declare function MetricBlock(props: MetricBlockProps): React.ReactElement
export declare function MetricRow(props: MetricRowProps): React.ReactElement

export type TabType = 'default' | 'line' | 'shadow'
export type TabColor = 'gray' | 'primary'
export type TabSize = 'sm' | 'md' | 'lg'
export interface TabsProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** @default 'default' */
  type?: TabType
  /** @default 'gray' */
  color?: TabColor
  /** sm 32 · md 36 · lg 44. @default 'md' */
  size?: TabSize
  orientation?: 'horizontal' | 'vertical'
  disabled?: boolean
  fullWidth?: boolean
  contentVariant?: 'default' | 'bordered'
  triggerSizing?: 'auto' | 'equal' | 'fixed'
  scrollable?: boolean
  wrapBelow?: number
  children: React.ReactNode
}
export interface TabItemProps { value: string; disabled?: boolean; children: React.ReactNode }
export interface TabTriggerProps { children?: React.ReactNode; iconStart?: React.ComponentType; iconEnd?: React.ComponentType; iconOnly?: boolean; onPress?: () => void }
export interface TabContentProps { children: React.ReactNode; value?: string }
export declare function Tabs(props: TabsProps): React.ReactElement

export interface CheckboxProps {
  checked?: boolean
  indeterminate?: boolean
  onChange?: (checked: boolean) => void
  /** sm 16 · md 20. @default 'md' */
  size?: 'sm' | 'md'
  /** @default 'primary' */
  color?: 'gray' | 'primary'
  disabled?: boolean
  error?: boolean
  errorMessage?: string
  showError?: boolean
  label?: string
  helperText?: string
  optional?: boolean
  labelElement?: React.ReactNode
  accessibilityLabel?: string
}
export declare function Checkbox(props: CheckboxProps): React.ReactElement

export interface ToggleProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  /** sm 36×20 · md 44×24. @default 'md' */
  size?: 'sm' | 'md'
  /** @default 'primary' */
  color?: 'gray' | 'primary' | 'red-green'
  disabled?: boolean
  error?: boolean
  errorMessage?: string
  showError?: boolean
  label?: string
  helperText?: string
  optional?: boolean
  labelElement?: React.ReactNode
  accessibilityLabel?: string
}
export declare function Toggle(props: ToggleProps): React.ReactElement

export type StatusIndicatorType = 'caution' | 'success' | 'undefined' | 'in-progress' | 'error' | 'help'
export interface StatusIndicatorProps {
  /** @default 'success' */
  type?: StatusIndicatorType
  /** @default 'blank' */
  variant?: 'blank' | 'light' | 'outline' | 'filled'
  /** @default 'filled' */
  iconType?: 'filled' | 'linear' | 'dot'
  /** Mandatory: colour is never the only cue. */
  label: string
}
export declare function StatusIndicator(props: StatusIndicatorProps): React.ReactElement

export type TextColor = 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'error' | 'success' | 'warning' | 'inherit' | string
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold'
export type TextSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export interface HeadingProps {
  /** Matches the document outline, not a size. */
  level: 1 | 2 | 3 | 4 | 5 | 6
  weight?: TextWeight
  /** Display serif on web regardless; this flag is for Text/Paragraph. */
  serif?: boolean
  color?: TextColor
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify'
  children?: React.ReactNode
}
export interface TextProps { size?: TextSize; weight?: TextWeight; serif?: boolean; mono?: boolean; color?: TextColor; children?: React.ReactNode }
export interface ParagraphProps { size?: TextSize; weight?: TextWeight; serif?: boolean; color?: TextColor; children?: React.ReactNode }
export interface LabelProps { htmlFor?: string; size?: 'sm' | 'md' | 'lg'; weight?: TextWeight; required?: boolean; disabled?: boolean; children?: React.ReactNode }
export interface CaptionProps { weight?: TextWeight; color?: TextColor; children?: React.ReactNode }
export declare function Heading(props: HeadingProps): React.ReactElement
export declare function Text(props: TextProps): React.ReactElement
export declare function Paragraph(props: ParagraphProps): React.ReactElement
export declare function Label(props: LabelProps): React.ReactElement
export declare function Caption(props: CaptionProps): React.ReactElement
