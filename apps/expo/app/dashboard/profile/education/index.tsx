import { Text, YStack } from 'tamagui'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function ProfileEducationPage() {
  return (
    <DashboardLayout
      header={{ title: 'Education Profile' }}
      rightContent={
        <YStack padding="$4">
          <Text>Education profile page - Coming soon</Text>
        </YStack>
      }
    />
  )
}
