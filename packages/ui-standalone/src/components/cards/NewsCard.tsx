import * as Linking from 'expo-linking'
import { type ElementRef, type ReactNode, useState } from 'react'
import {
  Button,
  Card,
  type CardProps,
  Image,
  Text,
  useTheme,
  useWindowDimensions,
  View,
  XStack,
  YStack,
} from 'tamagui'
import { borderRadius } from '../../config/radii'
import { cardShadows } from '../../config/shadows'

/**
 * NewsCard - A reusable news card component with image overlay
 *
 * Features:
 * - Image background with fallback to abstract placeholder
 * - Overlay with theme-aware gradient and blur effect
 * - Flexible header and footer content areas
 * - Multiple linking options (full card, read more, or both)
 * - Cross-platform compatibility
 * - Consistent styling with DashboardWidget
 *
 * @param image - Image URL (defaults to abstract placeholder)
 * @param title - News article title
 * @param description - News article description
 * @param header - Content rendered at top of overlay (ReactNode)
 * @param footer - Content rendered at bottom of overlay (ReactNode)
 * @param href - Web URL for linking
 * @param onPress - Cross-platform press handler
 * @param fullCardClickable - Makes entire card clickable
 * @param showReadMore - Shows "Read more" link in footer
 * @param readMoreText - Custom read more text
 * @param target - Link target for web
 * @param disabled - Disables all interactions
 * @param minHeight - Minimum card height
 * @param props - Additional Card props
 * @returns JSX element
 *
 * @example
 * ```tsx
 * <NewsCard
 *   title="Breaking News"
 *   description="This is a sample news description..."
 *   header={<Badge>Technology</Badge>}
 *   footer={<Text fontSize="$2" color="$color11">2 hours ago</Text>}
 *   href={ROUTES.DASHBOARD.NEWS.path}
 *   fullCardClickable
 * />
 * ```
 */
export const NewsCard = ({
  image,
  title,
  description,
  header,
  footer,
  href,
  onPress,
  fullCardClickable = false,
  showReadMore = false,
  readMoreText = 'Read more',
  target = '_self',
  disabled = false,
  minHeight = 280,
  ...props
}: NewsCardProps) => {
  const [imageError, setImageError] = useState(false)
  const theme = useTheme()
  // Use window dimensions for text truncation behavior
  // Breakpoint: 800px (matches Tamagui $sm/$md breakpoint)
  const { width } = useWindowDimensions()
  const isDark = theme.background.val.includes('8%')
  // Use responsive numberOfLines: 3 lines on small screens, 2 lines on larger screens for title
  // 4 lines on small screens, 3 lines on larger screens for description
  const titleNumberOfLines = width <= 800 ? 3 : 2
  const descriptionNumberOfLines = width <= 800 ? 4 : 3

  // Generate random abstract image as fallback
  const fallbackImage = `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`
  const imageSource = imageError ? fallbackImage : image || fallbackImage

  // Determine if card should be interactive
  const isInteractive = (onPress || href) && !disabled

  const handlePress = () => {
    if (disabled) return
    if (onPress) {
      onPress()
    } else if (href) {
      Linking.openURL(href)
    }
  }

  const cardContent = (
    <Card
      boxShadow={isDark ? cardShadows.dark : cardShadows.elevated}
      size="$4"
      p="$0"
      rounded={borderRadius['3xl']}
      bg="$color1"
      minH={minHeight}
      overflow="hidden"
      position="relative"
      cursor={fullCardClickable && isInteractive ? 'pointer' : 'default'}
      onPress={fullCardClickable && isInteractive ? handlePress : undefined}
      animation="quick"
      pressStyle={
        fullCardClickable && isInteractive
          ? {
              scale: 0.98,
              boxShadow: isDark ? cardShadows.darkPress : cardShadows.lightPress,
            }
          : undefined
      }
      hoverStyle={
        fullCardClickable && isInteractive
          ? {
              scale: 1.02,
              boxShadow: isDark ? cardShadows.darkHover : cardShadows.elevatedHover,
            }
          : undefined
      }
      {...props}
    >
      {/* Background Image */}
      <Image
        source={{ uri: imageSource }}
        position="absolute"
        t={0}
        l={0}
        r={0}
        b={0}
        objectFit="cover"
        onError={() => setImageError(true)}
      />

      {/* Overlay with theme-aware gradient */}
      <View
        bg="$color1"
        opacity={0.8}
        position="absolute"
        t={0}
        l={0}
        r={0}
        b={0}
        // bg="$backgroundTransparent"
        style={{
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Content Overlay */}
      <YStack flex={1} height="100%" justify="space-between" p="$5" position="relative" z={1}>
        {/* Header Section */}
        {header && (
          <XStack justify="flex-start" items="flex-start">
            {header}
          </XStack>
        )}

        {/* Bottom Content Section */}
        <YStack gap="$3" justify="flex-end">
          {/* Title */}
          <Text
            fontSize="$6"
            fontWeight="700"
            color="$color12"
            lineHeight="$7"
            numberOfLines={titleNumberOfLines}
          >
            {title}
          </Text>

          {/* Description */}
          {description && (
            <Text
              fontSize="$4"
              color="$color11"
              lineHeight="$5"
              numberOfLines={descriptionNumberOfLines}
            >
              {description}
            </Text>
          )}

          {/* Footer Section */}
          <XStack justify="space-between" items="center" gap="$3" flexWrap="wrap">
            {/* Custom Footer Content */}
            {footer && (
              <XStack flex={1} items="center" gap="$2">
                {footer}
              </XStack>
            )}

            {/* Read More Link */}
            {showReadMore && isInteractive && (
              <XStack>
                <Button
                  size="$3"
                  variant="outlined"
                  borderColor="$blue7"
                  color="$color12"
                  fontWeight="600"
                  onPress={handlePress}
                  disabled={disabled}
                  animation="quick"
                  pressStyle={{ scale: 0.95 }}
                  hoverStyle={{
                    bg: '$blue2',
                    borderColor: '$blue8',
                  }}
                >
                  {readMoreText}
                </Button>
              </XStack>
            )}
          </XStack>
        </YStack>
      </YStack>
    </Card>
  )

  return cardContent
}

export interface NewsCardProps extends Omit<CardProps, 'children'> {
  /** Image URL (defaults to abstract placeholder) */
  image?: string
  /** News article title */
  title: string
  /** News article description */
  description?: string
  /** Content rendered at top of overlay */
  header?: ReactNode
  /** Content rendered at bottom of overlay */
  footer?: ReactNode
  /** Web URL for linking */
  href?: string
  /** Cross-platform press handler */
  onPress?: () => void
  /** Makes entire card clickable */
  fullCardClickable?: boolean
  /** Shows "Read more" link in footer */
  showReadMore?: boolean
  /** Custom read more text */
  readMoreText?: string
  /** Link target for web */
  target?: '_blank' | '_self'
  /** Disables all interactions */
  disabled?: boolean
  /** Minimum card height */
  minHeight?: number
}

export type NewsCardRef = ElementRef<typeof Card>
