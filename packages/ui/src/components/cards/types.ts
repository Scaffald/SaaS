import type {
  BaseCardProps,
  RefForwardingProps,
  SelectionConfig,
  SpacingProps,
} from '../../types/common'
import type {
  ActionButton,
  BadgeConfig,
  CardActionsProps,
  CardBadgesProps,
  CardHeaderProps,
  CardMetadataProps,
  MetadataItem,
} from '../../types/components'

// Re-export consolidated types for convenience
export type {
  ActionButton,
  BadgeConfig,
  BaseCardProps,
  CardActionsProps,
  CardBadgesProps,
  CardHeaderProps,
  CardMetadataProps,
  MetadataItem,
  SelectionConfig,
}

/**
 * Complete selectable card props
 */
export interface SelectableCardProps
  extends BaseCardProps,
    RefForwardingProps,
    SpacingProps {
  /** Selection configuration */
  selection?: SelectionConfig
}
