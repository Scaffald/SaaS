/**
 * SettingsTeamTable component
 * Table for managing team members
 *
 * @example
 * ```tsx
 * import { SettingsTeamTable } from '@scaffald/ui'
 *
 * <SettingsTeamTable
 *   members={teamMembers}
 *   onSelectionChange={(selectedIds) => {
 *     // Handle selection
 *   }}
 *   onEdit={(memberId) => {
 *     // Handle edit
 *   }}
 *   onDelete={(memberId) => {
 *     // Handle delete
 *   }}
 * />
 * ```
 */

import { View, Text, ScrollView, Pressable } from 'react-native'
import type { SettingsTeamTableProps, } from './SettingsTeamTable.types'
import { useThemeContext } from '../../theme'
import { Checkbox } from '../Checkbox'
import { Avatar } from '../Avatar'
import { Edit2, Trash2 } from 'lucide-react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { shadows } from '../../tokens/shadows'
import { useInteractiveState } from '../../hooks/useInteractiveState'

export function SettingsTeamTable({
  members,
  onSelectionChange,
  onEdit,
  onDelete,
  style,
}: SettingsTeamTableProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  const selectedIds = members.filter((m) => m.selected).map((m) => m.id)
  const allSelected = members.length > 0 && selectedIds.length === members.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < members.length

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(members.map((m) => m.id))
    } else {
      onSelectionChange?.([])
    }
  }

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedIds, memberId])
    } else {
      onSelectionChange?.(selectedIds.filter((id) => id !== memberId))
    }
  }

  const headerBg = isLight ? colors.gray[50] : colors.gray[800]
  const cellBg = isLight ? colors.bg.light.default : colors.bg.dark.default
  const borderColor = isLight ? colors.border.light['200'] : colors.border.dark['200']
  const textPrimary = isLight ? colors.text.light.primary : colors.text.dark.primary
  const textSecondary = isLight ? colors.text.light.secondary : colors.text.dark.secondary
  const iconColor = isLight ? colors.gray[600] : colors.gray[300]

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getRoleBadgeColor = (role: string) => {
    // Map roles to colors - adjust as needed
    if (role.toLowerCase().includes('admin') || role.toLowerCase().includes('owner')) {
      return isLight ? colors.error[500] : colors.error[400]
    }
    if (role.toLowerCase().includes('member')) {
      return isLight ? colors.primary[500] : colors.primary[400]
    }
    return isLight ? colors.gray[600] : colors.gray[400]
  }

  return (
    <View
      style={[
        {
          borderRadius: borderRadius.l,
          overflow: 'hidden',
          ...shadows.button,
        },
        style,
      ]}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header Row */}
          <View style={{ flexDirection: 'row' }}>
            {/* Checkbox Column */}
            <View style={{ width: 60 }}>
              <View
                style={{
                  backgroundColor: headerBg,
                  paddingHorizontal: spacing[20],
                  paddingVertical: spacing[10],
                  height: 44,
                  justifyContent: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: borderColor,
                  borderTopLeftRadius: borderRadius.m,
                }}
              >
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleSelectAll}
                  size="sm"
                  color="primary"
                />
              </View>
            </View>

            {/* Name Column */}
            <View style={{ width: 300 }}>
              <View
                style={{
                  backgroundColor: headerBg,
                  paddingHorizontal: spacing[20],
                  paddingVertical: spacing[10],
                  height: 44,
                  justifyContent: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: borderColor,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.bodyMedium.fontFamily,
                    fontSize: 14,
                    fontWeight: typography.bodyMedium.fontWeight,
                    lineHeight: 20,
                    color: textSecondary,
                  }}
                >
                  Name
                </Text>
              </View>
            </View>

            {/* Date Added Column */}
            <View style={{ width: 200 }}>
              <View
                style={{
                  backgroundColor: headerBg,
                  paddingHorizontal: spacing[20],
                  paddingVertical: spacing[10],
                  height: 44,
                  justifyContent: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: borderColor,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.bodyMedium.fontFamily,
                    fontSize: 14,
                    fontWeight: typography.bodyMedium.fontWeight,
                    lineHeight: 20,
                    color: textSecondary,
                  }}
                >
                  Date Added
                </Text>
              </View>
            </View>

            {/* Role Column */}
            <View style={{ width: 150 }}>
              <View
                style={{
                  backgroundColor: headerBg,
                  paddingHorizontal: spacing[20],
                  paddingVertical: spacing[10],
                  height: 44,
                  justifyContent: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: borderColor,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.bodyMedium.fontFamily,
                    fontSize: 14,
                    fontWeight: typography.bodyMedium.fontWeight,
                    lineHeight: 20,
                    color: textSecondary,
                  }}
                >
                  Role
                </Text>
              </View>
            </View>

            {/* Actions Column */}
            <View style={{ width: 120 }}>
              <View
                style={{
                  backgroundColor: headerBg,
                  paddingHorizontal: spacing[20],
                  paddingVertical: spacing[10],
                  height: 44,
                  justifyContent: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: borderColor,
                  borderTopRightRadius: borderRadius.m,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.bodyMedium.fontFamily,
                    fontSize: 14,
                    fontWeight: typography.bodyMedium.fontWeight,
                    lineHeight: 20,
                    color: textSecondary,
                  }}
                >
                  Actions
                </Text>
              </View>
            </View>
          </View>

          {/* Data Rows */}
          {members.map((member, index) => {
            const isLastRow = index === members.length - 1

            return (
              <View key={member.id} style={{ flexDirection: 'row' }}>
                {/* Checkbox Cell */}
                <View style={{ width: 60 }}>
                  <View
                    style={{
                      backgroundColor: cellBg,
                      paddingHorizontal: spacing[20],
                      paddingVertical: spacing[16],
                      height: 72,
                      justifyContent: 'center',
                      borderBottomWidth: isLastRow ? 0 : 1,
                      borderBottomColor: borderColor,
                      ...(isLastRow && {
                        borderBottomLeftRadius: borderRadius.m,
                      }),
                    }}
                  >
                    <Checkbox
                      checked={member.selected || false}
                      onChange={(checked) => handleSelectMember(member.id, checked)}
                      size="sm"
                      color="primary"
                    />
                  </View>
                </View>

                {/* Name Cell */}
                <View style={{ width: 300 }}>
                  <View
                    style={{
                      backgroundColor: cellBg,
                      paddingHorizontal: spacing[20],
                      paddingVertical: spacing[16],
                      height: 72,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing[10],
                      borderBottomWidth: isLastRow ? 0 : 1,
                      borderBottomColor: borderColor,
                    }}
                  >
                    <Avatar
                      size={40}
                      src={member.avatar}
                      initials={getInitials(member.name)}
                      alt={member.name}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: typography.bodyMedium.fontFamily,
                          fontSize: 14,
                          fontWeight: typography.bodyMedium.fontWeight,
                          lineHeight: 20,
                          color: textPrimary,
                        }}
                      >
                        {member.name}
                      </Text>
                      {member.email && (
                        <Text
                          style={{
                            fontFamily: typography.body.fontFamily,
                            fontSize: 12,
                            fontWeight: typography.body.fontWeight,
                            lineHeight: 16,
                            color: textSecondary,
                            marginTop: spacing[2],
                          }}
                        >
                          {member.email}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Date Added Cell */}
                <View style={{ width: 200 }}>
                  <View
                    style={{
                      backgroundColor: cellBg,
                      paddingHorizontal: spacing[20],
                      paddingVertical: spacing[16],
                      height: 72,
                      justifyContent: 'center',
                      borderBottomWidth: isLastRow ? 0 : 1,
                      borderBottomColor: borderColor,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: typography.body.fontFamily,
                        fontSize: 14,
                        fontWeight: typography.body.fontWeight,
                        lineHeight: 20,
                        color: textPrimary,
                      }}
                    >
                      {member.dateAdded}
                    </Text>
                  </View>
                </View>

                {/* Role Cell */}
                <View style={{ width: 150 }}>
                  <View
                    style={{
                      backgroundColor: cellBg,
                      paddingHorizontal: spacing[20],
                      paddingVertical: spacing[16],
                      height: 72,
                      justifyContent: 'center',
                      borderBottomWidth: isLastRow ? 0 : 1,
                      borderBottomColor: borderColor,
                    }}
                  >
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        paddingHorizontal: spacing[8],
                        paddingVertical: spacing[4],
                        borderRadius: borderRadius.max,
                        backgroundColor: getRoleBadgeColor(member.role),
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: typography.bodyMedium.fontFamily,
                          fontSize: 12,
                          fontWeight: typography.bodyMedium.fontWeight,
                          lineHeight: 16,
                          color: colors.white,
                        }}
                      >
                        {member.role}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Actions Cell */}
                <View style={{ width: 120 }}>
                  <View
                    style={{
                      backgroundColor: cellBg,
                      paddingHorizontal: spacing[20],
                      paddingVertical: spacing[16],
                      height: 72,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing[8],
                      borderBottomWidth: isLastRow ? 0 : 1,
                      borderBottomColor: borderColor,
                      ...(isLastRow && {
                        borderBottomRightRadius: borderRadius.m,
                      }),
                    }}
                  >
                    {onEdit && (
                      <ActionButton
                        icon={Edit2}
                        color={iconColor}
                        onPress={() => onEdit(member.id)}
                        label="Edit"
                      />
                    )}
                    {onDelete && (
                      <ActionButton
                        icon={Trash2}
                        color={iconColor}
                        onPress={() => onDelete(member.id)}
                        label="Delete"
                      />
                    )}
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

function ActionButton({
  icon: Icon,
  color,
  onPress,
  label,
}: {
  icon: React.ComponentType<{ size: number; color: string }>
  color: string
  onPress: () => void
  label: string
}) {
  const { isHovered, interactiveProps } = useInteractiveState(false)

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...interactiveProps}
      style={({ pressed }) => [
        {
          padding: spacing[4],
          borderRadius: borderRadius.s,
          opacity: pressed ? 0.7 : isHovered ? 0.8 : 1,
        },
      ]}
    >
      <Icon size={18} color={color} />
    </Pressable>
  )
}
