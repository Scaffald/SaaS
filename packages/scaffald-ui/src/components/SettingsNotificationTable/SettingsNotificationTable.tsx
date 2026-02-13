/**
 * SettingsNotificationTable component
 * Table for managing notification preferences
 *
 * @example
 * ```tsx
 * import { SettingsNotificationTable } from '@scaffald/ui'
 *
 * <SettingsNotificationTable
 *   preferences={notificationPreferences}
 *   onPreferenceChange={(id, channel, enabled) => {
 *     // Update preference
 *   }}
 * />
 * ```
 */

import { View, Text, ScrollView } from 'react-native'
import type { SettingsNotificationTableProps, NotificationPreference } from './SettingsNotificationTable.types'
import { useThemeContext } from '../../theme'
import { Table, TableColumnHeader, TableCell } from '../Table'
import { Toggle } from '../Toggle'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { shadows } from '../../tokens/shadows'

export function SettingsNotificationTable({
  preferences,
  onPreferenceChange,
  style,
}: SettingsNotificationTableProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Group preferences by category
  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) {
      acc[pref.category] = []
    }
    acc[pref.category].push(pref)
    return acc
  }, {} as Record<string, NotificationPreference[]>)

  const categories = Object.keys(groupedPreferences)

  const handleToggleChange = (id: string, channel: 'email' | 'mobile' | 'inbox' | 'browser', enabled: boolean) => {
    onPreferenceChange?.(id, channel, enabled)
  }

  const headerBg = isLight ? colors.gray[50] : colors.gray[800]
  const cellBg = isLight ? colors.bg.light.default : colors.bg.dark.default
  const borderColor = isLight ? colors.border.light['200'] : colors.border.dark['200']
  const textPrimary = isLight ? colors.text.light.primary : colors.text.dark.primary
  const textSecondary = isLight ? colors.text.light.secondary : colors.text.dark.secondary

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
            {/* Notification Type Column */}
            <View style={{ width: 'auto', minWidth: 200, flex: 1 }}>
              <View
                style={{
                  backgroundColor: headerBg,
                  paddingHorizontal: spacing[20],
                  paddingVertical: spacing[10],
                  borderBottomWidth: 1,
                  borderBottomColor: borderColor,
                  borderTopLeftRadius: borderRadius.m,
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
                  Comments
                </Text>
              </View>
            </View>

            {/* Email Column */}
            <View style={{ width: 150 }}>
              <View
                style={{
                  backgroundColor: headerBg,
                  paddingHorizontal: spacing[20],
                  paddingVertical: spacing[10],
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
                  Email
                </Text>
              </View>
            </View>

            {/* Mobile Column */}
            <View style={{ width: 150 }}>
              <View
                style={{
                  backgroundColor: headerBg,
                  paddingHorizontal: spacing[20],
                  paddingVertical: spacing[10],
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
                  Mobile
                </Text>
              </View>
            </View>

            {/* Inbox Column */}
            <View style={{ width: 150 }}>
              <View
                style={{
                  backgroundColor: headerBg,
                  paddingHorizontal: spacing[20],
                  paddingVertical: spacing[10],
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
                  Inbox
                </Text>
              </View>
            </View>

            {/* Browser Column */}
            <View style={{ width: 186 }}>
              <View
                style={{
                  backgroundColor: headerBg,
                  paddingHorizontal: spacing[20],
                  paddingVertical: spacing[10],
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
                  Browser (Enable)
                </Text>
              </View>
            </View>
          </View>

          {/* Data Rows */}
          {categories.map((category, categoryIndex) => (
            <View key={category}>
              {groupedPreferences[category].map((pref, prefIndex) => {
                const isLastInCategory = prefIndex === groupedPreferences[category].length - 1
                const isLastCategory = categoryIndex === categories.length - 1
                const isLastRow = isLastInCategory && isLastCategory

                return (
                  <View key={pref.id} style={{ flexDirection: 'row' }}>
                    {/* Notification Type Cell */}
                    <View style={{ width: 'auto', minWidth: 200, flex: 1 }}>
                      <View
                        style={{
                          backgroundColor: cellBg,
                          paddingHorizontal: spacing[20],
                          paddingVertical: spacing[20],
                          height: 60,
                          justifyContent: 'center',
                          borderBottomWidth: isLastRow ? 0 : 1,
                          borderBottomColor: borderColor,
                          ...(isLastRow && categoryIndex === 0 && {
                            borderBottomLeftRadius: borderRadius.m,
                          }),
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: typography.bodyMedium.fontFamily,
                            fontSize: 14,
                            fontWeight: typography.bodyMedium.fontWeight,
                            lineHeight: 20,
                            color: textPrimary,
                          }}
                        >
                          {pref.name}
                        </Text>
                      </View>
                    </View>

                    {/* Email Toggle Cell */}
                    <View style={{ width: 150 }}>
                      <View
                        style={{
                          backgroundColor: cellBg,
                          paddingHorizontal: spacing[20],
                          paddingVertical: spacing[20],
                          height: 60,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderBottomWidth: isLastRow ? 0 : 1,
                          borderBottomColor: borderColor,
                        }}
                      >
                        <Toggle
                          checked={pref.email}
                          onChange={(enabled) => handleToggleChange(pref.id, 'email', enabled)}
                          size="sm"
                          color="primary"
                        />
                      </View>
                    </View>

                    {/* Mobile Toggle Cell */}
                    <View style={{ width: 150 }}>
                      <View
                        style={{
                          backgroundColor: cellBg,
                          paddingHorizontal: spacing[20],
                          paddingVertical: spacing[20],
                          height: 60,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderBottomWidth: isLastRow ? 0 : 1,
                          borderBottomColor: borderColor,
                        }}
                      >
                        <Toggle
                          checked={pref.mobile}
                          onChange={(enabled) => handleToggleChange(pref.id, 'mobile', enabled)}
                          size="sm"
                          color="primary"
                        />
                      </View>
                    </View>

                    {/* Inbox Toggle Cell */}
                    <View style={{ width: 150 }}>
                      <View
                        style={{
                          backgroundColor: cellBg,
                          paddingHorizontal: spacing[20],
                          paddingVertical: spacing[20],
                          height: 60,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderBottomWidth: isLastRow ? 0 : 1,
                          borderBottomColor: borderColor,
                        }}
                      >
                        <Toggle
                          checked={pref.inbox}
                          onChange={(enabled) => handleToggleChange(pref.id, 'inbox', enabled)}
                          size="sm"
                          color="primary"
                        />
                      </View>
                    </View>

                    {/* Browser Toggle Cell */}
                    <View style={{ width: 186 }}>
                      <View
                        style={{
                          backgroundColor: cellBg,
                          paddingHorizontal: spacing[20],
                          paddingVertical: spacing[20],
                          height: 60,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderBottomWidth: isLastRow ? 0 : 1,
                          borderBottomColor: borderColor,
                          ...(isLastRow && categoryIndex === 0 && {
                            borderBottomRightRadius: borderRadius.m,
                          }),
                        }}
                      >
                        <Toggle
                          checked={pref.browser}
                          onChange={(enabled) => handleToggleChange(pref.id, 'browser', enabled)}
                          size="sm"
                          color="primary"
                        />
                      </View>
                    </View>
                  </View>
                )
              })}

              {/* Category Header (if not first category) */}
              {categoryIndex < categories.length - 1 && (
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ width: 'auto', minWidth: 200, flex: 1 }}>
                    <View
                      style={{
                        backgroundColor: headerBg,
                        paddingHorizontal: spacing[20],
                        paddingVertical: spacing[10],
                        borderBottomWidth: 1,
                        borderBottomColor: borderColor,
                        borderTopWidth: 1,
                        borderTopColor: borderColor,
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
                        {categories[categoryIndex + 1]}
                      </Text>
                    </View>
                  </View>
                  <View style={{ width: 150 }}>
                    <View
                      style={{
                        backgroundColor: headerBg,
                        paddingHorizontal: spacing[20],
                        paddingVertical: spacing[10],
                        borderBottomWidth: 1,
                        borderBottomColor: borderColor,
                        borderTopWidth: 1,
                        borderTopColor: borderColor,
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
                        Email
                      </Text>
                    </View>
                  </View>
                  <View style={{ width: 150 }}>
                    <View
                      style={{
                        backgroundColor: headerBg,
                        paddingHorizontal: spacing[20],
                        paddingVertical: spacing[10],
                        borderBottomWidth: 1,
                        borderBottomColor: borderColor,
                        borderTopWidth: 1,
                        borderTopColor: borderColor,
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
                        Mobile
                      </Text>
                    </View>
                  </View>
                  <View style={{ width: 150 }}>
                    <View
                      style={{
                        backgroundColor: headerBg,
                        paddingHorizontal: spacing[20],
                        paddingVertical: spacing[10],
                        borderBottomWidth: 1,
                        borderBottomColor: borderColor,
                        borderTopWidth: 1,
                        borderTopColor: borderColor,
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
                        Inbox
                      </Text>
                    </View>
                  </View>
                  <View style={{ width: 186 }}>
                    <View
                      style={{
                        backgroundColor: headerBg,
                        paddingHorizontal: spacing[20],
                        paddingVertical: spacing[10],
                        borderBottomWidth: 1,
                        borderBottomColor: borderColor,
                        borderTopWidth: 1,
                        borderTopColor: borderColor,
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
                        Browser (Enable)
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
