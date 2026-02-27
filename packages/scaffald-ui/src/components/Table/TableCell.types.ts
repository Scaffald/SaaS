/**
 * TableCell component types
 * Comprehensive type definitions for all table cell variants
 */

import type { ViewStyle, TextStyle, PressableProps } from 'react-native'
import type React from 'react'
import type { IconComponent } from '../types'

/**
 * Table cell type variants
 * Based on Figma Design System specifications
 */
export type TableCellType =
  | 'interactive-default'
  | 'interactive-hover'
  | 'interactive-focused'
  | 'interactive-error'
  | 'text-default'
  | 'card'
  | 'avatar'
  | 'assignee'
  | 'file'
  | 'brand-icon'
  | 'flag'
  | 'company'
  | 'crypto'
  | 'stock-market'
  | 'checkbox-only'
  | 'radio-only'
  | 'switch-only'
  | 'icon-open'
  | 'icon-close'
  | 'empty'
  | 'guideline-vertical-full'
  | 'guideline-vertical-half'
  | 'guideline-vertical-f-h'
  | 'status'
  | 'labels'
  | 'actions'
  | 'more'
  | 'progress-bar'
  | 'rating'
  | 'chart-01'
  | 'chart-02'
  | 'chart-03'

/**
 * Interactive state for table cells
 */
export type TableCellState = 'default' | 'hover' | 'focused' | 'disabled' | 'error'

/**
 * Text alignment for cell content
 */
export type TableCellAlign = 'left' | 'center' | 'right'

/**
 * Base props for all table cells
 */
export interface BaseTableCellProps extends Omit<PressableProps, 'style' | 'children'> {
  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom text style
   */
  textStyle?: TextStyle

  /**
   * Cell width (number in pixels or string)
   */
  width?: number | string

  /**
   * Text alignment
   * @default 'left'
   */
  align?: TableCellAlign
}

/**
 * Interactive cell props
 */
export interface InteractiveCellProps extends BaseTableCellProps {
  /**
   * Primary text content
   */
  text?: string

  /**
   * Interactive state
   * @default 'default'
   */
  state?: TableCellState

  /**
   * Callback when cell is pressed
   */
  onPress?: () => void
}

/**
 * Text cell props (with optional selection controls)
 */
export interface TextCellProps extends BaseTableCellProps {
  /**
   * Primary text content
   */
  text?: string

  /**
   * Secondary description text
   */
  description?: string

  /**
   * Show checkbox control
   * @default false
   */
  showCheckbox?: boolean

  /**
   * Show radio control
   * @default false
   */
  showRadio?: boolean

  /**
   * Show switch control
   * @default false
   */
  showSwitch?: boolean

  /**
   * Checkbox checked state
   */
  checked?: boolean

  /**
   * Radio checked state
   */
  radioChecked?: boolean

  /**
   * Switch checked state
   */
  switchChecked?: boolean

  /**
   * Callback when selection changes
   */
  onSelectionChange?: (checked: boolean) => void
}

/**
 * Avatar cell props
 */
export interface AvatarCellProps extends TextCellProps {
  /**
   * Avatar source (image URI or component)
   */
  avatar?: string | React.ReactNode

  /**
   * Show avatar indicator
   * @default false
   */
  showIndicator?: boolean
}

/**
 * Assignee cell props (for avatar groups)
 */
export interface AssigneeCellProps extends BaseTableCellProps {
  /**
   * Array of avatar sources or components
   */
  avatars?: Array<string | React.ReactNode>

  /**
   * Maximum number of avatars to display
   * @default 3
   */
  maxAvatars?: number
}

/**
 * Card cell props (payment method card)
 */
export interface CardCellProps extends TextCellProps {
  /**
   * Card brand icon or component
   */
  cardIcon?: React.ReactNode

  /**
   * Card expiration date (displayed as description)
   */
  expirationDate?: string
}

/**
 * File cell props
 */
export interface FileCellProps extends TextCellProps {
  /**
   * File type (PDF, DOC, etc.)
   */
  fileType?: string

  /**
   * File size (displayed as description)
   */
  fileSize?: string

  /**
   * File icon component
   */
  fileIcon?: React.ReactNode
}

/**
 * Brand icon cell props
 */
export interface BrandIconCellProps extends TextCellProps {
  /**
   * Brand icon component (e.g., Twitter, Facebook)
   */
  brandIcon?: React.ReactNode

  /**
   * Brand handle/username (displayed as description)
   */
  brandHandle?: string
}

/**
 * Flag cell props
 */
export interface FlagCellProps extends TextCellProps {
  /**
   * Flag icon component
   */
  flag?: React.ReactNode

  /**
   * Country code or phone prefix (displayed as description)
   */
  countryCode?: string
}

/**
 * Company cell props
 */
export interface CompanyCellProps extends TextCellProps {
  /**
   * Company logo component
   */
  logo?: React.ReactNode
}

/**
 * Crypto cell props
 */
export interface CryptoCellProps extends TextCellProps {
  /**
   * Cryptocurrency icon/badge component
   */
  cryptoIcon?: React.ReactNode

  /**
   * Cryptocurrency symbol (e.g., BTC, ETH)
   */
  symbol?: string
}

/**
 * Stock market cell props
 */
export interface StockMarketCellProps extends TextCellProps {
  /**
   * Trend icon (up/down arrow)
   */
  trendIcon?: React.ReactNode

  /**
   * Trend direction
   */
  trendDirection?: 'up' | 'down'

  /**
   * Trend value/percentage
   */
  trendValue?: string
}

/**
 * Status cell props
 */
export interface StatusCellProps extends BaseTableCellProps {
  /**
   * Status type
   */
  statusType?: 'success' | 'error' | 'warning' | 'info' | 'caution' | 'in-progress' | 'undefined'

  /**
   * Status label text
   */
  statusLabel?: string

  /**
   * Status style variant
   */
  statusStyle?: 'blank' | 'filled' | 'light' | 'outline'
}

/**
 * Labels cell props (chips/tags)
 */
export interface LabelsCellProps extends BaseTableCellProps {
  /**
   * Array of label text or chip components
   */
  labels?: Array<string | React.ReactNode>

  /**
   * Maximum number of labels to display before showing "+N"
   * @default 3
   */
  maxLabels?: number
}

/**
 * Actions cell props
 */
export interface ActionsCellProps extends BaseTableCellProps {
  /**
   * Array of action items (icon buttons)
   */
  actions?: Array<{
    icon: IconComponent
    onPress: () => void
    label?: string
  }>

  /**
   * Maximum number of actions to display
   * @default 4
   */
  maxActions?: number
}

/**
 * Progress bar cell props
 */
export interface ProgressBarCellProps extends BaseTableCellProps {
  /**
   * Progress value (0-100)
   */
  progress?: number

  /**
   * Progress bar color
   */
  progressColor?: 'primary' | 'gray' | 'error' | 'success'
}

/**
 * Rating cell props
 */
export interface RatingCellProps extends BaseTableCellProps {
  /**
   * Rating value (0-5)
   */
  rating?: number

  /**
   * Maximum rating value
   * @default 5
   */
  maxRating?: number
}

/**
 * Chart cell props
 */
export interface ChartCellProps extends BaseTableCellProps {
  /**
   * Chart type
   */
  chartType?: 'chart-01' | 'chart-02' | 'chart-03'

  /**
   * Chart data (for custom rendering)
   */
  chartData?: unknown

  /**
   * Chart component (for custom charts)
   */
  chartComponent?: React.ReactNode
}

/**
 * Main TableCell props
 * Union type that handles all cell variants
 */
export type TableCellProps = {
  /**
   * Cell type variant
   * @default 'interactive-default'
   */
  type?: TableCellType
} & (
  | ({ type: 'interactive-default' | 'interactive-hover' | 'interactive-focused' | 'interactive-error' } & InteractiveCellProps)
  | ({ type: 'text-default' } & TextCellProps)
  | ({ type: 'card' } & CardCellProps)
  | ({ type: 'avatar' } & AvatarCellProps)
  | ({ type: 'assignee' } & AssigneeCellProps)
  | ({ type: 'file' } & FileCellProps)
  | ({ type: 'brand-icon' } & BrandIconCellProps)
  | ({ type: 'flag' } & FlagCellProps)
  | ({ type: 'company' } & CompanyCellProps)
  | ({ type: 'crypto' } & CryptoCellProps)
  | ({ type: 'stock-market' } & StockMarketCellProps)
  | ({ type: 'checkbox-only' | 'radio-only' | 'switch-only' } & BaseTableCellProps & {
      checked?: boolean
      onSelectionChange?: (checked: boolean) => void
    })
  | ({ type: 'icon-open' | 'icon-close' } & BaseTableCellProps & {
      onIconPress?: () => void
    })
  | ({ type: 'empty' } & BaseTableCellProps)
  | ({ type: 'guideline-vertical-full' | 'guideline-vertical-half' | 'guideline-vertical-f-h' } & BaseTableCellProps)
  | ({ type: 'status' } & StatusCellProps)
  | ({ type: 'labels' } & LabelsCellProps)
  | ({ type: 'actions' } & ActionsCellProps)
  | ({ type: 'more' } & BaseTableCellProps & {
      onMorePress?: () => void
    })
  | ({ type: 'progress-bar' } & ProgressBarCellProps)
  | ({ type: 'rating' } & RatingCellProps)
  | ({ type: 'chart-01' | 'chart-02' | 'chart-03' } & ChartCellProps)
  | ({ type?: never } & BaseTableCellProps & {
      /**
       * Custom content (overrides type-based rendering)
       */
      children?: React.ReactNode
    })
)
