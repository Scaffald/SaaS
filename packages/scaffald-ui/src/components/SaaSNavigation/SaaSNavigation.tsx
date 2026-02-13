/**
 * SaaSNavigation component
 * Main navigation header component
 * Maps to Figma "SaaS Navigation" component
 *
 * @example
 * ```tsx
 * import { SaaSNavigation } from '@scaffald/ui'
 * import { Dashboard, Search, Bell } from 'lucide-react-native'
 *
 * // Main navigation
 * <SaaSNavigation
 *   variant="main"
 *   pageTitle="Dashboard"
 *   description="Overview of your account"
 *   featuredIcon={Dashboard}
 *   showNotifications
 *   notificationBadge={5}
 *   onNotificationPress={() => console.log('Notifications')}
 *   avatarSrc="https://example.com/avatar.jpg"
 * />
 *
 * // With breadcrumbs and tabs
 * <SaaSNavigation
 *   variant="main"
 *   pageTitle="Analytics"
 *   showBreadcrumbs
 *   breadcrumbItems={[
 *     { label: 'Home' },
 *     { label: 'Analytics' }
 *   ]}
 *   breadcrumbCurrentIndex={1}
 *   showTabs
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
import type { SaaSNavigationProps } from './SaaSNavigation.types'
import {
  getContainerStyles,
  getMainContentStyles,
  getHeaderContentStyles,
  getFeaturedIconStyles,
  getTitleStyles,
  getDescriptionStyles,
  getActionsMenuStyles,
  getNotificationsContainerStyles,
  getCtasContainerStyles,
} from './SaaSNavigation.styles'
import { useThemeContext } from '../../theme'
import { NavIconButton } from '../NavIconButton'
import { Avatar, AvatarGroup } from '../Avatar'
import { Button } from '../Button'
import { Breadcrumb } from '../Breadcrumb'
import { Search, Bell } from 'lucide-react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'

export function SaaSNavigation({
  variant = 'main',
  pageTitle,
  description,
  featuredIcon: FeaturedIcon,
  showFeaturedIcon = true,
  showPageTitle = true,
  showDescription = true,
  showBreadcrumbs = false,
  breadcrumbItems = [],
  breadcrumbCurrentIndex = 0,
  onBreadcrumbItemPress,
  showNotifications = true,
  notificationBadge,
  onNotificationPress,
  onSearchPress,
  showAvatar = true,
  avatarSrc,
  avatarInitials,
  onAvatarPress,
  showAvatarGroup = false,
  avatarGroupItems = [],
  showCta = false,
  ctaActions = [],
  showTabs = false,
  tabs,
  style,
  titleStyle,
  descriptionStyle,
  accessibilityLabel,
}: SaaSNavigationProps) {
  const { theme } = useThemeContext()

  const containerStyles = getContainerStyles(variant, showTabs, theme)
  const mainContentStyles = getMainContentStyles()
  const headerContentStyles = getHeaderContentStyles()
  const featuredIconStyles = getFeaturedIconStyles(theme)
  const titleStyles = getTitleStyles(theme)
  const descriptionStyles = getDescriptionStyles(theme)

  // Footer variant - simplified layout
  if (variant === 'footer') {
    return (
      <View
        style={[containerStyles, { minHeight: 72, paddingVertical: spacing[0] }, style]}
        {...({ accessibilityRole: 'navigation' } as any)}
        accessibilityLabel={accessibilityLabel || 'Footer navigation'}
      >
        <Text style={[titleStyles, titleStyle]}>{pageTitle || ''}</Text>
      </View>
    )
  }

  // Onboarding variant - minimal layout
  if (variant === 'onboarding') {
    return (
      <View
        style={[containerStyles, { minHeight: 76, paddingVertical: spacing[0] }, style]}
        {...({ accessibilityRole: 'navigation' } as any)}
        accessibilityLabel={accessibilityLabel || 'Onboarding navigation'}
      >
        {showPageTitle && pageTitle && (
          <Text style={[titleStyles, titleStyle]}>{pageTitle}</Text>
        )}
      </View>
    )
  }

  // Left Side Links variant - minimal with left alignment
  if (variant === 'left-side-links') {
    return (
      <View
        style={[containerStyles, { minHeight: 72, paddingVertical: spacing[0] }, style]}
        {...({ accessibilityRole: 'navigation' } as any)}
        accessibilityLabel={accessibilityLabel || 'Navigation links'}
      >
        {showPageTitle && pageTitle && (
          <Text style={[titleStyles, titleStyle]}>{pageTitle}</Text>
        )}
      </View>
    )
  }

  // Finance-Banking variant - similar to main but with specific styling
  if (variant === 'finance-banking') {
    return (
      <View
        style={[
          containerStyles,
          { minHeight: 138, paddingVertical: spacing[0] },
          style,
        ]}
        {...({ accessibilityRole: 'navigation' } as any)}
        accessibilityLabel={accessibilityLabel || 'Finance banking navigation'}
      >
        {showFeaturedIcon && FeaturedIcon && (
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
        <View style={mainContentStyles}>
          {showPageTitle && pageTitle && (
            <View style={headerContentStyles}>
              <Text style={[titleStyles, titleStyle]} numberOfLines={1}>
                {pageTitle}
              </Text>
              {showDescription && description && (
                <Text style={[descriptionStyles, descriptionStyle]} numberOfLines={1}>
                  {description}
                </Text>
              )}
            </View>
          )}
          {showBreadcrumbs && breadcrumbItems.length > 0 && (
            <Breadcrumb
              items={breadcrumbItems}
              currentIndex={breadcrumbCurrentIndex}
              onItemPress={onBreadcrumbItemPress}
            />
          )}
        </View>
        {showTabs && tabs && <View style={styles.tabsContainer}>{tabs}</View>}
      </View>
    )
  }

  // Main navigation variant (default)
  const mainNavigationContent = (
    <View
      style={[containerStyles, style]}
      {...({ accessibilityRole: 'navigation' } as any)}
      accessibilityLabel={accessibilityLabel || 'Main navigation'}
    >
      {/* Left section: Icon + Content */}
      {showFeaturedIcon && FeaturedIcon && (
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

      <View style={mainContentStyles}>
        {/* Header content: Title + Description */}
        {showPageTitle && (
          <View style={headerContentStyles}>
            {pageTitle && (
              <Text style={[titleStyles, titleStyle]} numberOfLines={1}>
                {pageTitle}
              </Text>
            )}
            {showDescription && description && (
              <Text style={[descriptionStyles, descriptionStyle]} numberOfLines={1}>
                {description}
              </Text>
            )}
          </View>
        )}

        {/* Breadcrumbs */}
        {showBreadcrumbs && breadcrumbItems.length > 0 && (
          <Breadcrumb
            items={breadcrumbItems}
            currentIndex={breadcrumbCurrentIndex}
            onItemPress={onBreadcrumbItemPress}
          />
        )}
      </View>

      {/* Right section: Actions menu */}
      <View style={getActionsMenuStyles()}>
        {/* Notifications */}
        {showNotifications && (
          <View style={getNotificationsContainerStyles()}>
            {onSearchPress && (
              <NavIconButton icon={Search} variant="light" onPress={onSearchPress} />
            )}
            <NavIconButton
              icon={Bell}
              variant="light"
              badge={notificationBadge ? 'number' : undefined}
              badgeValue={notificationBadge}
              showBadge={!!notificationBadge}
              onPress={onNotificationPress}
            />
          </View>
        )}

        {/* Avatar Group */}
        {showAvatarGroup && avatarGroupItems && avatarGroupItems.length > 0 && (
          <AvatarGroup size={32} max={6} spacing={-14}>
            {avatarGroupItems.map((avatar, index) => (
              <Avatar
                key={avatar.src || avatar.initials || `avatar-${index}`}
                src={avatar.src}
                initials={avatar.initials}
                alt={avatar.alt}
                size={32}
              />
            ))}
          </AvatarGroup>
        )}

        {/* CTAs */}
        {showCta && ctaActions.length > 0 && (
          <View style={getCtasContainerStyles()}>
            {ctaActions.map((action) => (
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

        {/* Avatar */}
        {showAvatar && !showAvatarGroup && (
          <Avatar src={avatarSrc} initials={avatarInitials} size={40} onPress={onAvatarPress} />
        )}
      </View>
    </View>
  )

  // Render tabs below if needed
  if (showTabs && tabs) {
    return (
      <View style={style}>
        {mainNavigationContent}
        <View style={styles.tabsContainer}>{tabs}</View>
      </View>
    )
  }

  return mainNavigationContent
}

const styles = StyleSheet.create({
  tabsContainer: {
    width: '100%',
    marginTop: spacing[0], // Tabs are directly below navigation in Figma
  },
})