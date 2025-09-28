import { Text, YStack } from 'tamagui'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function ProfileExperiencePage() {
  return (
    <DashboardLayout
      header={{ title: 'Experience Profile' }}
      rightContent={
        <YStack padding="$4">
          <Text>Experience profile page - Coming soon</Text>
        </YStack>
      }
    />
  )
}
