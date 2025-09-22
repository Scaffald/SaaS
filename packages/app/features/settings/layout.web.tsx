import { Separator, XStack, YStack, styled } from '@app/ui'
import { useUser } from '@app/utils/useUser'

import { SettingsScreen } from './screen'

export type SettingsLayoutProps = {
  /**
   * web-only
   */
  isSettingsHome?: boolean
  /**
   * web-only
   */
  children?: React.ReactNode
}

export const SettingsLayout = ({ children, isSettingsHome = false }: SettingsLayoutProps) => {
  const { isPending, user } = useUser()
  const showSkeleton = isPending || !user

  return (
    <XStack separator={<Separator vertical />} f={1}>
      <YStack
        bg="$color1"
        $sm={{ f: 1, dsp: isSettingsHome ? 'flex' : 'none' }}
        // this file is web-only so we can safely use CSS
        style={{
          transition: '200ms ease width',
        }}
        $gtSm={{
          w: 300,
        }}
        $gtLg={{
          w: 400,
        }}
      >
        {showSkeleton ? <SettingsSidebarSkeleton /> : <SettingsScreen />}
      </YStack>
      <YStack my="$10" f={1} ai="center" $sm={{ dsp: isSettingsHome ? 'none' : 'block' }}>
        <YStack w="100%">{showSkeleton ? <SettingsContentSkeleton /> : children}</YStack>
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

const SettingsSidebarSkeleton = () => (
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

const SettingsContentSkeleton = () => (
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
