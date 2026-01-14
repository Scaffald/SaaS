/**
 * WorkspaceMembersModal component type definitions
 */

import type { ViewStyle, } from 'react-native'

export interface Member {
  /**
   * Unique identifier for the member
   */
  id: string

  /**
   * Member full name
   */
  name: string

  /**
   * Member username/handle (e.g., "@username")
   */
  username: string

  /**
   * Member avatar image URL
   */
  avatar?: string

  /**
   * Avatar type
   */
  avatarType?: 'photo' | 'icon' | 'initial'

  /**
   * Avatar color variant
   */
  avatarColor?: string
}

export interface WorkspaceMembersModalProps {
  /**
   * List of members to display
   */
  members: Member[]

  /**
   * Currently active tab
   */
  activeTab?: string

  /**
   * Callback when tab changes
   */
  onTabChange?: (tab: string) => void

  /**
   * Callback when search query changes
   */
  onSearch?: (query: string) => void

  /**
   * Callback when "Add new member" is pressed
   */
  onAddMember?: () => void

  /**
   * Search input placeholder
   * @default 'Placeholder'
   */
  searchPlaceholder?: string

  /**
   * Search input helper text
   * @default 'Helper text'
   */
  searchHelperText?: string

  /**
   * Custom style for the container
   */
  style?: ViewStyle
}
