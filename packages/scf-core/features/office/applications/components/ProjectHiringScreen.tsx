/**
 * Project-Based Hiring Screen
 *
 * Until #1169 this screen was a mock: three hardcoded projects ("Downtown
 * Office Tower — Phase 2" for Meridian Development Group, an ODOT bridge,
 * "$2.4M Labor" budgets), KPI figures computed from that array, a crew list of
 * invented people and a filled "New Project" button with no onPress. An admin
 * could not tell any of it was fake.
 *
 * The schema for it exists (`core.hiring_project_roles`, migration 305), but
 * no api route reads or writes it, so there is nothing real to list. Like the
 * provider screens in #1024, the screen now says the feature is not live and
 * points at the projects that are.
 *
 * @see Issue #99
 */

import { EmptyState, ScreenHeader, Stack } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { HardHat } from 'lucide-react-native'
import { ROUTES } from '@scf/core/constants/routes'

export function ProjectHiringScreen() {
  const router = useRouter()

  return (
    <Stack gap={16}>
      <ScreenHeader
        kicker="Compliance"
        title="Project-based hiring"
        tip="Staffing short-term and seasonal projects role by role."
      />
      <EmptyState
        icon={HardHat}
        title="Project hiring isn't live yet"
        description="Staffing a project's roles and crew from here isn't available yet, so there are no hiring projects to show. Your projects themselves are listed under Projects."
        action={{
          label: 'View projects',
          onPress: () => router.push(ROUTES.OFFICE.CMS.PROJECTS.path as never),
        }}
      />
    </Stack>
  )
}
