import { ReactNode, useState, ElementRef } from 'react'
import { Card, Image, View, Text, YStack, XStack, Button, Anchor, type CardProps } from 'tamagui'

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
 *   href="/news/123"
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

  // Generate random abstract image as fallback
  const fallbackImage = `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`
  const imageSource = imageError ? fallbackImage : image || fallbackImage

  // Determine if card should be interactive
  const isInteractive = (onPress || href) && !disabled

  const handlePress = () => {
    if (disabled) return
    if (onPress) {
      onPress()
    } else if (href && typeof window !== 'undefined') {
      window.open(href, target)
    }
  }

  const cardContent = (
    <Card
      boxShadow="inset 1px 1px .5px #fff8, inset 2px 5px 25px #0000000f, inset -1px -1px 0 .5px #ddd2, 2px 2px 25px #0001"
      size="$4"
      p="$0"
      rounded="$7"
      bg="$color1"
      mx="$6"
      my="$3"
      minH={minHeight}
      overflow="hidden"
      position="relative"
      cursor={fullCardClickable && isInteractive ? 'pointer' : 'default'}
      onPress={fullCardClickable && isInteractive ? handlePress : undefined}
      pressStyle={fullCardClickable && isInteractive ? { scale: 0.98 } : undefined}
      hoverStyle={fullCardClickable && isInteractive ? { scale: 1.02 } : undefined}
      $sm={{
        mx: '$4',
        boxShadow:
          'inset 1px 1px .5px #fff8, inset 2px 5px 25px #0000000f, inset -1px -1px 0 .5px #ddd2',
      }}
      {...props}
    >
      {/* Background Image */}
      <Image
        source={{ uri: imageSource }}
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        objectFit="cover"
        onError={() => setImageError(true)}
      />

      {/* Overlay with theme-aware gradient */}
      <View
        bg="$color1"
        opacity={0.8}
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        // bg="$backgroundTransparent"
        style={{
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Content Overlay */}
      <YStack flex={1} height="100%" justify="space-between" p="$5" position="relative" zIndex={1}>
        {/* Header Section */}
        {header && (
          <XStack justify="flex-start" items="flex-start">
            {header}
          </XStack>
        )}

        {/* Bottom Content Section */}
        <YStack gap="$3" justify="flex-end">
          {/* Title */}
          <Text fontSize="$6" fontWeight="700" color="$color12" lineHeight="$7" numberOfLines={2}>
            {title}
          </Text>

          {/* Description */}
          {description && (
            <Text fontSize="$4" color="$color11" lineHeight="$5" numberOfLines={3}>
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
                {href && typeof window !== 'undefined' ? (
                  <Anchor href={href} target={target} textDecorationLine="none">
                    <Button
                      size="$3"
                      variant="outlined"
                      theme="alt2"
                      bg="$backgroundTransparent"
                      borderColor="$color8"
                      color="$color12"
                      fontWeight="600"
                      pressStyle={{ scale: 0.95 }}
                      hoverStyle={{
                        backgroundColor: '$color3',
                        borderColor: '$color9',
                      }}
                    >
                      {readMoreText}
                    </Button>
                  </Anchor>
                ) : (
                  <Button
                    size="$3"
                    variant="outlined"
                    theme="alt2"
                    bg="$backgroundTransparent"
                    borderColor="$color8"
                    color="$color12"
                    fontWeight="600"
                    onPress={handlePress}
                    disabled={disabled}
                    pressStyle={{ scale: 0.95 }}
                    hoverStyle={{
                      backgroundColor: '$color3',
                      borderColor: '$color9',
                    }}
                  >
                    {readMoreText}
                  </Button>
                )}
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
