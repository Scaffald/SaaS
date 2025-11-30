export interface ChecklistItem {
  id: string
  title: string
  description: string
  complete: boolean
  actionRoute?: string
  actionLabel?: string
}

export interface ChecklistProps {
  title?: string
  subtitle?: string
  items: ChecklistItem[]
  completionPercentage: number
  onItemPress?: (item: ChecklistItem) => void
  isLoading?: boolean
  showProgress?: boolean
}

export interface ChecklistHeaderProps {
  title?: string
  subtitle?: string
}

export interface ChecklistProgressProps {
  completionPercentage: number
}

export interface ChecklistListProps {
  items: ChecklistItem[]
  onItemPress?: (item: ChecklistItem) => void
}

export interface ChecklistItemProps {
  item: ChecklistItem
  onPress?: () => void
}
