import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'
import { Stack } from 'expo-router'

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
        <Stack.Screen name="index" options={{ title: 'Assessments' }} />
        <Stack.Screen name="pulse/index" options={{ title: 'Weekly Pulse' }} />
        <Stack.Screen name="ipip/index" options={{ title: 'Personality Assessment' }} />
        <Stack.Screen name="ipip/results" options={{ title: 'IPIP Results' }} />
        <Stack.Screen name="ipip/shared/[token]" options={{ title: 'Shared Assessment' }} />
        <Stack.Screen name="riasec/index" options={{ title: 'Career Interests' }} />
        <Stack.Screen name="occupation/index" options={{ title: 'Occupation Preferences' }} />
        <Stack.Screen name="career-explorer/index" options={{ title: 'Career Explorer' }} />
        <Stack.Screen name="career-explorer/[onetCode]" options={{ title: 'Occupation Detail' }} />
      </DrawerLayout>
    </ErrorBoundary>
  )
}
