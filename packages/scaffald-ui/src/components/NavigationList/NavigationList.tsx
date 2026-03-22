/**
 * NavigationList component
 * iOS 26 sidebar navigation list with search, toolbar, sections, and hierarchical items.
 * Mapped from Figma node 5704:37671.
 *
 * @example
 * ```tsx
 * import { NavigationList } from '@scaffald/ui'
 *
 * <NavigationList
 *   showSearch
 *   searchPlaceholder="Search"
 *   sections={[
 *     {
 *       title: 'Favorites',
 *       items: [
 *         { key: 'inbox', label: 'Inbox', icon: <MailIcon />, detail: '12' },
 *         { key: 'flagged', label: 'Flagged', icon: <FlagIcon /> },
 *       ],
 *     },
 *   ]}
 *   selectedKey="inbox"
 *   onSelectionChange={(key) => console.log(key)}
 * />
 * ```
 */

import { useCallback, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  Platform,
} from 'react-native'
import type { NavigationListProps, NavigationListItem, NavigationListSection } from './NavigationList.types'
import { getNavigationListStyles, getIndentPadding } from './NavigationList.styles'
import { useThemeContext } from '../../theme'
import { useStyles } from '../../hooks'
import { colors } from '../../tokens/colors'

export function NavigationList({
  sections,
  selectedKey,
  onSelectionChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search',
  showSearch = false,
  toolbarActions,
  style,
}: NavigationListProps) {
  const { theme } = useThemeContext()
  const styles = useStyles(getNavigationListStyles, [theme] as const)

  const handleItemPress = useCallback(
    (item: NavigationListItem) => {
      if (item.disabled) return
      item.onPress?.()
      if (onSelectionChange) {
        onSelectionChange(item.key)
      }
    },
    [onSelectionChange]
  )

  const renderSearchBar = useMemo(() => {
    if (!showSearch) return null

    const webInputStyles = Platform.OS === 'web'
      ? ({ outlineStyle: 'none' } as Record<string, unknown>)
      : {}

    return (
      <View style={styles.searchContainer}>
        {/* Search icon */}
        <View style={styles.searchIconContainer}>
          <Text
            style={{
              fontSize: 15,
              color: colors.labelsVibrant[theme].secondary,
            }}
          >
            {'\u2315'}
          </Text>
        </View>

        <TextInput
          style={[styles.searchInput, webInputStyles]}
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.labelsVibrant[theme].tertiary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityRole="search"
          accessibilityLabel={searchPlaceholder}
        />

        {/* Microphone icon */}
        <View style={styles.searchIconContainer}>
          <Text
            style={{
              fontSize: 15,
              color: colors.labelsVibrant[theme].secondary,
            }}
          >
            {'\u{1F399}'}
          </Text>
        </View>
      </View>
    )
  }, [showSearch, searchValue, onSearchChange, searchPlaceholder, styles, theme])

  const renderToolbar = useMemo(() => {
    if (!toolbarActions || toolbarActions.length === 0) return null

    return (
      <View style={styles.toolbarRow}>
        {toolbarActions.map((action, index) => (
          <Pressable
            key={index}
            style={styles.toolbarButton}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            {action.icon ?? (
              <Text style={styles.toolbarButtonText}>{action.label}</Text>
            )}
          </Pressable>
        ))}
      </View>
    )
  }, [toolbarActions, styles])

  const renderAccessory = useCallback(
    (item: NavigationListItem, isSelected: boolean) => {
      if (item.accessoryType === 'toggle') {
        return (
          <Switch
            value={item.accessoryChecked ?? false}
            onValueChange={item.onAccessoryToggle}
            trackColor={{
              false: colors.fills[theme].secondary,
              true: colors.accents[theme].green,
            }}
            thumbColor="#ffffff"
            disabled={item.disabled}
          />
        )
      }

      if (item.accessoryType === 'checkmark' && item.accessoryChecked) {
        return (
          <Text
            style={{
              fontSize: 17,
              color: colors.accents[theme].blue,
              fontWeight: '600',
            }}
          >
            {'\u2713'}
          </Text>
        )
      }

      if (item.accessoryType === 'info') {
        return (
          <Text
            style={{
              fontSize: 17,
              color: colors.accents[theme].blue,
            }}
          >
            {'\u24D8'}
          </Text>
        )
      }

      if (item.accessoryType === 'disclosure') {
        return (
          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: isSelected
                ? colors.accents[theme].blue
                : colors.labelsVibrant[theme].secondary,
            }}
          >
            {'\u203A'}
          </Text>
        )
      }

      return null
    },
    [theme]
  )

  const renderItem = useCallback(
    (item: NavigationListItem) => {
      const isSelected = selectedKey === item.key
      const indentPx = getIndentPadding(item.indent)

      return (
        <Pressable
          key={item.key}
          style={[
            styles.itemContainer,
            isSelected && styles.itemContainerSelected,
            indentPx > 0 && { paddingLeft: 12 + indentPx },
          ]}
          onPress={() => handleItemPress(item)}
          disabled={item.disabled}
          accessibilityRole="button"
          accessibilityState={{
            selected: isSelected,
            disabled: item.disabled,
          }}
          accessibilityLabel={item.label}
        >
          {/* Leading icon */}
          {item.icon != null && (
            <View style={styles.itemIconContainer}>
              {typeof item.icon === 'string' ? (
                <Text
                  style={[
                    styles.itemIcon,
                    isSelected && styles.itemIconSelected,
                    item.disabled && styles.itemIconDisabled,
                  ]}
                >
                  {item.icon}
                </Text>
              ) : (
                item.icon
              )}
            </View>
          )}

          {/* Label */}
          <Text
            style={[
              styles.itemLabel,
              isSelected && styles.itemLabelSelected,
              item.disabled && styles.itemLabelDisabled,
            ]}
            numberOfLines={1}
          >
            {item.label}
          </Text>

          {/* Trailing area */}
          <View style={styles.itemTrailing}>
            {item.detail != null && (
              <Text
                style={[
                  styles.itemDetailText,
                  isSelected && styles.itemDetailTextSelected,
                ]}
              >
                {item.detail}
              </Text>
            )}
            {renderAccessory(item, isSelected)}
          </View>
        </Pressable>
      )
    },
    [selectedKey, styles, handleItemPress, renderAccessory]
  )

  const renderSectionHeader = useCallback(
    (section: NavigationListSection) => {
      if (!section.title) return null

      return (
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
          {(section.detail != null || section.showDisclosure) && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {section.detail != null && (
                <Text style={styles.sectionHeaderDetail}>{section.detail}</Text>
              )}
              {section.showDisclosure && (
                <Text style={styles.sectionHeaderChevron}>{'\u203A'}</Text>
              )}
            </View>
          )}
        </View>
      )
    },
    [styles]
  )

  return (
    <ScrollView
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      accessibilityRole="list"
    >
      {renderSearchBar}
      {renderToolbar}

      {sections.map((section, sectionIndex) => (
        <View key={section.title ?? `section-${sectionIndex}`} style={styles.sectionContainer}>
          {/* Separator between sections (not before the first) */}
          {sectionIndex > 0 && <View style={styles.separator} />}

          {renderSectionHeader(section)}

          {section.items.map((item) => renderItem(item))}
        </View>
      ))}
    </ScrollView>
  )
}

NavigationList.displayName = 'NavigationList'
