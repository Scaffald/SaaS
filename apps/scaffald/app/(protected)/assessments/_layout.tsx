import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Drawer } from 'expo-router/drawer'

/**
 * Assessments Layout — Drawer navigation only.
 * Auth, session, and prerequisites are handled by the (protected) group layout.
 * Includes assessments and career explorer.
 */
export default function AssessmentsLayout() {
  const { user } = useUser()

  return (
    <ErrorBoundary
      context={{
        section: 'assessments',
        userId: user?.id,
      }}
    >
      <DrawerLayout protectionComponent={null}>
        <Drawer.Screen name="index" options={{ title: 'Assessments' }} />
        <Drawer.Screen name="pulse/index" options={{ title: 'Weekly Pulse' }} />
        <Drawer.Screen name="ipip/index" options={{ title: 'Personality Assessment' }} />
        <Drawer.Screen name="ipip/results" options={{ title: 'IPIP Results' }} />
        <Drawer.Screen name="ipip/shared/[token]" options={{ title: 'Shared Assessment' }} />
        <Drawer.Screen name="riasec/index" options={{ title: 'Career Interests' }} />
        <Drawer.Screen name="occupation/index" options={{ title: 'Occupation Preferences' }} />
        <Drawer.Screen name="career-explorer/index" options={{ title: 'Career Explorer' }} />
        <Drawer.Screen name="career-explorer/[onetCode]" options={{ title: 'Occupation Detail' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
