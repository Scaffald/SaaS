import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Stack } from 'expo-router'

/**
 * Profile Layout — Drawer navigation only.
 * Auth, session, and prerequisites are handled by the (protected) group layout.
 */
export default function ProfileLayout() {
  const { user } = useUser()

  return (
    <ErrorBoundary
      context={{
        section: 'profile',
        userId: user?.id,
      }}
    >
      <DrawerLayout protectionComponent={null}>
        <Stack.Screen name="index" options={{ title: 'Profile Overview' }} />
        <Stack.Screen name="general/index" options={{ title: 'General Info' }} />
        <Stack.Screen name="resume/index" options={{ title: 'Resume' }} />
        <Stack.Screen name="resume/review" options={{ title: 'Resume Review' }} />
        <Stack.Screen name="skills/index" options={{ title: 'Skills' }} />
        <Stack.Screen name="certifications/index" options={{ title: 'Certifications' }} />
        <Stack.Screen name="employment/index" options={{ title: 'Employment' }} />
        <Stack.Screen name="education/index" options={{ title: 'Education' }} />
        <Stack.Screen name="experience/index" options={{ title: 'Experience' }} />
        <Stack.Screen name="verification" options={{ title: 'Verification' }} />
        <Stack.Screen name="id-verification" options={{ title: 'ID Verification' }} />
        <Stack.Screen name="import-review" options={{ title: 'Import Review' }} />
        <Stack.Screen name="background-check/index" options={{ title: 'Background Check' }} />
        <Stack.Screen name="background-check/initiate" options={{ title: 'Start Background Check' }} />
        <Stack.Screen
          name="background-check/[checkId]/dispute"
          options={{ title: 'Dispute Check' }}
        />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
