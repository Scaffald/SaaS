export { SelectableCard } from './SelectableCard'
export { CardHeader } from './CardHeader'
export { CardMetadata } from './CardMetadata'
export { CardBadges } from './CardBadges'
export { CardActions } from './CardActions'

// Domain-specific card variants
export { ProfileCard } from './ProfileCard'
export { OrganizationCard } from './OrganizationCard'
export { JobCard } from './JobCard'
export { DashboardWidget } from './DashboardWidget'
export { NewsCard } from './NewsCard'

export type {
  ActionButton,
  BadgeConfig,
  BaseCardProps,
  CardActionsProps,
  CardBadgesProps,
  CardHeaderProps,
  CardMetadataProps,
  MetadataItem,
  SelectableCardProps,
  SelectionConfig,
} from './types'

// Domain-specific types
export type { ProfileBadge, ProfileCardProps } from './ProfileCard'
export type {
  OrganizationAddress,
  OrganizationCardProps,
} from './OrganizationCard'
export type { JobCardProps, JobOrganization } from './JobCard'
