import { ScrollView, YStack } from 'tamagui'

export type ColumnWrapperProps = {
  children: React.ReactNode
  padding?: number | string
}

export const ColumnWrapper = ({ children, padding = '$4' }: ColumnWrapperProps) => {
  return (
    <ScrollView f={1} showsVerticalScrollIndicator={false}>
      <YStack p={padding}>{children}</YStack>
    </ScrollView>
  )
}
