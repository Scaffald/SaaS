/**
 * WorkspaceMembersModal component
 * Modal content variant for workspace members management
 * Includes tabs, search, and member list
 * Mapped from Figma Forsured Design System
 *
 * @example
 * ```tsx
 * import { WorkspaceMembersModal } from '@scaffald/ui'
 *
 * <WorkspaceMembersModal
 *   members={[
 *     {
 *       id: '1',
 *       name: 'Edward Smith',
 *       username: '@ediesmith',
 *       avatar: 'https://example.com/avatar.jpg',
 *       avatarType: 'photo',
 *     },
 *   ]}
 *   activeTab="members"
 *   onTabChange={setActiveTab}
 *   onSearch={handleSearch}
 *   onAddMember={handleAddMember}
 * />
 * ```
 */

import { useState, useMemo } from 'react'
import { View, Text, Pressable, StyleSheet, Platform, type ViewStyle, type TextStyle } from 'react-native'
import { Search } from 'lucide-react-native'
import type { WorkspaceMembersModalProps } from './WorkspaceMembersModal.types'
import { useThemeContext } from '../../../theme'
import { colors } from '../../../tokens/colors'
import type { ThemeMode } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { borderRadius, } from '../../../tokens/borders'
import { typography } from '../../../tokens/typography'
import { boxShadows } from '../../../tokens/shadows'
import { Input } from '../../Input'
import { Avatar, AddAvatar } from '../../Avatar'

// Helper functions for theme-dependent styles
function getTabsContainer(theme: ThemeMode): ViewStyle {
  return {
    backgroundColor: colors.bg[theme].subtle,
    borderRadius: borderRadius.s, // 8px
    padding: spacing[4],
    gap: spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
  }
}

function getTab(theme: ThemeMode, isSelected: boolean): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xs, // 6px
    backgroundColor: isSelected ? colors.bg[theme].default : 'transparent',
    ...(isSelected && Platform.OS === 'web' ? { boxShadow: boxShadows.tabs } : {}),
    ...(isSelected && Platform.OS !== 'web'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 1,
        }
      : {}),
  }
}

function getTabText(theme: ThemeMode, isSelected: boolean): TextStyle {
  return {
    fontFamily: typography.paragraphMMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.paragraphMMedium.fontWeight,
    lineHeight: typography.body.lineHeight,
    color: isSelected ? colors.text[theme].primary : colors.text[theme].tertiary,
    textAlign: 'center',
  }
}

function getBadge(_theme: ThemeMode): ViewStyle {
  return {
    backgroundColor: colors.gray[900], // foreground-01
    borderRadius: borderRadius.max, // Fully rounded
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[2],
    minWidth: spacing[20],
    height: spacing[20],
    justifyContent: 'center',
    alignItems: 'center',
  }
}

function getBadgeText(_theme: ThemeMode): TextStyle {
  return {
    fontFamily: typography.captionMedium.fontFamily,
    fontSize: typography.captionMedium.fontSize,
    fontWeight: typography.captionMedium.fontWeight,
    lineHeight: typography.captionMedium.lineHeight,
    color: colors.white,
    textAlign: 'center',
  }
}

function getAddMemberButton(_theme: ThemeMode): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingVertical: spacing[12],
  }
}

function getAddMemberText(theme: ThemeMode): TextStyle {
  return {
    fontFamily: typography.paragraphMMedium.fontFamily,
    fontSize: typography.paragraphMMedium.fontSize,
    fontWeight: typography.paragraphMMedium.fontWeight,
    lineHeight: typography.paragraphMMedium.lineHeight,
    color: colors.text[theme].primary,
  }
}

function getMemberItem(_theme: ThemeMode): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[12],
  }
}

function getMemberName(theme: ThemeMode): TextStyle {
  return {
    fontFamily: typography.paragraphMMedium.fontFamily,
    fontSize: typography.paragraphMMedium.fontSize,
    fontWeight: typography.paragraphMMedium.fontWeight,
    lineHeight: typography.paragraphMMedium.lineHeight,
    color: colors.text[theme].primary,
  }
}

function getMemberUsername(theme: ThemeMode): TextStyle {
  return {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
    color: colors.text[theme].secondary,
  }
}

export function WorkspaceMembersModal({
  members,
  activeTab = 'members',
  onTabChange,
  onSearch,
  onAddMember,
  searchPlaceholder = 'Placeholder',
  searchHelperText = 'Helper text',
  style,
}: WorkspaceMembersModalProps) {
  const { theme } = useThemeContext()
  const [searchQuery, setSearchQuery] = useState('')

  // Memoize theme-dependent styles
  const tabsContainerStyle = useMemo(() => getTabsContainer(theme), [theme])
  const badgeStyle = useMemo(() => getBadge(theme), [theme])
  const badgeTextStyle = useMemo(() => getBadgeText(theme), [theme])
  const addMemberButtonStyle = useMemo(() => getAddMemberButton(theme), [theme])
  const addMemberTextStyle = useMemo(() => getAddMemberText(theme), [theme])
  const memberItemStyle = useMemo(() => getMemberItem(theme), [theme])
  const memberNameStyle = useMemo(() => getMemberName(theme), [theme])
  const memberUsernameStyle = useMemo(() => getMemberUsername(theme), [theme])

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  // Filter members based on search
  const filteredMembers = members.filter((member) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      member.name.toLowerCase().includes(query) ||
      member.username.toLowerCase().includes(query)
    )
  })

  return (
    <View style={[localStyles.container, style]}>
      {/* Tabs */}
      <View style={tabsContainerStyle}>
        {(['summary', 'members', 'orders', 'services'] as const).map((tabValue) => {
          const isSelected = activeTab === tabValue
          const tabLabel =
            tabValue === 'orders' ? 'Orders History' : tabValue.charAt(0).toUpperCase() + tabValue.slice(1)

          // Memoize tab styles per tab
          const tabStyle = getTab(theme, isSelected)
          const tabTextStyle = getTabText(theme, isSelected)

          return (
            <Pressable
              key={tabValue}
              style={[
                tabStyle,
                tabValue === 'members' && members.length > 0 && localStyles.tabWithBadge,
              ]}
              onPress={() => onTabChange?.(tabValue)}
            >
              <Text style={tabTextStyle}>{tabLabel}</Text>
              {tabValue === 'members' && members.length > 0 && (
                <View style={badgeStyle}>
                  <Text style={badgeTextStyle}>{members.length}</Text>
                </View>
              )}
            </Pressable>
          )
        })}
      </View>

      {/* Search Input */}
      <View style={localStyles.searchContainer}>
        <Input
          placeholder={searchPlaceholder}
          helperText={searchHelperText}
          iconStart={Search}
          value={searchQuery}
          onChangeText={handleSearch}
          type="line"
        />
      </View>

      {/* Add New Member */}
      <Pressable
        style={addMemberButtonStyle}
        onPress={onAddMember}
      >
        <AddAvatar size={48} onPress={onAddMember} />
        <Text style={addMemberTextStyle}>Add new member</Text>
      </Pressable>

      {/* Member List */}
      <View style={localStyles.membersList}>
        {filteredMembers.map((member) => {
          // Generate initials from name
          const initials = member.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)

          return (
            <View key={member.id} style={memberItemStyle}>
              <View style={localStyles.memberInfo}>
                <Avatar
                  size={48}
                  color={(member.avatarColor as any) || 'gray'}
                  src={member.avatar}
                  initials={!member.avatar ? initials : undefined}
                  alt={member.name}
                />
                <View style={localStyles.memberText}>
                  <Text style={memberNameStyle}>{member.name}</Text>
                  <Text style={memberUsernameStyle}>
                    {member.username}
                  </Text>
                </View>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[16],
  },
  tabWithBadge: {
    gap: spacing[6],
  },
  searchContainer: {
    marginTop: spacing[8],
  },
  membersList: {
    flexDirection: 'column',
    gap: spacing[12],
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  memberText: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 0,
  },
})
