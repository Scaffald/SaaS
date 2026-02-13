/**
 * SettingsPageLayout component
 * Main settings page layout with tabs navigation
 *
 * @example
 * ```tsx
 * import { SettingsPageLayout } from '@scaffald/ui'
 *
 * <SettingsPageLayout
 *   tabs={[
 *     { id: 'basic', label: 'Basic Info' },
 *     { id: 'appearance', label: 'Appearance' },
 *   ]}
 *   activeTabId={activeTab}
 *   onTabChange={setActiveTab}
 * >
 *   <SettingsContent />
 * </SettingsPageLayout>
 * ```
 */

import { View, Text, ScrollView, Pressable } from 'react-native'
import type { SettingsPageLayoutProps } from './SettingsPageLayout.types'
import { useThemeContext } from '../../theme'
import { useInteractiveState } from '../../hooks/useInteractiveState'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { boxShadows } from '../../tokens/shadows'

export function SettingsPageLayout({
  tabs,
  activeTabId,
  onTabChange,
  children,
  style,
  contentStyle,
}: SettingsPageLayoutProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTabId)

  const tabBg = isLight ? colors.gray[50] : colors.gray[800]
  const activeTabBg = isLight ? colors.bg.light.default : colors.bg.dark.default
  const textPrimary = isLight ? colors.text.light.primary : colors.text.dark.primary
  const textSecondary = isLight ? colors.text.light.secondary : colors.text.dark.secondary
  const borderColor = isLight ? colors.border.light['200'] : colors.border.dark['200']
  const iconColor = isLight ? colors.gray[600] : colors.gray[300]

  return (
    <View style={[{ flex: 1 }, style]}>
      {/* Tabs Navigation */}
      <View
        style={{
          backgroundColor: tabBg,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
          paddingHorizontal: spacing[20],
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing[4] }}>
            {tabs.map((tab, index) => {
              const isActive = tab.id === activeTabId
              const { isHovered, interactiveProps } = useInteractiveState(tab.disabled || false)

              return (
                <Pressable
                  key={tab.id}
                  onPress={() => !tab.disabled && onTabChange?.(tab.id)}
                  disabled={tab.disabled}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive, disabled: tab.disabled }}
                  {...interactiveProps}
                  style={({ pressed }) => [
                    {
                      paddingHorizontal: spacing[16],
                      paddingVertical: spacing[12],
                      borderBottomWidth: isActive ? 2 : 0,
                      borderBottomColor: isActive
                        ? isLight
                          ? colors.gray[900]
                          : colors.gray[100]
                        : 'transparent',
                      backgroundColor: isActive ? activeTabBg : 'transparent',
                      opacity: tab.disabled ? 0.5 : pressed ? 0.8 : isHovered ? 0.9 : 1,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[8] }}>
                    {tab.icon && (
                      <tab.icon
                        size={18}
                        color={isActive ? (isLight ? colors.gray[900] : colors.gray[100]) : iconColor}
                      />
                    )}
                    <Text
                      style={{
                        fontFamily: typography.bodyMedium.fontFamily,
                        fontSize: 14,
                        fontWeight: isActive ? typography.bodyMedium.fontWeight : typography.body.fontWeight,
                        lineHeight: 20,
                        color: isActive ? textPrimary : textSecondary,
                      }}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      </View>

      {/* Content Area */}
      <ScrollView
        style={[
          {
            flex: 1,
            backgroundColor: activeTabBg,
          },
          contentStyle,
        ]}
        contentContainerStyle={{
          padding: spacing[24],
        }}
      >
        {children}
      </ScrollView>
    </View>
  )
}
