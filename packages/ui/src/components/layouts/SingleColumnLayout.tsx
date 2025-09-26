import { YStack } from '@app/ui'

export type SingleColumnLayoutProps = {
  /**
   * Main content
   */
  children: React.ReactNode
  /**
   * Whether to center content with max width constraints
   */
  centered?: boolean
  /**
   * Maximum width for centered content
   */
  maxWidth?: number | string
  /**
   * Padding around content
   */
  padding?: number | string
  /**
   * Whether to use full height
   */
  fullHeight?: boolean
}

export const SingleColumnLayout = ({
  children,
  centered = false,
  maxWidth = 1200,
  padding = '$4',
  fullHeight = true,
}: SingleColumnLayoutProps) => {
  return (
    <YStack
      f={fullHeight ? 1 : undefined}
      {...(centered && {
        maw: maxWidth,
        mx: 'auto',
        w: '100%',
      })}
      p={padding}
    >
      {children}
    </YStack>
  )
}
