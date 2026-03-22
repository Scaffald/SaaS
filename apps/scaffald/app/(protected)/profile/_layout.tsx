import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Drawer } from 'expo-router/drawer'

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
        <Drawer.Screen name="index" options={{ title: 'Profile Overview' }} />
        <Drawer.Screen name="general/index" options={{ title: 'General Info' }} />
        <Drawer.Screen name="resume/index" options={{ title: 'Resume' }} />
        <Drawer.Screen name="resume/review" options={{ title: 'Resume Review' }} />
        <Drawer.Screen name="skills/index" options={{ title: 'Skills' }} />
        <Drawer.Screen name="certifications/index" options={{ title: 'Certifications' }} />
        <Drawer.Screen name="employment/index" options={{ title: 'Employment' }} />
        <Drawer.Screen name="education/index" options={{ title: 'Education' }} />
        <Drawer.Screen name="experience/index" options={{ title: 'Experience' }} />
        <Drawer.Screen name="verification" options={{ title: 'Verification' }} />
        <Drawer.Screen name="id-verification" options={{ title: 'ID Verification' }} />
        <Drawer.Screen name="import-review" options={{ title: 'Import Review' }} />
        <Drawer.Screen name="background-check/index" options={{ title: 'Background Check' }} />
        <Drawer.Screen name="background-check/initiate" options={{ title: 'Start Background Check' }} />
        <Drawer.Screen
          name="background-check/[checkId]/dispute"
          options={{ title: 'Dispute Check' }}
        />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
