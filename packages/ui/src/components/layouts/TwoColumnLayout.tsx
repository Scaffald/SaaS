import { Separator, XStack, YStack, styled, useMedia } from '@app/ui'

export type TwoColumnLayoutProps = {
  /**
   * Content for the left sidebar
   */
  sidebar: React.ReactNode
  /**
   * Content for the main content area
   */
  children: React.ReactNode
  /**
   * Whether to show only sidebar on mobile (for home pages)
   */
  isHomePage?: boolean
  /**
   * Whether to show loading skeleton
   */
  isLoading?: boolean
  /**
   * Custom skeleton components
   */
  sidebarSkeleton?: React.ReactNode
  contentSkeleton?: React.ReactNode
  /**
   * Sidebar width on desktop
   */
  sidebarWidth?: number
  /**
   * Sidebar width on large screens
   */
  sidebarWidthLg?: number
  /**
   * Whether to show separator between columns
   */
  showSeparator?: boolean
  /**
   * Content padding
   */
  contentPadding?: number | string
  /**
   * Whether to center content
   */
  centerContent?: boolean
}

export const TwoColumnLayout = ({
  sidebar,
  children,
  isHomePage = false,
  isLoading = false,
  sidebarSkeleton,
  contentSkeleton,
  sidebarWidth = 300,
  sidebarWidthLg = 400,
  showSeparator = true,
  contentPadding = '$10',
  centerContent = true,
}: TwoColumnLayoutProps) => {
  const media = useMedia()

  return (
    <XStack separator={showSeparator ? <Separator vertical /> : undefined} f={1}>
      {/* Sidebar */}
      <YStack
        bg="$color1"
        $sm={{ f: 1, dsp: isHomePage ? 'flex' : 'none' }}
        // this file is web-only so we can safely use CSS
        style={{
          transition: '200ms ease width',
        }}
        $gtSm={{
          w: sidebarWidth,
        }}
        $gtLg={{
          w: sidebarWidthLg,
        }}
      >
        {isLoading ? sidebarSkeleton : sidebar}
      </YStack>

      {/* Main Content */}
      <YStack
        f={1}
        p={contentPadding}
        ai={centerContent ? 'center' : 'flex-start'}
        $sm={{ dsp: isHomePage ? 'none' : 'flex' }}
      >
        <YStack w="100%" maw={centerContent ? 800 : undefined}>
          {isLoading ? contentSkeleton : children}
        </YStack>
      </YStack>
    </XStack>
  )
}

const SkeletonBase = styled(YStack, {
  bg: '$color3',
  o: 0.5,
  br: '$4',
})

type SkeletonLineProps = {
  width?: number | string
  height?: number
  radius?: number | string
}

const SkeletonLine = ({ width = '100%', height = 16, radius }: SkeletonLineProps) => (
  <SkeletonBase w={width} h={height} br={radius ?? '$4'} />
)

const SkeletonCircle = ({ size = 32 }: { size?: number }) => (
  <SkeletonBase w={size} h={size} br={size} />
)

export const TwoColumnSidebarSkeleton = () => (
  <YStack f={1} gap="$4">
    <YStack px="$4" pt="$5" pb="$3" gap="$3">
      <SkeletonLine width="72%" height={28} />
      <SkeletonLine width="60%" height={16} />
    </YStack>
    <YStack gap="$2" px="$3">
      {Array.from({ length: 3 }).map((_, index) => (
        <SkeletonNavItem key={`primary-${index}`} />
      ))}
    </YStack>
    <Separator boc="$color4" mx="$-4" bw="$0.25" />
    <YStack gap="$2" px="$3">
      <SkeletonNavItem />
    </YStack>
    <Separator boc="$color4" mx="$-4" bw="$0.25" />
    <YStack gap="$2" px="$3" pb="$6">
      {Array.from({ length: 2 }).map((_, index) => (
        <SkeletonNavItem key={`secondary-${index}`} />
      ))}
    </YStack>
  </YStack>
)

const SkeletonNavItem = () => (
  <XStack ai="center" gap="$3" py="$3" px="$3" bg="$color2" br="$6">
    <SkeletonCircle />
    <SkeletonLine width="50%" height={16} radius="$2" />
  </XStack>
)

export const TwoColumnContentSkeleton = () => (
  <YStack gap="$5" py="$8" px="$3" $gtSm={{ maw: 600, als: 'center' }} w="100%">
    <YStack gap="$3" px="$1">
      <SkeletonLine width="35%" height={32} />
    </YStack>
    <YStack gap="$5">
      {Array.from({ length: 2 }).map((_, index) => (
        <SkeletonSection key={`section-${index}`} />
      ))}
    </YStack>
  </YStack>
)

const SkeletonSection = () => (
  <YStack gap="$4" boc="$color4" bw="$0.5" p="$4" br="$4">
    <SkeletonLine width="40%" height={24} />
    <Separator boc="$color4" bw="$0.25" />
    <YStack gap="$4">
      {Array.from({ length: 2 }).map((_, index) => (
        <SkeletonKeyValue key={`kv-${index}`} />
      ))}
    </YStack>
  </YStack>
)

const SkeletonKeyValue = () => (
  <XStack ai="center" jc="space-between" gap="$4">
    <SkeletonLine width="25%" height={16} />
    <YStack gap="$2" f={1} ai="flex-end">
      <SkeletonLine width="40%" height={16} />
      <SkeletonLine width="25%" height={12} />
    </YStack>
  </XStack>
)
