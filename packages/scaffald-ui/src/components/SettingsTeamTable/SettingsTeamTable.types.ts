/**
 * SettingsTeamTable component types
 */

import type { ViewStyle } from 'react-native'

export interface TeamMember {
  /**
   * Unique identifier for the team member
   */
  id: string

  /**
   * Member name
   */
  name: string

  /**
   * Member email
   */
  email?: string

  /**
   * Avatar image URL
   */
  avatar?: string

  /**
   * Date added to team
   */
  dateAdded: string

  /**
   * Member role
   */
  role: string

  /**
   * Whether the member is selected
   */
  selected?: boolean
}

export interface SettingsTeamTableProps {
  /**
   * Team members data
   */
  members: TeamMember[]

  /**
   * Callback when selection changes
   */
  onSelectionChange?: (selectedIds: string[]) => void

  /**
   * Callback when edit action is pressed
   */
  onEdit?: (memberId: string) => void

  /**
   * Callback when delete action is pressed
   */
  onDelete?: (memberId: string) => void

  /**
   * Custom container style
   */
  style?: ViewStyle
}
