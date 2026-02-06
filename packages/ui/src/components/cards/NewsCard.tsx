import * as Linking from 'expo-linking'
import type { CardProps } from '@tamagui/card'
import { Card } from '@tamagui/card'
import { Image } from '@tamagui/image'
import { Text } from 'tamagui'
import { useTheme, View } from '@tamagui/core'
import { useWindowDimensions } from '@tamagui/use-window-dimensions'
import { XStack, YStack } from '@tamagui/stacks'
import { type ElementRef, type ReactNode, useState } from 'react'

import { borderRadius } from '../../config/radii'
import { cardShadows } from '../../config/shadows'
import { Button } from '../buttons/Button'

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
      padding="$0"
      borderRadius={borderRadius['3xl']}
      backgroundColor="$color1"
      minHeight={minHeight}
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
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        objectFit="cover"
        onError={() => setImageError(true)}
      />

      {/* Overlay with theme-aware gradient */}
      <View
        background="$color1"
        opacity={0.8}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Content Overlay */}
      <YStack
        flex={1}
        height="100%"
        p="$5"
        style={{ justifyContent: 'space-between', position: 'relative', zIndex: 1 }}
      >
        {/* Header Section */}
        {header && (
          <XStack style={{ justifyContent: 'flex-start', alignItems: 'flex-start' }}>
            {header}
          </XStack>
        )}

        {/* Bottom Content Section */}
        <YStack gap="$3" style={{ justifyContent: 'flex-end' }}>
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
          <XStack
            gap="$3"
            style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}
          >
            {/* Custom Footer Content */}
            {footer && (
              <XStack flex={1} style={{ alignItems: 'center' }} gap="$2">
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
                    background: '$blue2',
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
