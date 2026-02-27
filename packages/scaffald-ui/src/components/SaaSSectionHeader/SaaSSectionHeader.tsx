/**
 * SaaSSectionHeader component
 * Section header for page content areas
 * Maps to Figma "SaaS Section Header" component
 *
 * @example
 * ```tsx
 * import { SaaSSectionHeader } from '@scaffald/ui'
 * import { BarChart } from 'lucide-react-native'
 *
 * // Default variant
 * <SaaSSectionHeader
 *   title="Analytics"
 *   description="Optimize usage with analytics insights"
 *   featuredIcon={BarChart}
 * />
 *
 * // With CTAs
 * <SaaSSectionHeader
 *   variant="ctas"
 *   title="Analytics"
 *   actions={[
 *     { label: 'Export', variant: 'secondary', onPress: () => {} },
 *     { label: 'Settings', variant: 'primary', onPress: () => {} }
 *   ]}
 * />
 *
 * // With tabs below
 * <SaaSSectionHeader
 *   title="Analytics"
 *   tabsBelow
 *   tabs={
 *     <Tabs defaultValue="overview">
 *       <Tabs.Item value="overview">
 *         <Tabs.Trigger>Overview</Tabs.Trigger>
 *       </Tabs.Item>
 *     </Tabs>
 *   }
 * />
 * ```
 */

import { View, Text, StyleSheet } from 'react-native'
import type { SaaSSectionHeaderProps } from './SaaSSectionHeader.types'
import { colors } from '../../tokens/colors'
import {
  getContainerStyles,
  getHeaderRowStyles,
  getLeftSectionStyles,
  getFeaturedIconStyles,
  getTextContainerStyles,
  getTitleStyles,
  getDescriptionStyles,
  getActionsContainerStyles,
  getSearchContainerStyles,
  getTimePeriodContainerStyles,
  getSubHeaderTextStyles,
} from './SaaSSectionHeader.styles'
import { useThemeContext } from '../../theme'
import { Button } from '../Button'
import { Input } from '../Input'
import { Dropdown, DropdownSection, DropdownItem } from '../Dropdown'
import { Search } from 'lucide-react-native'

export function SaaSSectionHeader({
  variant = 'default',
  title,
  description,
  featuredIcon: FeaturedIcon,
  showIcon = true,
  showDescription = true,
  tabsBelow = false,
  actions = [],
  searchValue,
  searchPlaceholder = 'Search...',
  onSearchChange,
  selectedTimePeriod,
  timePeriodOptions = [],
  onTimePeriodChange,
  tabs,
  style,
  titleStyle,
  descriptionStyle,
}: SaaSSectionHeaderProps) {
  const { theme } = useThemeContext()

  const containerStyles = getContainerStyles(tabsBelow, theme)
  const headerRowStyles = getHeaderRowStyles()
  const leftSectionStyles = getLeftSectionStyles()
  const featuredIconStyles = getFeaturedIconStyles(theme)
  const textContainerStyles = getTextContainerStyles()
  const titleStyles = getTitleStyles(theme)
  const descriptionStyles = getDescriptionStyles(theme)

  // Render sub-header variant (simpler, smaller)
  if (variant === 'sub-header') {
    return (
      <View style={[containerStyles, { minHeight: 48 }, style]}>
        <View style={headerRowStyles}>
          <Text style={[getSubHeaderTextStyles(theme), titleStyle]}>{title}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[containerStyles, style]}>
      {/* Main header row */}
      <View style={headerRowStyles}>
        {/* Left section: Icon + Text */}
        <View style={leftSectionStyles}>
          {/* Featured Icon */}
          {showIcon && FeaturedIcon && (
            <View
              style={[
                featuredIconStyles,
                // Web: Use CSS gradient background
                typeof window !== 'undefined' && {
                  background: 'linear-gradient(180deg, #f9fafb 0%, #f2f4f7 100%)',
                } as any,
              ]}
            >
              <FeaturedIcon size={20} color={colors.icon[theme].default} />
            </View>
          )}

          {/* Text content */}
          <View style={textContainerStyles}>
            <Text style={[titleStyles, titleStyle]} numberOfLines={1}>
              {title}
            </Text>
            {showDescription && description && (
              <Text style={[descriptionStyles, descriptionStyle]} numberOfLines={1}>
                {description}
              </Text>
            )}
          </View>
        </View>

        {/* Right section: Variant-specific content */}
        {variant === 'ctas' && actions.length > 0 && (
          <View style={getActionsContainerStyles()}>
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant === 'primary' ? 'filled' : 'outline'}
                color={action.variant === 'primary' ? 'primary' : 'gray'}
                size="sm"
                onPress={action.onPress}
              >
                {action.label}
              </Button>
            ))}
          </View>
        )}

        {variant === 'search' && (
          <View style={getSearchContainerStyles()}>
            <Input
              value={searchValue}
              onChangeText={onSearchChange}
              placeholder={searchPlaceholder}
              iconStart={Search}
              type="classic"
              fullWidth
            />
          </View>
        )}

        {variant === 'time-period' && timePeriodOptions.length > 0 && (
          <View style={getTimePeriodContainerStyles()}>
            <Dropdown
              trigger={timePeriodOptions.find((opt) => opt.value === selectedTimePeriod)?.label || 'Select period'}
              onOpenChange={() => {}}
            >
              <DropdownSection>
                {timePeriodOptions.map((option) => (
                  <DropdownItem
                    key={option.value}
                    selected={option.value === selectedTimePeriod}
                    onPress={() => onTimePeriodChange?.(option.value)}
                  >
                    {option.label}
                  </DropdownItem>
                ))}
              </DropdownSection>
            </Dropdown>
          </View>
        )}
      </View>

      {/* Tabs below header */}
      {tabsBelow && tabs && <View style={styles.tabsContainer}>{tabs}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  tabsContainer: {
    width: '100%',
    marginTop: 0,
  },
})